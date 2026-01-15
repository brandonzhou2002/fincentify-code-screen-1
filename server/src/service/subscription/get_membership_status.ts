import User from 'model/User';
import Subscription from 'model/Subscription';
import BillingCycle from 'model/BillingCycle';
import CustomerAccount from 'model/CustomerAccount';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { init_logger } from 'util/logger';
import { SubscriptionStatus } from '@prisma/client';

const logger = init_logger('subscription:get_membership_status');

export interface GetMembershipStatusInput {
  user: User;
}

export interface MembershipStatusResult {
  has_subscription: boolean;
  subscription: Subscription | null;
  current_billing_cycle: BillingCycle | null;
  account: CustomerAccount | null;
  account_balance: number;
  next_billing_date: Date | null;
  is_trial: boolean;
  days_remaining_in_cycle: number;
}

export async function get_membership_status(input: GetMembershipStatusInput): Promise<Result<MembershipStatusResult, ApplicationError>> {
  const { user } = input;

  try {
    logger.info({ user_id: user.id }, 'Getting membership status');

    // Fetch subscription with relations
    const subscription_result = await Subscription.fetch_by_customer_id(user.id);
    if (!subscription_result.ok) {
      logger.error({ user_id: user.id, error: subscription_result.error }, 'Failed to fetch subscription');
      return Result.fail(subscription_result.error);
    }

    const subscription = subscription_result.data;

    // If no subscription, return empty status
    if (!subscription) {
      logger.info({ user_id: user.id }, 'No subscription found');
      return Result.success({
        has_subscription: false,
        subscription: null,
        current_billing_cycle: null,
        account: null,
        account_balance: 0,
        next_billing_date: null,
        is_trial: false,
        days_remaining_in_cycle: 0,
      });
    }

    // Get current billing cycle
    const current_billing_cycle = subscription.current_billing_cycle || null;

    // Get account
    const account = subscription.account || null;

    // Calculate next billing date (end of current billing cycle)
    const next_billing_date = current_billing_cycle?.end_date || null;

    // Check if in trial
    const is_trial = subscription.status === SubscriptionStatus.TRIAL;

    // Calculate days remaining in cycle
    let days_remaining_in_cycle = 0;
    if (current_billing_cycle?.end_date) {
      const now = new Date();
      const end_date = new Date(current_billing_cycle.end_date);
      const diff_time = end_date.getTime() - now.getTime();
      days_remaining_in_cycle = Math.max(0, Math.ceil(diff_time / (1000 * 60 * 60 * 24)));
    }

    // Get account balance
    const account_balance = account?.balance || 0;

    logger.info(
      {
        user_id: user.id,
        subscription_id: subscription.id,
        status: subscription.status,
        is_trial,
        days_remaining_in_cycle,
      },
      'Membership status retrieved'
    );

    return Result.success({
      has_subscription: true,
      subscription,
      current_billing_cycle,
      account,
      account_balance,
      next_billing_date,
      is_trial,
      days_remaining_in_cycle,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
      },
      'Server internal error encountered during get_membership_status'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default get_membership_status;
