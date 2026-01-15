/* eslint-disable @typescript-eslint/ban-ts-comment */
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { get_logger, Logger } from 'util/logger';

/**
 * ServiceWrapper
 * --------------
 * Standardizes error handling for service layer functions.
 *
 * This wrapper:
 * 1. Provides a memoized logger to the service function
 * 2. Handles ApplicationError vs native Error differentiation
 * 3. Wraps native Node.js errors in ServerInternalError
 * 4. Passes through ApplicationErrors as-is
 * 5. Returns Result<T, ApplicationError>
 *
 * The service function is responsible for:
 * - All logging (info, error, etc.) using the provided logger
 * - Returning Result.success() or Result.fail() for expected errors
 * - Throwing ApplicationError for exceptional cases
 *
 * @example Basic usage with direct export (inferred types)
 * export default ServiceWrapper(
 *   'login_customer',
 *   async (args: { email: string; password: string }, logger) => {
 *     logger.info({ email: args.email }, 'Attempting login');
 *
 *     if (!validateEmail(args.email)) {
 *       logger.error({ email: args.email }, 'Invalid email format');
 *       return Result.fail(new InvalidEmailError());
 *     }
 *
 *     const token = await generateToken();
 *     logger.info({ email: args.email }, 'Login successful');
 *     return Result.success(token);
 *   }
 * );
 *
 * @example With explicit type parameters
 * type LoginInput = {
 *   email: string;
 *   password: string;
 * };
 *
 * export default ServiceWrapper<LoginInput, JwtToken>(
 *   'login_customer',
 *   async (args, logger) => {
 *     // args is typed as LoginInput
 *     // return type must be Result<JwtToken, ApplicationError>
 *     logger.info({ email: args.email }, 'Attempting login');
 *
 *     const token = await generateToken();
 *     return Result.success(token); // token must be JwtToken
 *   }
 * );
 *
 * @example With detailed context logging
 * export default ServiceWrapper<PullFundsArgs, Payment>(
 *   'pull_funds',
 *   async (args, logger) => {
 *     logger.info(
 *       {
 *         payment_id: args.payment.id,
 *         customer_id: args.customer?.id,
 *         amount: args.payment.amount,
 *       },
 *       'Starting pull funds'
 *     );
 *
 *     // Service logic here
 *
 *     if (result.ok) {
 *       logger.info({ payment_id: args.payment.id }, 'Pull funds successful');
 *     } else {
 *       logger.error({ payment_id: args.payment.id, code: result.error.code }, 'Pull funds failed');
 *     }
 *
 *     return result; // result must be Result<Payment, ApplicationError>
 *   }
 * );
 */
export function ServiceWrapper<TArgs, TReturn>(
  service_name: string,
  fn: (args: TArgs, logger: Logger) => Promise<Result<TReturn, ApplicationError>>
): (args: TArgs) => Promise<Result<TReturn, ApplicationError>> {
  const logger = get_logger(service_name);

  return async (args: TArgs): Promise<Result<TReturn, ApplicationError>> => {
    try {
      return await fn(args, logger);
    } catch (e) {
      // Check if this is an ApplicationError
      if (e._t === 'ApplicationError') {
        // ApplicationError - pass through as-is
        logger.error(
          {
            error_code: e.code,
            error_message: e.detail,

            error: e.source_error,
            //@ts-ignore
            ...(args && args.customer_id && { customer_id: args.customer_id }),
            //@ts-ignore
            ...(args && args.customer && { customer_id: args.customer.id }),
            //@ts-ignore
            ...(args && args.payment_id && { payment_id: args.payment_id }),
            //@ts-ignore
            ...(args && args.payment && { payment_id: args.payment.id }),
            //@ts-ignore
            ...(args && args.account_id && { account_id: args.account_id }),
            //@ts-ignore
            ...(args && args.account && { account_id: args.account.id }),
          },
          `Application error encountered in ${service_name}`
        );
        return Result.fail(e);
      }

      // This is a native Node.js error, wrap it in ServerInternalError
      logger.error(
        {
          error_name: e.name,
          error_message: e.message,
          error_stack: e.stack,
          //@ts-ignore
          ...(args && args.customer_id && { customer_id: args.customer_id }),
          //@ts-ignore
          ...(args && args.customer && { customer_id: args.customer.id }),
          //@ts-ignore
          ...(args && args.payment_id && { payment_id: args.payment_id }),
          //@ts-ignore
          ...(args && args.payment && { payment_id: args.payment.id }),
          //@ts-ignore
          ...(args && args.account_id && { account_id: args.account_id }),
          //@ts-ignore
          ...(args && args.account && { account_id: args.account.id }),
        },
        `Server internal error encountered in ${service_name}`
      );
      return Result.fail(new ServerInternalError(e));
    }
  };
}

export default ServiceWrapper;
