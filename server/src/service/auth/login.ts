import User from 'model/User';
import JwtToken from 'lib/JwtToken';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { UnauthorizedError } from 'common/errors';
import { init_logger } from 'util/logger';

const logger = init_logger('auth:login');

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export async function login(input: LoginInput): Promise<Result<LoginResult, ApplicationError>> {
  try {
    const { email, password } = input;

    logger.info({ email }, 'Login attempt');

    // Fetch user by email
    const user_result = await User.fetch_by_email(email);
    if (!user_result.ok) {
      logger.error({ email, error: user_result.error }, 'Failed to fetch user during login');
      return Result.fail(user_result.error);
    }

    const user = user_result.data;
    if (!user) {
      logger.warn({ email }, 'Login failed: user not found');
      return Result.fail(new UnauthorizedError(null, 'Invalid email or password'));
    }

    // Verify password
    const is_valid_password = await User.verify_password(user, password);
    if (!is_valid_password) {
      logger.warn({ email }, 'Login failed: invalid password');
      return Result.fail(new UnauthorizedError(null, 'Invalid email or password'));
    }

    // Generate JWT token
    const token = JwtToken.from_user(user);

    logger.info({ email, userId: user.id }, 'Login successful');

    return Result.success({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        email: input.email,
      },
      'Server internal error encountered during login'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default login;
