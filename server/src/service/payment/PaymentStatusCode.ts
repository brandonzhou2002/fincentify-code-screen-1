/**
 * PaymentStatusCode
 * -----------------
 * Standardized status codes for payment processing outcomes.
 *
 * Code ranges:
 * - 100-199: Processing states (async/pending)
 * - 200-299: Sent to processor states
 * - 400-499: No valid payment method/processor found
 * - 600-699: Card-specific failures
 * - 700-799: Payment failures (NSF, disputes, etc.)
 * - 800-899: Success states
 * - 900-999: Internal/external failures
 */
export enum PaymentStatusCode {
  // Success
  SUCCESS = 800,

  // Processing states
  PROCESSING = 100,
  AWAITING_FILE_PROCESSING = 101,
  FILE_SENT_TO_PROCESSOR = 102,
  SENT_TO_PROCESSOR = 200,

  // No valid payment method/processor
  NO_VALID_BANK_CARD = 440,
  NO_REMAINING_BANK_CARD_PROCESSOR = 441,
  NO_REMAINING_BANK_EFT_PROCESSOR = 442,
  NO_VALID_BANK_EFT = 443,
  NO_VALID_ANY_CARD = 444,
  NO_REMAINING_ANY_CARD_PROCESSOR = 445,
  NOT_ATTEMPTED = 450,
  PRESUMED_FAILED = 499,

  // Card-specific failures
  CARD_GATEWAY_BLOCK = 601,
  CARD_ISSUER_BLOCK = 603,
  CARD_GENERIC_FAIL = 604,
  CARD_INVALID = 605,
  CARD_EXPIRED = 606,
  CARD_ISSUER_HARD_DECLINE = 607,

  // EFT-specific failures
  EFT_ISSUER_BLOCK = 613,
  EFT_INVALID_INFO = 615,
  EFT_ACCOUNT_CLOSED = 616,
  EFT_GENERIC_FAIL = 640,

  // Interac-specific failures
  INTERAC_GENERIC_FAIL = 624,
  INTERAC_INVALID_INFO = 625,
  INTERAC_INVALID_DEST = 626,
  INTERAC_ANR_UNAVAILABLE = 627,

  // Payment failures
  NSF = 701,
  DISPUTED = 703,
  REFUNDED = 705,
  RETRY_LATER = 706,
  EFT_NSF = 710,
  FRAUDULENT = 777,

  // System failures
  INTERNAL_FAILURE = 903,
  EXTERNAL_FAILURE = 904,
}

/**
 * Check if a status code represents a successful outcome
 */
export function is_success_code(code: PaymentStatusCode): boolean {
  return code === PaymentStatusCode.SUCCESS;
}

/**
 * Check if a status code represents a processing/pending state
 */
export function is_processing_code(code: PaymentStatusCode): boolean {
  return [
    PaymentStatusCode.PROCESSING,
    PaymentStatusCode.AWAITING_FILE_PROCESSING,
    PaymentStatusCode.FILE_SENT_TO_PROCESSOR,
    PaymentStatusCode.SENT_TO_PROCESSOR,
  ].includes(code);
}

/**
 * Check if a status code represents a hard decline (no retry should be attempted)
 */
export function is_hard_decline_code(code: PaymentStatusCode): boolean {
  return [
    PaymentStatusCode.CARD_INVALID,
    PaymentStatusCode.CARD_EXPIRED,
    PaymentStatusCode.CARD_ISSUER_HARD_DECLINE,
    PaymentStatusCode.EFT_ISSUER_BLOCK,
    PaymentStatusCode.EFT_INVALID_INFO,
    PaymentStatusCode.EFT_ACCOUNT_CLOSED,
    PaymentStatusCode.FRAUDULENT,
  ].includes(code);
}

/**
 * Check if a status code indicates no valid payment method was found
 */
export function is_no_payment_method_code(code: PaymentStatusCode): boolean {
  return [
    PaymentStatusCode.NO_VALID_BANK_CARD,
    PaymentStatusCode.NO_VALID_BANK_EFT,
    PaymentStatusCode.NO_VALID_ANY_CARD,
    PaymentStatusCode.NO_REMAINING_BANK_CARD_PROCESSOR,
    PaymentStatusCode.NO_REMAINING_BANK_EFT_PROCESSOR,
    PaymentStatusCode.NO_REMAINING_ANY_CARD_PROCESSOR,
  ].includes(code);
}

export default PaymentStatusCode;
