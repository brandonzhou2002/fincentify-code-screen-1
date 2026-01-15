import { UserError } from 'lib/ApplicationError';

/**
 * Common Application Errors
 * -------------------------
 * Custom error classes for specific application error scenarios.
 */

// General errors
export class RecordNotFound extends UserError(4404)<Error> {}
export class InvarianceViolation extends UserError(1111, '')<Error> {}
export class ValidationError extends UserError(4400)<Error> {}
export class UnauthorizedError extends UserError(4401)<Error> {}
export class ForbiddenError extends UserError(4403)<Error> {}
export class RateLimitExceeded extends UserError(4429)<Error> {}
export class AuthenticationError extends UserError(4401, 'authentication')<Error> {}
export class FrozenUserError extends UserError(4403, 'user_status')<Error> {}
