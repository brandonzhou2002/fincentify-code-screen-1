import User from 'model/User';
import Subscription from 'model/Subscription';
import BillingCycle from 'model/BillingCycle';
import CustomerAccount from 'model/CustomerAccount';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { AlreadyHasSubscription } from 'common/subscription_errors';
import { init_logger } from 'util/logger';
import db from 'util/db';
import {
  SubscriptionStatus,
  SubscriptionType,
  BillingCycleStatus,
  CustomerAccountType,
  BillingAccountRating,
} from '@prisma/client';

const logger = init_logger('subscription:start_trial');

// Trial duration in days
const TRIAL_DURATION_DAYS = 14;

// Monthly subscription amount in cents ($11.99)
const SUBSCRIPTION_AMOUNT_CENTS = 1199;

export interface StartTrialInput {
  user: User;
}

export interface StartTrialResult {
  subscription: Subscription;
  billing_cycle: BillingCycle;
  account: CustomerAccount;
}

export async function start_trial(input: StartTrialInput): Promise<Result<StartTrialResult, ApplicationError>> {
  const { user } = input;

  try {
    logger.info({ user_id: user.id, email: user.email }, 'Starting trial subscription');

    // Check if user already has a subscription
    const existing_subscription_result = await Subscription.fetch_by_customer_id(user.id);
    if (!existing_subscription_result.ok) {
      logger.error({ user_id: user.id, error: existing_subscription_result.error }, 'Failed to fetch existing subscription');
      return Result.fail(existing_subscription_result.error);
    }

    if (existing_subscription_result.data) {
      logger.warn({ user_id: user.id }, 'User already has a subscription');
      return Result.fail(new AlreadyHasSubscription(null, 'User already has an active subscription'));
    }

    // Step 1: Create CustomerAccount for billing
    const account_result = await CustomerAccount.create({
      customer_id: user.id,
      type: CustomerAccountType.SUBSCRIPTION,
      balance: 0,
    });

    if (!account_result.ok) {
      logger.error({ user_id: user.id, error: account_result.error }, 'Failed to create customer account');
      return Result.fail(account_result.error);
    }

    const account = account_result.data;

    // Update account rating to NEW
    const account_update_result = await CustomerAccount.update(account.id, {
      rating: BillingAccountRating.NEW,
    });

    if (!account_update_result.ok) {
      logger.error({ user_id: user.id, error: account_update_result.error }, 'Failed to update customer account rating');
      return Result.fail(account_update_result.error);
    }

    // Step 2: Create trial BillingCycle
    const now = new Date();
    const trial_end_date = new Date(now);
    trial_end_date.setDate(trial_end_date.getDate() + TRIAL_DURATION_DAYS);

    const billing_cycle_result = await BillingCycle.create({
      start_date: now,
      end_date: trial_end_date,
      status: BillingCycleStatus.TRIAL,
      payment_amount: 0, // Trial is free
    });

    if (!billing_cycle_result.ok) {
      logger.error({ user_id: user.id, error: billing_cycle_result.error }, 'Failed to create billing cycle');
      return Result.fail(billing_cycle_result.error);
    }

    const billing_cycle = billing_cycle_result.data;

    // Step 3: Create Subscription
    const subscription_result = await Subscription.create({
      customer_id: user.id,
      account_id: account.id,
      type: SubscriptionType.MEMBERSHIP,
      amount: SUBSCRIPTION_AMOUNT_CENTS,
      start_date: now,
    });

    if (!subscription_result.ok) {
      logger.error({ user_id: user.id, error: subscription_result.error }, 'Failed to create subscription');
      return Result.fail(subscription_result.error);
    }

    const subscription = subscription_result.data;

    // Step 4: Link billing cycle to subscription
    await db.billingCycle.update({
      where: { id: billing_cycle.id },
      data: { subscription_id: subscription.id },
    });

    // Update subscription with billing cycle link and status
    const subscription_update_result = await Subscription.update(subscription.id, {
      status: SubscriptionStatus.TRIAL,
      current_billing_cycle_id: billing_cycle.id,
    });

    if (!subscription_update_result.ok) {
      logger.error({ user_id: user.id, error: subscription_update_result.error }, 'Failed to update subscription with billing cycle');
      return Result.fail(subscription_update_result.error);
    }

    logger.info(
      {
        user_id: user.id,
        subscription_id: subscription.id,
        billing_cycle_id: billing_cycle.id,
        trial_end_date: trial_end_date.toISOString(),
      },
      'Trial subscription started successfully'
    );

    // Fetch the updated subscription with relations
    const final_subscription_result = await Subscription.fetch_by_id(subscription.id);
    if (!final_subscription_result.ok || !final_subscription_result.data) {
      logger.error({ subscription_id: subscription.id }, 'Failed to fetch final subscription');
      return Result.fail(final_subscription_result.error || new ServerInternalError(null, 'Failed to fetch subscription'));
    }

    return Result.success({
      subscription: final_subscription_result.data,
      billing_cycle,
      account: account_update_result.data,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
      },
      'Server internal error encountered during start_trial'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default start_trial;
