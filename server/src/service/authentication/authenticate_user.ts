import { AuthenticationError } from 'common/errors';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import JwtToken, { UserContext } from 'lib/JwtToken';
import Result from 'lib/Result';
import User from 'model/User';
import { init_logger } from 'util/logger';

const logger = init_logger('authenticate_user');

/**
 * Authenticates a user from a JWT token string.
 * Verifies the token and fetches the full user from the database.
 */
export default async function authenticate_user(args: {
  token_string: string;
}): Promise<Result<User, ApplicationError>> {
  try {
    let user_id: string;

    // Verify JWT and extract user context
    try {
      const user_context: UserContext | null = JwtToken.get_user_context(args.token_string);
      if (!user_context) {
        logger.info({ token: args.token_string }, 'Failed user authentication - invalid token');
        return Result.fail(new AuthenticationError(null, 'Unable to authenticate'));
      }
      user_id = user_context.id;
    } catch (e) {
      logger.info(
        {
          error: e,
          token: args.token_string,
        },
        'Failed user authentication'
      );
      return Result.fail(new AuthenticationError(e, 'Unable to authenticate'));
    }

    // Fetch user from database
    const user_result = await User.fetch_by_id(user_id);
    if (!user_result.ok) {
      return Result.fail(new AuthenticationError(null, 'Unable to authenticate'));
    }

    const user = user_result.data;
    if (!user || !user.id) {
      return Result.fail(new AuthenticationError(null, 'Unable to authenticate'));
    }

    return Result.success(user);
  } catch (e) {
    logger.error(
      {
        error: e,
        token: args.token_string,
      },
      'Error during authentication'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

/**
 * Authenticates a user from a JWT token string without fetching from database.
 * Only verifies the token and returns the user ID.
 */
export async function authenticate_user_no_fetch(args: {
  token_string: string;
}): Promise<Result<string, ApplicationError>> {
  try {
    // Verify JWT and extract user context
    try {
      const user_context: UserContext | null = JwtToken.get_user_context(args.token_string);
      if (!user_context) {
        logger.info({ token: args.token_string }, 'Failed user authentication - invalid token');
        return Result.fail(new AuthenticationError(null, 'Unable to authenticate'));
      }
      return Result.success(user_context.id);
    } catch (e) {
      logger.info(
        {
          error: e,
          token: args.token_string,
        },
        'Failed user authentication'
      );
      return Result.fail(new AuthenticationError(e, 'Unable to authenticate'));
    }
  } catch (e) {
    logger.error(
      {
        error: e,
        token: args.token_string,
      },
      'Error during authentication no fetch'
    );
    return Result.fail(new ServerInternalError(e));
  }
}
