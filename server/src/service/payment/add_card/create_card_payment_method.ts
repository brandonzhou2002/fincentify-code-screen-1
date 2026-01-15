import {
  CardFundingType,
  CardNetwork,
  PaymentMethodStatus,
  PaymentMethodType,
} from '@prisma/client';
import { CardGenericFailError, UnsupportedCardType } from 'common/payment_errors';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import { deterministic_sha256_hex_hash } from 'lib/hashing';
import Result from 'lib/Result';
import PaymentMethod from 'model/PaymentMethod';
import PaymentMethodProcessor from 'model/PaymentMethodProcessor';
import User from 'model/User';
import kyc_card_unique_hash_check from 'service/kyc/kyc_card_unique_hash_check';
import { init_logger } from 'util/logger';

import ensure_no_duplicate_valid_card from './ensure_no_duplicate_valid_card';
import create_provider_1_payment_method_processor from './processors/create_provider_1_payment_method_processor';
import create_provider_2_payment_method_processor from './processors/create_provider_2_payment_method_processor';
import create_provider_3_payment_method_processor from './processors/create_provider_3_payment_method_processor';
import create_provider_4_payment_method_processor from './processors/create_provider_4_payment_method_processor';

const logger = init_logger('create_card_payment_method');

export type CreateCardPaymentMethodArgs = {
  user: User;
  card_data: CardData;
  set_default?: boolean;
  debit_prepaid_only?: boolean;
  context?: string;
};

export type CardData = {
  pan: string;
  cvv: string;
  exp_month: string;
  exp_year: string;
  postal_code?: string;
};

/**
 * create_card_payment_method
 * --------------------------
 * Creates a new card payment method for a user.
 *
 * Flow:
 * 1. Validate card data
 * 2. Check for duplicate cards
 * 3. Create payment method record
 * 4. Create processor records with each provider (in parallel)
 * 5. Extract and update card metadata (issuer, funding type, network)
 * 6. Validate card type if required (debit/prepaid only)
 * 7. Set as default if requested
 *
 * @param args - User, card data, and options
 * @returns Result<PaymentMethod, ApplicationError>
 */
export default async function create_card_payment_method({
  user,
  card_data,
  set_default = false,
  debit_prepaid_only = false,
  context,
}: CreateCardPaymentMethodArgs): Promise<Result<PaymentMethod, ApplicationError>> {
  try {
    logger.info(
      {
        user_id: user.id,
        debit_prepaid_only,
        set_default,
        context,
      },
      `Starting create card payment method`
    );

    const { pan, cvv, exp_month, exp_year, postal_code } = card_data;

    // Extract card identifiers
    const last4 = pan.slice(-4);
    const iin = pan.slice(0, 6);
    const guessed_network = get_card_network(iin);

    // Generate deterministic hash from full PAN for duplicate detection
    const card_hash = deterministic_sha256_hex_hash(pan);

    // KYC Check: Verify card doesn't belong to another user
    const kyc_result = await kyc_card_unique_hash_check({
      user,
      card_hash,
    });

    if (!kyc_result.ok) {
      logger.warn(
        {
          user_id: user.id,
        },
        'KYC card unique hash check failed'
      );
      return Result.fail(kyc_result.error);
    }

    // Create payment method record
    const create_result = await PaymentMethod.create({
      customer_id: user.id,
      type: PaymentMethodType.CARD,
      status: PaymentMethodStatus.PROCESSING,
      card_pan: pan, // In production, encrypt this
      card_cvv: cvv, // In production, encrypt this
      card_hash,
      card_postal_code: postal_code,
      exp_month,
      exp_year,
      last4,
      iin,
      card_network: guessed_network,
    });

    if (!create_result.ok) {
      logger.error(
        {
          user_id: user.id,
          error: create_result.error,
        },
        `Failed to create payment method record`
      );
      return Result.fail(new CardGenericFailError(null, 'Failed to create payment method'));
    }

    let card = create_result.data;

    logger.info(
      {
        user_id: user.id,
        payment_method_id: card.id,
        context,
      },
      `Card payment method record created`
    );

    // Create processors for each provider (in parallel)
    const processor_results = await Promise.allSettled([
      create_provider_1_payment_method_processor({
        user,
        card_data,
        payment_method: card,
      }),
      create_provider_2_payment_method_processor({
        user,
        card_data,
        payment_method: card,
      }),
      create_provider_3_payment_method_processor({
        user,
        card_data,
        payment_method: card,
      }),
      create_provider_4_payment_method_processor({
        user,
        card_data,
        payment_method: card,
      }),
    ]);

    // Extract successful processors
    const processors = processor_results
      .filter((r) => r.status === 'fulfilled' && r.value.ok)
      .map((r) => (r as PromiseFulfilledResult<Result<PaymentMethodProcessor, ApplicationError>>).value.data);

    if (processors.length === 0) {
      logger.error(
        {
          user_id: user.id,
          payment_method_id: card.id,
        },
        `No processor was able to add card`
      );

      await PaymentMethod.update(card.id, {
        status: PaymentMethodStatus.ADD_FAILED,
      });

      return Result.fail(new CardGenericFailError(null, 'Unable to setup card payment method'));
    }

    // Extract detected card metadata from processors
    const detected_issuer = extract_processor_metadata(processors, 'detected_issuer');
    const detected_funding_type = extract_processor_metadata(processors, 'detected_funding_type') as CardFundingType;
    const detected_network = extract_processor_metadata(processors, 'detected_network') as CardNetwork;

    // Update card with detected metadata
    await PaymentMethod.update(card.id, {
      issuer: detected_issuer,
      funding_type: detected_funding_type,
      card_network: detected_network || guessed_network,
    });

    // Refetch card with updated data
    const refetch_result = await PaymentMethod.fetch_by_id(card.id);
    if (refetch_result.ok && refetch_result.data) {
      card = refetch_result.data;
    }

    // Validate card type if required
    if (
      debit_prepaid_only &&
      card.funding_type !== CardFundingType.DEBIT &&
      card.funding_type !== CardFundingType.PREPAID
    ) {
      logger.error(
        {
          funding_type: card.funding_type,
          user_id: user.id,
          payment_method_id: card.id,
        },
        `Card must be DEBIT/PREPAID funding type`
      );

      await PaymentMethod.update(card.id, {
        status: PaymentMethodStatus.ADD_FAILED,
      });

      return Result.fail(
        new UnsupportedCardType(
          null,
          `Card must be a debit or prepaid card, got ${card.funding_type?.toLowerCase()} instead`
        )
      );
    }

    // Set as default if requested
    if (set_default) {
      await PaymentMethod.remove_existing_defaults(user.id);
      await PaymentMethod.update(card.id, {
        status: PaymentMethodStatus.VALID,
        default: true,
      });
    } else {
      await PaymentMethod.update(card.id, {
        status: PaymentMethodStatus.VALID,
      });
    }

    // Clean up any duplicate cards for this user with the same hash
    await ensure_no_duplicate_valid_card({
      user,
      card,
    });

    // Refetch final card state
    const final_result = await PaymentMethod.fetch_by_id(card.id);
    if (final_result.ok && final_result.data) {
      card = final_result.data;
    }

    logger.info(
      {
        user_id: user.id,
        payment_method_id: card.id,
        issuer: card.issuer,
        funding_type: card.funding_type,
        card_network: card.card_network,
        set_default,
        context,
      },
      `Card payment method created successfully`
    );

    return Result.success(card);
  } catch (e) {
    if (e && e.code) {
      return Result.fail(e);
    }

    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        user_id: user.id,
        context,
      },
      `Server internal error encountered`
    );
    return Result.fail(new ServerInternalError(e));
  }
}

/**
 * Detect card network from BIN/IIN
 */
function get_card_network(bin: string): CardNetwork | null {
  const bin_nb = parseInt(bin, 10);

  if (bin.startsWith('4')) {
    return CardNetwork.VISA;
  } else if ((bin_nb >= 222100 && bin_nb <= 272099) || (bin_nb >= 510000 && bin_nb <= 550000)) {
    return CardNetwork.MASTERCARD;
  } else if (bin.startsWith('34') || bin.startsWith('37')) {
    return CardNetwork.AMERICAN_EXPRESS;
  } else if (bin.startsWith('6')) {
    return CardNetwork.DISCOVER;
  } else {
    return null;
  }
}

/**
 * Extract metadata from processor external data
 */
function extract_processor_metadata(
  processors: PaymentMethodProcessor[],
  key: string
): string | null {
  for (const processor of processors) {
    const data = processor.processor_external_data as Record<string, any>;
    if (data && data[key]) {
      return data[key];
    }
  }
  return null;
}
