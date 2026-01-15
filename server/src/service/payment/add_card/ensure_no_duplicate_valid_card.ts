import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import PaymentMethod from 'model/PaymentMethod';
import User from 'model/User';
import { init_logger } from 'util/logger';

const logger = init_logger('ensure_no_duplicate_valid_card');

export type EnsureNoDuplicateValidCardArgs = {
  user: User;
  card: PaymentMethod;
};

/**
 * ensure_no_duplicate_valid_card
 * ------------------------------
 * Soft-deletes any existing cards with the same hash for the same user.
 * This ensures the user doesn't have duplicate cards when re-adding the same card.
 *
 * @param user - The user who owns the card
 * @param card - The newly added card (must have card_hash set)
 * @returns Result<void, ApplicationError> - Success with count of deleted duplicates
 */
export default async function ensure_no_duplicate_valid_card({
  user,
  card,
}: EnsureNoDuplicateValidCardArgs): Promise<Result<void, ApplicationError>> {
  try {
    if (!card.card_hash) {
      logger.warn(
        {
          user_id: user.id,
          payment_method_id: card.id,
        },
        'No card hash present, skipping duplicate check'
      );
      return Result.success(undefined);
    }

    logger.info(
      {
        user_id: user.id,
        payment_method_id: card.id,
      },
      'Checking for duplicate valid cards by hash'
    );

    // Soft-delete all other cards with the same hash for this user
    const delete_result = await PaymentMethod.soft_delete_duplicates_by_hash({
      customer_id: user.id,
      card_hash: card.card_hash,
      exclude_id: card.id,
    });

    if (!delete_result.ok) {
      logger.error(
        {
          user_id: user.id,
          payment_method_id: card.id,
          error: delete_result.error,
        },
        'Failed to delete duplicate cards'
      );
      return Result.fail(delete_result.error);
    }

    const deleted_count = delete_result.data;

    if (deleted_count > 0) {
      logger.info(
        {
          user_id: user.id,
          payment_method_id: card.id,
          duplicate_count: deleted_count,
        },
        'Duplicate valid cards deleted'
      );
    } else {
      logger.info(
        {
          user_id: user.id,
          payment_method_id: card.id,
        },
        'No duplicate valid cards found'
      );
    }

    return Result.success(undefined);
  } catch (e) {
    logger.error(
      {
        user_id: user.id,
        payment_method_id: card.id,
        error_message: e.message,
        error_stack: e.stack,
      },
      'Error during duplicate valid card check'
    );
    return Result.fail(new ServerInternalError(e));
  }
}
