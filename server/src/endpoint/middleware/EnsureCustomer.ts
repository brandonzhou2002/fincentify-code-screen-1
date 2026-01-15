import { UserStatus } from '@prisma/client';
import { FrozenUserError } from 'common/errors';
import Response from 'endpoint/response/Response';
import Result from 'lib/Result';
import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Context } from 'endpoint/context';

/**
 * Response returned when user status check fails
 */
export class EnsureCustomerErrorResponse extends Response(null) {}

/**
 * EnsureCustomer Middleware
 * -------------------------
 * Validates the authenticated user's account status.
 * Must be used after Authenticate middleware.
 *
 * Checks:
 * - User account is not SUSPENDED or INACTIVE
 *
 * Usage:
 * @UseMiddleware(Authenticate)
 * @UseMiddleware(EnsureCustomer)
 * async myResolver(@ValidatedUser() user: User) { ... }
 */
export default class EnsureCustomer implements MiddlewareInterface<Context> {
  async use({ root, args, context, info }: ResolverData<Context>, next: NextFn) {
    const user = context.user;

    if (!user) {
      return new EnsureCustomerErrorResponse(
        Result.fail(new FrozenUserError(null, 'User not authenticated.'))
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      return new EnsureCustomerErrorResponse(
        Result.fail(new FrozenUserError(null, 'Account is suspended.'))
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      return new EnsureCustomerErrorResponse(
        Result.fail(new FrozenUserError(null, 'Account is inactive.'))
      );
    }

    return next();
  }
}
