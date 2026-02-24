import { PaymentTrack } from '@prisma/client';
import { RetryNotPossible } from 'common/payment_errors';
import Result from 'lib/Result';
import ApplicationError from 'lib/ApplicationError';
import { PaymentStatusCode } from '../PaymentStatusCode';

const RETRY_CONTEXT_NO_PROVIDER_1 = 'NO_PROVIDER_1';

export enum RetryAction {
  IMMEDIATE_RETRY = 'IMMEDIATE_RETRY',
  RESCHEDULE_NEXT_FRIDAY = 'RESCHEDULE_NEXT_FRIDAY',
  RESCHEDULE_NEXT_FRIDAY_EOM = 'RESCHEDULE_NEXT_FRIDAY_EOM',
  ALERT_BACKOFF = 'ALERT_BACKOFF',
  BACKOFF = 'BACKOFF',
  NOT_POSSIBLE = 'NOT_POSSIBLE',
}

export enum AgingBucket {
  D0_30 = 'D0_30',
  D31_60 = 'D31_60',
  D61_180 = 'D61_180',
  D181_PLUS = 'D181_PLUS',
}

export type RetryRuleDecision = {
  action: RetryAction;
  payment_track: PaymentTrack | null;
};

export type ResolvedRetryDecision = RetryRuleDecision & {
  code: PaymentStatusCode;
  bucket: AgingBucket;
  total_retry_cnt: number;
  retry_routing_ctx_patch: string[];
};

const CARD_DECISION: RetryRuleDecision = {
  action: RetryAction.IMMEDIATE_RETRY,
  payment_track: PaymentTrack.ANY_CARD,
};

const BANK_CARD_FRIDAY: RetryRuleDecision = {
  action: RetryAction.RESCHEDULE_NEXT_FRIDAY,
  payment_track: PaymentTrack.BANK_CARD,
};

const BANK_CARD_FRIDAY_EOM: RetryRuleDecision = {
  action: RetryAction.RESCHEDULE_NEXT_FRIDAY_EOM,
  payment_track: PaymentTrack.BANK_CARD,
};

const ALERT_BACKOFF_DECISION: RetryRuleDecision = {
  action: RetryAction.ALERT_BACKOFF,
  payment_track: null,
};

const BACKOFF_DECISION: RetryRuleDecision = {
  action: RetryAction.BACKOFF,
  payment_track: null,
};

const NOT_POSSIBLE_DECISION: RetryRuleDecision = {
  action: RetryAction.NOT_POSSIBLE,
  payment_track: null,
};

const RETRY_RULES_BY_CODE: Partial<Record<PaymentStatusCode, Record<AgingBucket, RetryRuleDecision>>> = {
  [PaymentStatusCode.EXTERNAL_FAILURE]: {
    [AgingBucket.D0_30]: CARD_DECISION,
    [AgingBucket.D31_60]: CARD_DECISION,
    [AgingBucket.D61_180]: CARD_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.INTERNAL_FAILURE]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.NO_VALID_BANK_CARD]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.NO_REMAINING_BANK_CARD_PROCESSOR]: {
    [AgingBucket.D0_30]: BANK_CARD_FRIDAY,
    [AgingBucket.D31_60]: BANK_CARD_FRIDAY,
    [AgingBucket.D61_180]: BANK_CARD_FRIDAY_EOM,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.NO_VALID_ANY_CARD]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.NO_REMAINING_ANY_CARD_PROCESSOR]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.CARD_GATEWAY_BLOCK]: {
    [AgingBucket.D0_30]: BANK_CARD_FRIDAY_EOM,
    [AgingBucket.D31_60]: BANK_CARD_FRIDAY_EOM,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.CARD_ISSUER_BLOCK]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.CARD_GENERIC_FAIL]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.CARD_INVALID]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.CARD_EXPIRED]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.CARD_ISSUER_HARD_DECLINE]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.FRAUDULENT]: {
    [AgingBucket.D0_30]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D31_60]: ALERT_BACKOFF_DECISION,
    [AgingBucket.D61_180]: BACKOFF_DECISION,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.NSF]: {
    [AgingBucket.D0_30]: BANK_CARD_FRIDAY,
    [AgingBucket.D31_60]: BANK_CARD_FRIDAY,
    [AgingBucket.D61_180]: BANK_CARD_FRIDAY_EOM,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.RETRY_LATER]: {
    [AgingBucket.D0_30]: BANK_CARD_FRIDAY,
    [AgingBucket.D31_60]: BANK_CARD_FRIDAY,
    [AgingBucket.D61_180]: BANK_CARD_FRIDAY_EOM,
    [AgingBucket.D181_PLUS]: BACKOFF_DECISION,
  },
  [PaymentStatusCode.NO_REMAINING_BANK_EFT_PROCESSOR]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.NO_VALID_BANK_EFT]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.EFT_ISSUER_BLOCK]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.EFT_INVALID_INFO]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.EFT_ACCOUNT_CLOSED]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.EFT_GENERIC_FAIL]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
  [PaymentStatusCode.EFT_NSF]: {
    [AgingBucket.D0_30]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D31_60]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D61_180]: NOT_POSSIBLE_DECISION,
    [AgingBucket.D181_PLUS]: NOT_POSSIBLE_DECISION,
  },
};

const PROCESSOR_1_EXCLUSION_CODES = new Set<PaymentStatusCode>([
  PaymentStatusCode.EXTERNAL_FAILURE,
  PaymentStatusCode.NO_REMAINING_BANK_CARD_PROCESSOR,
  PaymentStatusCode.CARD_GATEWAY_BLOCK,
  PaymentStatusCode.NSF,
  PaymentStatusCode.RETRY_LATER,
]);

const FORCE_BACKOFF_AFTER_12_CODES = new Set<PaymentStatusCode>([
  PaymentStatusCode.NO_REMAINING_BANK_CARD_PROCESSOR,
  PaymentStatusCode.NSF,
  PaymentStatusCode.RETRY_LATER,
]);

export function get_aging_bucket(days_overdue: number): AgingBucket {
  if (days_overdue < 0) return AgingBucket.D0_30;
  if (days_overdue <= 30) return AgingBucket.D0_30;
  if (days_overdue <= 60) return AgingBucket.D31_60;
  if (days_overdue <= 180) return AgingBucket.D61_180;
  return AgingBucket.D181_PLUS;
}

export function resolve_retry_decision({
  code,
  days_overdue,
  total_retry_cnt,
}: {
  code: PaymentStatusCode;
  days_overdue: number;
  total_retry_cnt: number;
}): Result<ResolvedRetryDecision, ApplicationError> {
  const bucket = get_aging_bucket(days_overdue);
  const rule_by_bucket = RETRY_RULES_BY_CODE[code];
  let decision = (rule_by_bucket && rule_by_bucket[bucket]) || BACKOFF_DECISION;

  if (
    bucket === AgingBucket.D61_180 &&
    FORCE_BACKOFF_AFTER_12_CODES.has(code) &&
    total_retry_cnt > 12
  ) {
    decision = BACKOFF_DECISION;
  }

  const retry_routing_ctx_patch: string[] = [];

  if (
    bucket === AgingBucket.D31_60 &&
    PROCESSOR_1_EXCLUSION_CODES.has(code) &&
    total_retry_cnt > 8
  ) {
    retry_routing_ctx_patch.push(RETRY_CONTEXT_NO_PROVIDER_1);
  }

  // Uf the action is NOT_POSSIBLE, we can short-circuit and avoid returning 
  // the rest of the decision data by returning an error.
  if (decision.action === RetryAction.NOT_POSSIBLE) {
    return Result.fail(new RetryNotPossible(null, `No retry is possible for status code ${code}`));
  }

  return Result.success({
    ...decision,
    code,
    bucket,
    total_retry_cnt,
    retry_routing_ctx_patch,
  });
}
