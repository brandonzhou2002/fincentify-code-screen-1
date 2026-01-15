import User from 'model/User';
import Subscription from 'model/Subscription';
import BillingCycle from 'model/BillingCycle';
import CustomerAccount from 'model/CustomerAccount';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { SubscriptionNotFound, InvalidSubscriptionState } from 'common/subscription_errors';
import { init_logger } from 'util/logger';
import db from 'util/db';
import {
  SubscriptionStatus,
  BillingCycleStatus,
  BillingAccountStatus,
  BillingAccountRating,
} from '@prisma/client';

const logger = init_logger('subscription:restart_membership');

// Statuses that allow restart
const RESTARTABLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.CANCELLED,
  SubscriptionStatus.DEACTIVATED,
  SubscriptionStatus.SCHEDULED_CANCELLATION,
];

// Monthly subscription amount in cents ($11.99)
const SUBSCRIPTION_AMOUNT_CENTS = 1199;

export interface RestartMembershipInput {
  user: User;
}

export interface RestartMembershipResult {
  subscription: Subscription;
  billing_cycle: BillingCycle | null;
}

/**
 * Restart a cancelled, deactivated, or scheduled-for-cancellation membership.
 *
 * Logic:
 * - SCHEDULED_CANCELLATION: Simply re-enable (no charge needed)
 * - CANCELLED/DEACTIVATED: Create new billing cycle and activate
 */
export async function restart_membership(input: RestartMembershipInput): Promise<Result<RestartMembershipResult, ApplicationError>> {
  const { user } = input;

  try {
    logger.info({ user_id: user.id }, 'Restarting membership');

    // Fetch subscription
    const subscription_result = await Subscription.fetch_by_customer_id(user.id);
    if (!subscription_result.ok) {
      logger.error({ user_id: user.id, error: subscription_result.error }, 'Failed to fetch subscription');
      return Result.fail(subscription_result.error);
    }

    const subscription = subscription_result.data;

    if (!subscription) {
      logger.warn({ user_id: user.id }, 'No subscription found to restart');
      return Result.fail(new SubscriptionNotFound(null, 'No subscription found'));
    }

    // Check if subscription is in a restartable state
    if (!subscription.status || !RESTARTABLE_STATUSES.includes(subscription.status)) {
      logger.warn(
        { user_id: user.id, subscription_id: subscription.id, status: subscription.status },
        'Subscription is not in a restartable state'
      );
      return Result.fail(
        new InvalidSubscriptionState(null, `Cannot restart subscription with status: ${subscription.status}`)
      );
    }

    const now = new Date();
    let new_billing_cycle: BillingCycle | null = null;

    // Handle SCHEDULED_CANCELLATION - just re-enable, no new billing cycle needed
    if (subscription.status === SubscriptionStatus.SCHEDULED_CANCELLATION) {
      logger.info({ subscription_id: subscription.id }, 'Re-enabling scheduled cancellation');

      // Simply set status back to ACTIVE and clear inactive_after
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          inactive_after: null,
        },
      });

      // Clear account balance if any
      if (subscription.account_id) {
        await db.customerAccount.update({
          where: { id: subscription.account_id },
          data: {
            balance: 0,
            balance_due_date: null,
          },
        });
      }
    } else {
      // CANCELLED or DEACTIVATED - need to create new billing cycle
      logger.info({ subscription_id: subscription.id, status: subscription.status }, 'Restarting cancelled/deactivated subscription');

      // Calculate new billing cycle dates
      const bc_end_date = new Date(now);
      bc_end_date.setMonth(bc_end_date.getMonth() + 1);

      // Create new billing cycle
      const billing_cycle_result = await BillingCycle.create({
        start_date: now,
        end_date: bc_end_date,
        status: BillingCycleStatus.NEW,
        payment_amount: SUBSCRIPTION_AMOUNT_CENTS,
      });

      if (!billing_cycle_result.ok) {
        logger.error({ subscription_id: subscription.id, error: billing_cycle_result.error }, 'Failed to create billing cycle');
        return Result.fail(billing_cycle_result.error);
      }

      new_billing_cycle = billing_cycle_result.data;

      // Link billing cycle to subscription
      await db.billingCycle.update({
        where: { id: new_billing_cycle.id },
        data: { subscription_id: subscription.id },
      });

      // Update subscription
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          inactive_after: null,
          current_billing_cycle_id: new_billing_cycle.id,
          start_date: now,
        },
      });

      // Update customer account
      if (subscription.account_id) {
        await db.customerAccount.update({
          where: { id: subscription.account_id },
          data: {
            status: BillingAccountStatus.OPEN,
            rating: BillingAccountRating.OK,
            balance: SUBSCRIPTION_AMOUNT_CENTS,
            balance_due_date: now,
            balance_past_due: 0,
          },
        });
      }
    }

    logger.info(
      {
        user_id: user.id,
        subscription_id: subscription.id,
        new_billing_cycle_id: new_billing_cycle?.id,
      },
      'Membership restarted successfully'
    );

    // Fetch updated subscription with relations
    const final_subscription_result = await Subscription.fetch_by_id(subscription.id);
    if (!final_subscription_result.ok || !final_subscription_result.data) {
      logger.error({ subscription_id: subscription.id }, 'Failed to fetch final subscription');
      return Result.fail(final_subscription_result.error || new ServerInternalError(null, 'Failed to fetch subscription'));
    }

    return Result.success({
      subscription: final_subscription_result.data,
      billing_cycle: new_billing_cycle,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
      },
      'Server internal error encountered during restart_membership'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default restart_membership;
