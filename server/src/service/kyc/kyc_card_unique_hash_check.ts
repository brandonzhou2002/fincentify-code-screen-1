import { UserStatus } from '@prisma/client';
import { CardGenericFailError } from 'common/payment_errors';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import PaymentMethod from 'model/PaymentMethod';
import User from 'model/User';
import { init_logger } from 'util/logger';

const logger = init_logger('kyc_card_unique_hash_check');

export type KYCCardUniqueHashCheckArgs = {
  user: User;
  card_hash: string;
};

/**
 * kyc_card_unique_hash_check
 * --------------------------
 * Checks if a card with the same hash already belongs to another user.
 * If found, the user attempting to add the card is suspended for security reasons.
 *
 * @param user - The user attempting to add the card
 * @param card_hash - The SHA-256 hash of the card PAN
 * @returns Result<void, ApplicationError> - Success if no duplicate found, failure otherwise
 */
export default async function kyc_card_unique_hash_check({
  user,
  card_hash,
}: KYCCardUniqueHashCheckArgs): Promise<Result<void, ApplicationError>> {
  try {
    logger.info(
      {
        user_id: user.id,
      },
      'Starting KYC card unique hash check'
    );

    // Check if another user has a card with the same hash
    const existing_card_result = await PaymentMethod.fetch_not_expired_by_card_hash({
      card_hash,
      not_customer_id: user.id,
    });

    if (!existing_card_result.ok) {
      logger.error(
        {
          user_id: user.id,
          error: existing_card_result.error,
        },
        'Failed to check for existing card by hash'
      );
      return Result.fail(existing_card_result.error);
    }

    const existing_card = existing_card_result.data;

    if (existing_card && existing_card.id) {
      logger.warn(
        {
          user_id: user.id,
          existing_card_owner_id: existing_card.customer_id,
          existing_payment_method_id: existing_card.id,
        },
        'KYC card hash check failed: card belongs to another user'
      );

      // Suspend the user attempting to add a duplicate card
      await User.update(user.id, {
        status: UserStatus.SUSPENDED,
      });

      logger.info(
        {
          user_id: user.id,
          existing_card_owner_id: existing_card.customer_id,
        },
        'User suspended due to KYC card hash check failure'
      );

      return Result.fail(
        new CardGenericFailError(null, 'Unable to add card, please contact support.')
      );
    }

    logger.info(
      {
        user_id: user.id,
      },
      'KYC card unique hash check passed'
    );

    return Result.success(undefined);
  } catch (e) {
    logger.error(
      {
        user_id: user.id,
        error_message: e.message,
        error_stack: e.stack,
      },
      'Error during KYC card unique hash check'
    );
    return Result.fail(new ServerInternalError(e));
  }
}
