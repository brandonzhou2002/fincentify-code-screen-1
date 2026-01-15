export const ERROR_CODES = {
  AuthenticationError: 403,

  InternalServerError: 503,

  ActiveEPADetected: 1111,

  UserValidationError: 1400,
  UserNotFoundError: 1404,

  FailedVerifyPinError: 1451,
  DuplicatePhoneNumberError: 1452,
  DuplicatePasswordError: 1453,
  WrongPasswordError: 1454,
  DuplicateEmailError: 1455,

  RedisKeyNoExistError: 1460,

  PreexistingCheckoutActiveError: 1469,

  FailedToTransitionState: 1487,

  NoAddressFoundError: 1480,
  LeasePriceExceeded: 1481,
  ProductNotFoundError: 1490,
  FrozenUserError: 1495,
  RecentlyDeclinedUserApplication: 1958,

  LeaseAlreadyCompletedError: 2100,

  FailedToRetrievePaymentMethodError: 2670,
  PaymentMethodAlreadyExistsError: 2671,

  UnsupportedCardType: 7997,
  CardAuthorizationFailed: 4411,
  CheckOutNotFound: 4069,

  RequestInFlight: 4400,
  RecordNotFound: 4404,
  // When merchant tries to create a checkout with the customer code of a custeomer
  // who hasn't selected their payment account
  NoCustomerDefaultPayment: 9399,
};
