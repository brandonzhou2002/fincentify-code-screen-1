import { MiddlewareInterface, ResolverData, NextFn, createParamDecorator } from 'type-graphql';
import Result from 'lib/Result';
import { UserError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';
import authenticate_user, { authenticate_user_no_fetch } from 'service/authentication/authenticate_user';
import User from 'model/User';
import { init_logger } from 'util/logger';
import { Context } from 'endpoint/context';

const logger = init_logger('middleware::authenticate');

/**
 * Error thrown when authentication fails
 */
export class UnauthorizedAccess extends UserError(403)<Error> {}

/**
 * Response returned when authentication fails
 */
export class UnauthorizedAccessResponse extends Response(null) {}

/**
 * Authenticate Middleware
 * -----------------------
 * Validates JWT token from context and loads the full user object.
 * If authentication fails, returns UnauthorizedAccessResponse.
 * On success, populates context.user with the authenticated User.
 *
 * Usage:
 * @UseMiddleware(Authenticate)
 * async myResolver(@ValidatedUser() user: User) { ... }
 */
class Authenticate implements MiddlewareInterface<Context> {
  async use({ context, info }: ResolverData<Context>, next: NextFn) {
    const auth_token = context.auth_token;

    if (auth_token) {
      const response = await authenticate_user({
        token_string: auth_token,
      });

      if (response.ok) {
        context.user = response.data;
        return next();
      }
      logger.info(response.error, 'Error during authentication');
    }

    return new UnauthorizedAccessResponse(
      Result.fail(new UnauthorizedAccess(null, 'Login Required'))
    );
  }
}

/**
 * AuthenticateNoFetch Middleware
 * ------------------------------
 * Validates JWT token without fetching user from database.
 * Useful for endpoints that only need the user ID.
 * On success, populates context.user_id with the authenticated user's ID.
 */
export class AuthenticateNoFetch implements MiddlewareInterface<Context> {
  async use({ context, info }: ResolverData<Context>, next: NextFn) {
    const auth_token = context.auth_token;

    if (auth_token) {
      const response = await authenticate_user_no_fetch({
        token_string: auth_token,
      });

      if (response.ok) {
        context.user_id = response.data;
        return next();
      }
      logger.info(response.error, 'Error during authentication');
    }

    return new UnauthorizedAccessResponse(
      Result.fail(new UnauthorizedAccess(null, 'Login Required'))
    );
  }
}

/**
 * ValidatedUser Parameter Decorator
 * ---------------------------------
 * Injects the authenticated User from context into the resolver parameter.
 * Must be used with @UseMiddleware(Authenticate) decorator.
 *
 * Usage:
 * @UseMiddleware(Authenticate)
 * async myResolver(@ValidatedUser() user: User) { ... }
 */
export const ValidatedUser = () => {
  return createParamDecorator<Context>(({ context }) => context.user);
};

/**
 * ValidatedUserId Parameter Decorator
 * ------------------------------------
 * Injects the authenticated user ID from context into the resolver parameter.
 * Must be used with @UseMiddleware(AuthenticateNoFetch) decorator.
 */
export const ValidatedUserId = () => {
  return createParamDecorator<Context>(({ context }) => context.user_id);
};

export default Authenticate;
