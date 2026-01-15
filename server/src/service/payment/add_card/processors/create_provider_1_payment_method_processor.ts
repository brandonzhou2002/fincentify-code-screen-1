import { PaymentProvider } from '@prisma/client';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import PaymentMethod from 'model/PaymentMethod';
import PaymentMethodProcessor from 'model/PaymentMethodProcessor';
import User from 'model/User';
import { init_logger } from 'util/logger';
import { CardData } from '../create_card_payment_method';
import { ProcessorCreationConfig, simulate_delay } from './processor_creation_config';

const logger = init_logger('create_provider_1_payment_method_processor');

export type CreateProvider1PaymentMethodProcessorArgs = {
  user: User;
  card_data: CardData;
  payment_method: PaymentMethod;
};

/**
 * create_provider_1_payment_method_processor
 * ------------------------------------------
 * Creates a payment method processor entry for Provider 1.
 *
 * The behavior is configurable via ProcessorCreationConfig for testing.
 *
 * @param args - User, card data, and payment method
 * @returns Result<PaymentMethodProcessor, ApplicationError>
 */
export default async function create_provider_1_payment_method_processor({
  user,
  card_data,
  payment_method,
}: CreateProvider1PaymentMethodProcessorArgs): Promise<Result<PaymentMethodProcessor, ApplicationError>> {
  try {
    const config = ProcessorCreationConfig.get_provider_1_config();

    logger.info(
      {
        user_id: user.id,
        payment_method_id: payment_method.id,
        should_succeed: config.should_succeed,
      },
      `Starting Provider 1 processor creation`
    );

    // Simulate processing delay if configured
    await simulate_delay(config.delay_ms);

    if (!config.should_succeed) {
      logger.warn(
        {
          user_id: user.id,
          payment_method_id: payment_method.id,
        },
        `Provider 1 processor creation configured to fail`
      );
      return Result.fail(new ServerInternalError(new Error('Provider 1 creation failed')));
    }

    // Create processor record
    const processor_result = await PaymentMethodProcessor.create({
      payment_method_id: payment_method.id,
      provider_name: PaymentProvider.PROVIDER_1,
      processor_external_id: `${config.processor_external_id_prefix}_${Date.now()}`,
      processor_external_data: {
        detected_issuer: config.detected_issuer,
        detected_funding_type: config.detected_funding_type,
        detected_network: config.detected_network,
      },
    });

    if (!processor_result.ok) {
      logger.error(
        {
          user_id: user.id,
          payment_method_id: payment_method.id,
          error: processor_result.error,
        },
        `Failed to create Provider 1 processor record`
      );
      return Result.fail(new ServerInternalError(new Error('Failed to create processor')));
    }

    logger.info(
      {
        user_id: user.id,
        payment_method_id: payment_method.id,
        processor_id: processor_result.data.id,
      },
      `Provider 1 processor created successfully`
    );

    return Result.success(processor_result.data);
  } catch (e) {
    logger.error(
      {
        error_name: e.name,
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
        payment_method_id: payment_method?.id,
      },
      `Provider 1 processor creation encountered error`
    );
    return Result.fail(new ServerInternalError(e));
  }
}
