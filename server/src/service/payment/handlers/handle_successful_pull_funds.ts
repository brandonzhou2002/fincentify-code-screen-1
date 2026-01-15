import { PaymentStatus } from '@prisma/client';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import Payment from 'model/Payment';
import CustomerAccount from 'model/CustomerAccount';
import { init_logger } from 'util/logger';
import { PaymentStatusCode } from '../PaymentStatusCode';

const logger = init_logger('handle_successful_pull_funds');

export type HandleSuccessfulPullFundsArgs = {
  payment: Payment;
  override_paid_status?: boolean;
};

/**
 * handle_successful_pull_funds
 * ----------------------------
 * Handles post-processing for successful payment pulls.
 *
 * Actions:
 * 1. Updates payment status to PAID
 * 2. Updates customer account metrics
 * 3. Handles subscription-specific success logic
 *
 * @param args - Payment and optional override flag
 * @returns Result<Payment, ApplicationError>
 */
export default async function handle_successful_pull_funds({
  payment,
  override_paid_status = false,
}: HandleSuccessfulPullFundsArgs): Promise<Result<Payment, ApplicationError>> {
  try {
    // Idempotency check - if already PAID, skip
    if (!override_paid_status && payment.status === PaymentStatus.PAID) {
      logger.warn(
        {
          payment_id: payment.id,
          override_paid_status,
          payment_status: payment.status,
        },
        `Payment status is already PAID, skipping handling`
      );
      return Result.success(payment);
    }

    logger.info(
      {
        payment_id: payment.id,
        override_paid_status,
      },
      `Handling successful PULL payment`
    );

    // Update payment status to PAID
    const update_result = await Payment.update(payment.id, {
      status: PaymentStatus.PAID,
      code: PaymentStatusCode.SUCCESS,
    });

    if (!update_result.ok) {
      logger.error(
        {
          payment_id: payment.id,
          error: update_result.error,
        },
        `Failed to update payment status to PAID`
      );
      return Result.fail(new ServerInternalError(new Error(update_result.error?.detail || 'Failed to update payment')));
    }

    payment = update_result.data;

    // Fetch customer account
    const account_result = await CustomerAccount.fetch_by_id(payment.account_id);
    if (!account_result.ok || !account_result.data) {
      logger.warn(
        {
          payment_id: payment.id,
          account_id: payment.account_id,
        },
        `Could not fetch customer account for successful payment handling`
      );
      return Result.success(payment);
    }

    const account = account_result.data;

    // Update account metrics for successful payment
    await CustomerAccount.update(account.id, {
      last_successful_payment_amount: payment.amount,
      last_successful_payment_date: new Date(),
    });

    logger.info(
      {
        payment_id: payment.id,
        account_id: account.id,
        amount: payment.amount,
      },
      `Successfully handled pull funds - payment marked PAID`
    );

    // TODO: Add subscription-specific success handling
    // if (payment.subscription_id) {
    //   await handle_successful_subscription_payment({ payment, account });
    // }

    return Result.success(payment);
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        payment_id: payment.id,
        account_id: payment.account_id,
      },
      `Error handling successful PULL payment`
    );
    return Result.fail(new ServerInternalError(e));
  }
}
