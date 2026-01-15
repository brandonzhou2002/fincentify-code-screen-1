import User, { CreateUserInput } from 'model/User';
import JwtToken from 'lib/JwtToken';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import { ValidationError } from 'common/errors';
import { init_logger } from 'util/logger';

const logger = init_logger('auth:signup');

export interface SignupInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface SignupResult {
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export async function signup(input: SignupInput): Promise<Result<SignupResult, ApplicationError>> {
  try {
    const { email, password, first_name, last_name } = input;

    logger.info({ email }, 'Signup attempt');

    // Validate input
    if (!email || !password) {
      return Result.fail(new ValidationError(null, 'Email and password are required'));
    }

    if (password.length < 8) {
      return Result.fail(new ValidationError(null, 'Password must be at least 8 characters'));
    }

    // Create user
    const create_input: CreateUserInput = {
      email,
      password,
      first_name,
      last_name,
    };

    const user_result = await User.create(create_input);
    if (!user_result.ok) {
      logger.error({ email, error: user_result.error }, 'Failed to create user during signup');
      return Result.fail(user_result.error);
    }

    const user = user_result.data;

    // Generate JWT token
    const token = JwtToken.from_user(user);

    logger.info({ email, userId: user.id }, 'Signup successful');

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
      'Server internal error encountered during signup'
    );
    return Result.fail(new ServerInternalError(e));
  }
}

export default signup;
