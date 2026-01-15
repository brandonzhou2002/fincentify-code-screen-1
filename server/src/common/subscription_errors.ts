import { UserError } from 'lib/ApplicationError';

/**
 * Subscription-related Application Errors
 * ----------------------------------------
 * Custom error classes for subscription operations.
 */

export class AlreadyHasSubscription extends UserError(4409, 'subscription')<Error> {}
export class SubscriptionNotFound extends UserError(4404, 'subscription')<Error> {}
export class SubscriptionNotCancellable extends UserError(4400, 'subscription')<Error> {}
export class TrialNotAvailable extends UserError(4400, 'subscription')<Error> {}
export class InvalidSubscriptionState extends UserError(4400, 'subscription')<Error> {}
