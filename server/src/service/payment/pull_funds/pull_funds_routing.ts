import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import Payment from 'model/Payment';
import PaymentMethod from 'model/PaymentMethod';
import PaymentMethodProcessor from 'model/PaymentMethodProcessor';
import User from 'model/User';
import { init_logger } from 'util/logger';
import {
  PaymentMethodType,
  PaymentMethodStatus,
  PaymentTrack,
  PaymentProvider,
  CardFundingType,
} from '@prisma/client';

const logger = init_logger('pull_funds_routing');

/**
 * Routing context for retry logic - tracks which processors have been attempted
 */
export enum PullFundsRoutingContext {
  NO_PROVIDER_1 = 'NO_PROVIDER_1',
  NO_PROVIDER_2 = 'NO_PROVIDER_2',
  NO_PROVIDER_3 = 'NO_PROVIDER_3',
  NO_PROVIDER_4 = 'NO_PROVIDER_4',
}

export type PullFundsRoutingArgs = {
  user: User;
  payment: Payment;
  pull_funds_in_progress?: boolean;
};

/**
 * pull_funds_routing
 * ------------------
 * Dynamically routes payment to the best available card processor based on:
 * - Payment track (BANK_CARD, ANY_CARD)
 * - Payment type (subscription, etc.)
 * - Amount thresholds
 * - Card properties (funding type, issuer, network)
 * - Retry context (previously failed processors)
 *
 * @param args - PullFundsRoutingArgs containing user, payment, and routing context
 * @returns Result<Payment, ApplicationError> with attached processor
 */
export default async function pull_funds_routing({
  user,
  payment,
  pull_funds_in_progress,
}: PullFundsRoutingArgs): Promise<Result<Payment, ApplicationError>> {
  try {
    logger.info(
      {
        payment_id: payment.id,
        payment_type: payment.type,
        amount: payment.amount,
        pull_funds_in_progress,
        user_id: user.id,
        track: payment.track,
        retry_routing_ctx: payment.retry_routing_ctx,
      },
      `Starting: Pull funds routing`
    );

    let payment_method: PaymentMethod;

    // 1. Establish payment method based on track
    if (payment.payment_method && payment.payment_method.status === PaymentMethodStatus.VALID) {
      payment_method = payment.payment_method;
      logger.info(
        {
          payment_id: payment.id,
          amount: payment.amount,
          pull_funds_in_progress,
          payment_method_id: payment_method.id,
        },
        `Payment method already attached to payment`
      );
    } else if (payment.track === PaymentTrack.BANK_CARD) {
      // Find default bank card (debit/prepaid) for user
      const cards_result = await PaymentMethod.fetch_by_user_id(user.id);
      if (cards_result.ok) {
        const cards = cards_result.data.filter(
          (c) =>
            c.type === PaymentMethodType.CARD &&
            c.status === PaymentMethodStatus.VALID &&
            (c.funding_type === CardFundingType.DEBIT || c.funding_type === CardFundingType.PREPAID)
        );

        // Prioritize default card
        const default_card = cards.find((c) => c.default);
        if (default_card) {
          payment_method = default_card;
          logger.info(
            {
              payment_id: payment.id,
              payment_method_id: payment_method.id,
            },
            `Found default bank card`
          );
        } else if (cards.length > 0) {
          payment_method = cards[0];
          logger.info(
            {
              payment_id: payment.id,
              payment_method_id: payment_method.id,
            },
            `Found bank card (non-default)`
          );
        }
      }
    } else if (payment.track === PaymentTrack.ANY_CARD) {
      // Find any valid card
      const cards_result = await PaymentMethod.fetch_by_user_id(user.id);
      if (cards_result.ok) {
        const cards = cards_result.data.filter(
          (c) => c.type === PaymentMethodType.CARD && c.status === PaymentMethodStatus.VALID
        );
        const default_card = cards.find((c) => c.default);
        payment_method = default_card || cards[0];
        if (payment_method) {
          logger.info(
            {
              payment_id: payment.id,
              payment_method_id: payment_method.id,
            },
            `Found any card payment method`
          );
        }
      }
    }

    // Attach payment method if found
    if (payment_method && payment_method.status === PaymentMethodStatus.VALID) {
      logger.info(
        {
          user_id: user.id,
          payment_id: payment.id,
          pull_funds_in_progress,
          payment_method_id: payment_method.id,
          payment_method_status: payment_method.status,
          track: payment.track,
        },
        `Payment method validated/found for current track, attaching to payment`
      );

      if (!payment.payment_method_id || payment.payment_method_id !== payment_method.id) {
        await Payment.update(payment.id, {
          payment_method_id: payment_method.id,
        });
        payment.payment_method_id = payment_method.id;
        payment.payment_method = payment_method;
      }

      // 2. Route processor for selected payment method
      const processors_result = await PaymentMethodProcessor.fetch_by_payment_method_id(
        payment_method.id
      );
      let processors = processors_result.ok ? processors_result.data : [];
      processors = processors.filter((p) => p.processor_external_id !== 'DELETED');

      // Find processors for each provider
      const provider_1_processor = processors.find(
        (p) => p.provider_name === PaymentProvider.PROVIDER_1
      );
      const provider_2_processor = processors.find(
        (p) => p.provider_name === PaymentProvider.PROVIDER_2
      );
      const provider_3_processor = processors.find(
        (p) => p.provider_name === PaymentProvider.PROVIDER_3
      );
      const provider_4_processor = processors.find(
        (p) => p.provider_name === PaymentProvider.PROVIDER_4
      );

      // Determine eligibility based on routing context
      const retry_ctx = payment.retry_routing_ctx || [];

      const provider_1_eligible =
        provider_1_processor && !retry_ctx.includes(PullFundsRoutingContext.NO_PROVIDER_1);

      const provider_2_eligible =
        provider_2_processor &&
        !retry_ctx.includes(PullFundsRoutingContext.NO_PROVIDER_2) &&
        payment_method.funding_type !== CardFundingType.CREDIT; // Example: Provider 2 doesn't support credit

      const provider_3_eligible =
        provider_3_processor && !retry_ctx.includes(PullFundsRoutingContext.NO_PROVIDER_3);

      const provider_4_eligible =
        provider_4_processor && !retry_ctx.includes(PullFundsRoutingContext.NO_PROVIDER_4);

      logger.info(
        {
          user_id: user.id,
          amount: payment.amount,
          payment_id: payment.id,
          card_network: payment_method.card_network,
          funding_type: payment_method.funding_type,
          payment_method_id: payment_method.id,
          provider_1_processor_id: provider_1_processor ? provider_1_processor.id : 'not found',
          provider_2_processor_id: provider_2_processor ? provider_2_processor.id : 'not found',
          provider_3_processor_id: provider_3_processor ? provider_3_processor.id : 'not found',
          provider_4_processor_id: provider_4_processor ? provider_4_processor.id : 'not found',
          provider_1_eligible: provider_1_eligible ? 'Y' : 'N',
          provider_2_eligible: provider_2_eligible ? 'Y' : 'N',
          provider_3_eligible: provider_3_eligible ? 'Y' : 'N',
          provider_4_eligible: provider_4_eligible ? 'Y' : 'N',
        },
        `Start card processors filtering`
      );

      // Select processor based on priority
      // Priority: Provider 1 > Provider 2 (high amounts) > Provider 3 > Provider 4
      if (provider_1_eligible) {
        await Payment.update(payment.id, {
          payment_method_processor_id: provider_1_processor.id,
        });
        payment.payment_method_processor_id = provider_1_processor.id;
        payment.payment_method_processor = provider_1_processor;
        logger.info(
          {
            user_id: user.id,
            processor_id: provider_1_processor.id,
            payment_id: payment.id,
          },
          `Pull funds routing: Provider 1 processor selected`
        );
        return Result.success(payment);
      }

      // Provider 2 preferred for higher amounts (e.g., >= $30)
      if (
        provider_2_eligible &&
        (!provider_3_eligible || payment.amount >= 3000) &&
        (!provider_4_eligible || payment.amount >= 3000)
      ) {
        await Payment.update(payment.id, {
          payment_method_processor_id: provider_2_processor.id,
        });
        payment.payment_method_processor_id = provider_2_processor.id;
        payment.payment_method_processor = provider_2_processor;
        logger.info(
          {
            user_id: user.id,
            processor_id: provider_2_processor.id,
            payment_id: payment.id,
          },
          `Pull funds routing: Provider 2 processor selected`
        );
        return Result.success(payment);
      }

      if (provider_3_eligible) {
        await Payment.update(payment.id, {
          payment_method_processor_id: provider_3_processor.id,
        });
        payment.payment_method_processor_id = provider_3_processor.id;
        payment.payment_method_processor = provider_3_processor;
        logger.info(
          {
            user_id: user.id,
            processor_id: provider_3_processor.id,
            payment_id: payment.id,
          },
          `Pull funds routing: Provider 3 processor selected`
        );
        return Result.success(payment);
      }

      if (provider_4_eligible) {
        await Payment.update(payment.id, {
          payment_method_processor_id: provider_4_processor.id,
        });
        payment.payment_method_processor_id = provider_4_processor.id;
        payment.payment_method_processor = provider_4_processor;
        logger.info(
          {
            user_id: user.id,
            processor_id: provider_4_processor.id,
            payment_id: payment.id,
          },
          `Pull funds routing: Provider 4 processor selected`
        );
        return Result.success(payment);
      }
    }

    // No valid payment method or processor found
    logger.info(
      {
        user_id: user.id,
        payment_id: payment.id,
        pull_funds_in_progress,
        payment_method_id: payment_method ? payment_method.id : 'not found',
        track: payment.track,
      },
      `Pull funds routing unsuccessful, no payment method or processor found for current track`
    );

    return Result.success(payment);
  } catch (e) {
    logger.error(
      {
        error: e,
        error_message: e.message,
        error_stack: e.stack,
        pull_funds_in_progress,
        track: payment.track,
        user_id: user.id,
        payment_id: payment.id,
      },
      `Server Error encountered whilst routing pull funds`
    );
    return Result.fail(new ServerInternalError(e));
  }
}
