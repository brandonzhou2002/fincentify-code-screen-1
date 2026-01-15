import { PaymentMethodType, PaymentMethodStatus } from '@prisma/client';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import Payment from 'model/Payment';
import PaymentMethod from 'model/PaymentMethod';
import User from 'model/User';
import { init_logger } from 'util/logger';
import { PaymentStatusCode, is_success_code } from '../../PaymentStatusCode';
import { ProcessorConfig, simulate_delay } from './processor_config';

const logger = init_logger('pull_funds_provider_1_processor');

export type PullFundsProvider1ProcessorArgs = {
  payment: Payment;
  payment_method: PaymentMethod;
  user?: User;
  ref_date?: Date;
};

/**
 * pull_funds_provider_1_processor
 * --------------------------------
 * Executes a card payment through Provider 1.
 *
 * The response is configurable via ProcessorConfig for testing:
 *   ProcessorConfig.set_provider_1_response(PaymentStatusCode.SUCCESS);
 *   ProcessorConfig.set_provider_1_response(PaymentStatusCode.CARD_ISSUER_BLOCK, 1000);
 *
 * @param args - Payment, payment method, and optional user/date
 * @returns Result<PaymentStatusCode, ApplicationError>
 */
export default async function pull_funds_provider_1_processor({
  payment,
  payment_method,
  user,
  ref_date,
}: PullFundsProvider1ProcessorArgs): Promise<Result<PaymentStatusCode, ApplicationError>> {
  try {
    const config = ProcessorConfig.get_provider_1_response();

    logger.info(
      {
        payment_id: payment.id,
        payment_method_id: payment_method.id,
        amount: payment.amount,
        user_id: user?.id,
        configured_status_code: config.status_code,
        configured_delay_ms: config.delay_ms,
      },
      `Starting Provider 1 processor`
    );

    // Validate payment method
    if (payment_method.type !== PaymentMethodType.CARD) {
      logger.error(
        {
          payment_id: payment.id,
          payment_method_type: payment_method.type,
        },
        `Invalid payment method type for Provider 1`
      );
      return Result.success(PaymentStatusCode.CARD_INVALID);
    }

    if (payment_method.status !== PaymentMethodStatus.VALID) {
      logger.error(
        {
          payment_id: payment.id,
          payment_method_status: payment_method.status,
        },
        `Invalid payment method status for Provider 1`
      );
      return Result.success(PaymentStatusCode.CARD_INVALID);
    }

    // Simulate processing delay if configured
    await simulate_delay(config.delay_ms);

    // Update payment with transaction details
    if (is_success_code(config.status_code)) {
      await Payment.update(payment.id, {
        transaction_id: `${config.transaction_id_prefix}_${Date.now()}`,
        processed_at: new Date(),
      });
    }

    logger.info(
      {
        payment_id: payment.id,
        payment_method_id: payment_method.id,
        status_code: config.status_code,
      },
      `Provider 1 processor completed with status: ${config.status_code}`
    );

    return Result.success(config.status_code);
  } catch (e) {
    logger.error(
      {
        error_name: e.name,
        error_message: e.message,
        error_stack: e.stack,
        payment_id: payment.id,
        payment_method_id: payment_method?.id,
      },
      `Provider 1 processor encountered error`
    );
    return Result.fail(new ServerInternalError(e));
  }
}
