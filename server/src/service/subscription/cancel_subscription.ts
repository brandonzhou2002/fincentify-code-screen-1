import User from 'model/User';
import Subscription from 'model/Subscription';
import SubscriptionCancellationRequest from 'model/SubscriptionCancellationRequest';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { SubscriptionNotFound, SubscriptionNotCancellable } from 'common/subscription_errors';
import { init_logger } from 'util/logger';
import {
  SubscriptionStatus,
  SubscriptionCancellationRequestStatus,
} from '@prisma/client';

const logger = init_logger('subscription:cancel_subscription');

// Statuses that allow cancellation
const CANCELLABLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAYMENT_FAILED,
  SubscriptionStatus.OVERDUE,
];

export interface CancelSubscriptionInput {
  user: User;
}

export interface CancelSubscriptionResult {
  subscription: Subscription;
  cancellation_request: SubscriptionCancellationRequest;
}

export async function cancel_subscription(input: CancelSubscriptionInput): Promise<Result<CancelSubscriptionResult, ApplicationError>> {
  const { user } = input;

  try {
    logger.info({ user_id: user.id }, 'Cancelling subscription');

    // Fetch subscription
    const subscription_result = await Subscription.fetch_by_customer_id(user.id);
    if (!subscription_result.ok) {
      logger.error({ user_id: user.id, error: subscription_result.error }, 'Failed to fetch subscription');
      return Result.fail(subscription_result.error);
    }

    const subscription = subscription_result.data;

    if (!subscription) {
      logger.warn({ user_id: user.id }, 'No subscription found to cancel');
      return Result.fail(new SubscriptionNotFound(null, 'No subscription found'));
    }

    // Check if subscription is already cancelled or in a non-cancellable state
    if (!subscription.status || !CANCELLABLE_STATUSES.includes(subscription.status)) {
      logger.warn(
        { user_id: user.id, subscription_id: subscription.id, status: subscription.status },
        'Subscription is not in a cancellable state'
      );
      return Result.fail(
        new SubscriptionNotCancellable(null, `Cannot cancel subscription with status: ${subscription.status}`)
      );
    }

    // Create cancellation request with SUCCESS status (direct cancellation - skip questions)
    const cancellation_request_result = await SubscriptionCancellationRequest.create({
      customer_id: user.id,
      subscription_id: subscription.id,
      status: SubscriptionCancellationRequestStatus.SUCCESS,
      memo: 'Direct cancellation requested by user',
    });

    if (!cancellation_request_result.ok) {
      logger.error(
        { user_id: user.id, subscription_id: subscription.id, error: cancellation_request_result.error },
        'Failed to create cancellation request'
      );
      return Result.fail(cancellation_request_result.error);
    }

    const cancellation_request = cancellation_request_result.data;

    // Update cancellation request with processed_at
    await SubscriptionCancellationRequest.update(cancellation_request.id, {
      processed_at: new Date(),
    });

    // Determine the inactive_after date (end of current billing cycle)
    const inactive_after = subscription.current_billing_cycle?.end_date || new Date();
    const now = new Date();

    // If the billing cycle has already ended, cancel immediately
    const should_cancel_immediately = new Date(inactive_after) <= now;

    // Update subscription status
    const new_status = should_cancel_immediately
      ? SubscriptionStatus.CANCELLED
      : SubscriptionStatus.SCHEDULED_CANCELLATION;

    const subscription_update_result = await Subscription.update(subscription.id, {
      status: new_status,
      inactive_after: new Date(inactive_after),
    });

    if (!subscription_update_result.ok) {
      logger.error(
        { user_id: user.id, subscription_id: subscription.id, error: subscription_update_result.error },
        'Failed to update subscription status'
      );
      return Result.fail(subscription_update_result.error);
    }

    logger.info(
      {
        user_id: user.id,
        subscription_id: subscription.id,
        new_status,
        inactive_after,
        cancellation_request_id: cancellation_request.id,
      },
      'Subscription cancellation processed successfully'
    );

    // Fetch updated subscription with relations
    const final_subscription_result = await Subscription.fetch_by_id(subscription.id);
    if (!final_subscription_result.ok || !final_subscription_result.data) {
      logger.error({ subscription_id: subscription.id }, 'Failed to fetch final subscription');
      return Result.fail(final_subscription_result.error || new ServerInternalError(null, 'Failed to fetch subscription'));
    }

    return Result.success({
      subscription: final_subscription_result.data,
      cancellation_request,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
      },
      'Server internal error encountered during cancel_subscription'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default cancel_subscription;
