import Subscription from 'model/Subscription';
import BillingCycle from 'model/BillingCycle';
import CustomerAccount from 'model/CustomerAccount';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { init_logger } from 'util/logger';
import db from 'util/db';
import {
  SubscriptionStatus,
  BillingCycleStatus,
  BillingAccountRating,
  SubscriptionProcessingStatus,
} from '@prisma/client';

const logger = init_logger('subscription:billing_cycle_aging');

// Time window before BC end to trigger transition (8 hours in milliseconds)
const TRANSITION_WINDOW_MS = 8 * 60 * 60 * 1000;

// Monthly subscription amount in cents ($11.99)
const SUBSCRIPTION_AMOUNT_CENTS = 1199;

export interface BillingCycleAgingResult {
  processed_count: number;
  transitioned_trials: number;
  created_billing_cycles: number;
  cancelled_subscriptions: number;
  updated_overdue: number;
  errors: string[];
}

/**
 * Process billing cycle aging for all eligible subscriptions.
 * This should be run as a scheduled job (e.g., every hour).
 *
 * Logic:
 * 1. Find subscriptions where current BC is ending soon (within 8 hours)
 * 2. For TRIAL ending: create new BC (status=NEW), transition subscription to ACTIVE
 * 3. For ACTIVE/PAYMENT_FAILED: create new BC, schedule payment
 * 4. For SCHEDULED_CANCELLATION with ended BC: set status=CANCELLED
 * 5. Track days_overdue and update account rating
 */
export async function billing_cycle_aging(): Promise<Result<BillingCycleAgingResult, ApplicationError>> {
  const result: BillingCycleAgingResult = {
    processed_count: 0,
    transitioned_trials: 0,
    created_billing_cycles: 0,
    cancelled_subscriptions: 0,
    updated_overdue: 0,
    errors: [],
  };

  try {
    logger.info('Starting billing cycle aging process');

    const now = new Date();
    const window_end = new Date(now.getTime() + TRANSITION_WINDOW_MS);

    // Find subscriptions that need processing
    // 1. BC is ending soon (within 8 hours)
    // 2. Subscription is not already being processed
    // 3. Subscription is in a state that requires aging
    const subscriptions = await db.subscription.findMany({
      where: {
        processing_status: SubscriptionProcessingStatus.NONE,
        status: {
          in: [
            SubscriptionStatus.TRIAL,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAYMENT_FAILED,
            SubscriptionStatus.OVERDUE,
            SubscriptionStatus.SCHEDULED_CANCELLATION,
          ],
        },
        current_billing_cycle: {
          end_date: {
            lte: window_end,
          },
        },
      },
      include: {
        current_billing_cycle: true,
        account: true,
      },
    });

    logger.info({ count: subscriptions.length }, 'Found subscriptions to process');

    for (const sub of subscriptions) {
      try {
        // Lock subscription for processing
        await db.subscription.update({
          where: { id: sub.id },
          data: {
            processing_status: SubscriptionProcessingStatus.PROCESSING,
            last_marking_start: now,
          },
        });

        const current_bc = sub.current_billing_cycle;
        if (!current_bc) {
          logger.warn({ subscription_id: sub.id }, 'Subscription has no current billing cycle');
          continue;
        }

        const bc_end_date = new Date(current_bc.end_date);
        const bc_has_ended = bc_end_date <= now;

        // Handle based on subscription status
        if (sub.status === SubscriptionStatus.SCHEDULED_CANCELLATION) {
          // If BC has ended, finalize cancellation
          if (bc_has_ended) {
            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: SubscriptionStatus.CANCELLED,
                processing_status: SubscriptionProcessingStatus.NONE,
                last_marking_end: now,
              },
            });
            result.cancelled_subscriptions++;
            logger.info({ subscription_id: sub.id }, 'Subscription cancelled');
          }
        } else if (
          sub.status === SubscriptionStatus.TRIAL ||
          sub.status === SubscriptionStatus.ACTIVE ||
          sub.status === SubscriptionStatus.PAYMENT_FAILED ||
          sub.status === SubscriptionStatus.OVERDUE
        ) {
          // Check if current BC is PAID, TRIAL, or FREE_CREDIT
          const paid_statuses: BillingCycleStatus[] = [
            BillingCycleStatus.PAID,
            BillingCycleStatus.TRIAL,
            BillingCycleStatus.FREE_CREDIT,
          ];
          const bc_is_paid = current_bc.status && paid_statuses.includes(current_bc.status);

          if (bc_is_paid && bc_has_ended) {
            // Create new billing cycle
            const new_bc_start = bc_end_date;
            const new_bc_end = new Date(bc_end_date);
            new_bc_end.setMonth(new_bc_end.getMonth() + 1);

            const new_bc = await db.billingCycle.create({
              data: {
                subscription_id: sub.id,
                start_date: new_bc_start,
                end_date: new_bc_end,
                status: BillingCycleStatus.NEW,
                payment_amount: SUBSCRIPTION_AMOUNT_CENTS,
              },
            });

            // Update subscription
            const new_status = sub.status === SubscriptionStatus.TRIAL
              ? SubscriptionStatus.ACTIVE
              : sub.status;

            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: new_status,
                current_billing_cycle_id: new_bc.id,
                processing_status: SubscriptionProcessingStatus.NONE,
                last_marking_end: now,
              },
            });

            result.created_billing_cycles++;
            if (sub.status === SubscriptionStatus.TRIAL) {
              result.transitioned_trials++;
              logger.info({ subscription_id: sub.id }, 'Trial transitioned to active');
            }

            logger.info(
              { subscription_id: sub.id, new_bc_id: new_bc.id },
              'Created new billing cycle'
            );
          } else if (!bc_is_paid) {
            // BC is UNPAID/NEW - update days overdue
            const days_overdue = Math.floor(
              (now.getTime() - new Date(current_bc.start_date).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Update billing cycle days_overdue
            await db.billingCycle.update({
              where: { id: current_bc.id },
              data: { days_overdue },
            });

            // Determine new status and rating based on days overdue
            let new_status: SubscriptionStatus = sub.status as SubscriptionStatus;
            let new_rating: BillingAccountRating | null = null;

            if (days_overdue >= 180) {
              new_status = SubscriptionStatus.WRITTEN_OFF;
              new_rating = BillingAccountRating.WRITTEN_OFF;
            } else if (days_overdue >= 120) {
              new_status = SubscriptionStatus.OVERDUE;
              new_rating = BillingAccountRating.D120;
            } else if (days_overdue >= 90) {
              new_status = SubscriptionStatus.OVERDUE;
              new_rating = BillingAccountRating.D90;
            } else if (days_overdue >= 60) {
              new_status = SubscriptionStatus.OVERDUE;
              new_rating = BillingAccountRating.D60;
            } else if (days_overdue >= 30) {
              new_status = SubscriptionStatus.OVERDUE;
              new_rating = BillingAccountRating.D30;
            } else if (days_overdue > 0) {
              new_status = SubscriptionStatus.PAYMENT_FAILED;
            }

            // Update subscription
            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: new_status,
                processing_status: SubscriptionProcessingStatus.NONE,
                last_marking_end: now,
              },
            });

            // Update account rating if needed
            if (new_rating && sub.account_id) {
              await db.customerAccount.update({
                where: { id: sub.account_id },
                data: { rating: new_rating },
              });
            }

            result.updated_overdue++;
            logger.info(
              { subscription_id: sub.id, days_overdue, new_status },
              'Updated overdue subscription'
            );
          } else {
            // BC is paid but hasn't ended yet - just release the lock
            await db.subscription.update({
              where: { id: sub.id },
              data: {
                processing_status: SubscriptionProcessingStatus.NONE,
                last_marking_end: now,
              },
            });
          }
        }

        result.processed_count++;
      } catch (err) {
        const error_msg = `Error processing subscription ${sub.id}: ${err.message}`;
        result.errors.push(error_msg);
        logger.error({ subscription_id: sub.id, error: err }, 'Error processing subscription');

        // Release the lock
        try {
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              processing_status: SubscriptionProcessingStatus.NONE,
            },
          });
        } catch (unlock_err) {
          logger.error({ subscription_id: sub.id, error: unlock_err }, 'Failed to release lock');
        }
      }
    }

    logger.info(
      {
        processed_count: result.processed_count,
        transitioned_trials: result.transitioned_trials,
        created_billing_cycles: result.created_billing_cycles,
        cancelled_subscriptions: result.cancelled_subscriptions,
        updated_overdue: result.updated_overdue,
        errors_count: result.errors.length,
      },
      'Billing cycle aging process completed'
    );

    return Result.success(result);
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
      },
      'Server internal error encountered during billing_cycle_aging'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default billing_cycle_aging;
