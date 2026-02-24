import { UserError } from 'lib/ApplicationError';

/**
 * Payment-specific Application Errors
 * -----------------------------------
 * Custom error classes for payment processing error scenarios.
 */

// Card errors
export class CardGenericFailError extends UserError(4604, 'add_card')<Error> {}
export class CardAuthorizationFailed extends UserError(4411, 'authorize_card')<Error> {}
export class CardDetailsInvalidError extends UserError(4605, 'add_card')<Error> {}
export class UnsupportedCardType extends UserError(4606, 'add_card')<Error> {}
export class DuplicateCardError extends UserError(4607, 'add_card')<Error> {}
export class CardExpiredError extends UserError(4608, 'add_card')<Error> {}
export class CardRateLimitError extends UserError(4609, 'add_card')<Error> {}

// Payment method errors
export class PaymentMethodNotFound extends UserError(4440, 'payment')<Error> {}
export class PaymentMethodInvalid extends UserError(4441, 'payment')<Error> {}
export class NoValidPaymentMethod extends UserError(4442, 'payment')<Error> {}
export class NoEligibleProcessor extends UserError(4443, 'payment')<Error> {}
export class RetryNotPossible extends UserError(4444, 'payment')<Error> {}

// Payment processing errors
export class PaymentProcessingError extends UserError(4500, 'payment')<Error> {}
export class PaymentDeclined extends UserError(4501, 'payment')<Error> {}
export class InsufficientFunds extends UserError(4502, 'payment')<Error> {}
export class PaymentAlreadyProcessed extends UserError(4503, 'payment')<Error> {}
export class PaymentNotFound extends UserError(4404, 'payment')<Error> {}

// Provider errors
export class ProviderConnectionError extends UserError(5502, 'payment')<Error> {}
export class ProviderResponseError extends UserError(5503, 'payment')<Error> {}
