import { PaymentStatus, PaymentTrack } from '@prisma/client';
import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import Payment from 'model/Payment';
import { init_logger } from 'util/logger';
import { RetryAction, ResolvedRetryDecision } from './retry_rules';

const logger = init_logger('payment:retry:schedule_retry_payment');

export type RetryScheduleResult = {
  action: RetryAction;
  scheduled_payment?: Payment;
  alert_required: boolean;
};

function merge_retry_routing_ctx(base_ctx: string[] = [], patch_ctx: string[] = []): string[] {
  return Array.from(new Set([...(base_ctx || []), ...(patch_ctx || [])]));
}

function get_next_friday(ref_date: Date): Date {
  const date = new Date(ref_date);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay(); // Sunday=0, Friday=5
  let days_until_friday = (5 - day + 7) % 7;
  if (days_until_friday === 0) {
    days_until_friday = 7;
  }

  date.setDate(date.getDate() + days_until_friday);
  return date;
}

function get_last_friday_of_month(year: number, month_zero_based: number): Date {
  const date = new Date(year, month_zero_based + 1, 0); // last day of month
  date.setHours(0, 0, 0, 0);

  while (date.getDay() !== 5) {
    date.setDate(date.getDate() - 1);
  }

  return date;
}

function get_next_friday_eom(ref_date: Date): Date {
  const ref = new Date(ref_date);
  ref.setHours(0, 0, 0, 0);

  let year = ref.getFullYear();
  let month = ref.getMonth();

  let eom_friday = get_last_friday_of_month(year, month);
  if (eom_friday <= ref) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    eom_friday = get_last_friday_of_month(year, month);
  }

  return eom_friday;
}

function get_retry_date(action: RetryAction, ref_date: Date): Date {
  switch (action) {
    case RetryAction.IMMEDIATE_RETRY:
      return new Date(ref_date);
    case RetryAction.RESCHEDULE_NEXT_FRIDAY:
      return get_next_friday(ref_date);
    case RetryAction.RESCHEDULE_NEXT_FRIDAY_EOM:
      return get_next_friday_eom(ref_date);
    default:
      return new Date(ref_date);
  }
}

export default async function schedule_retry_payment({
  payment,
  decision,
  ref_date,
}: {
  payment: Payment;
  decision: ResolvedRetryDecision;
  ref_date: Date;
}): Promise<Result<RetryScheduleResult, ApplicationError>> {
  try {
    if (
      decision.action === RetryAction.BACKOFF ||
      decision.action === RetryAction.ALERT_BACKOFF
    ) {
      return Result.success({
        action: decision.action,
        alert_required: decision.action === RetryAction.ALERT_BACKOFF,
      });
    }

    const retry_date = get_retry_date(decision.action, ref_date);
    const retry_routing_ctx = merge_retry_routing_ctx(
      payment.retry_routing_ctx,
      decision.retry_routing_ctx_patch
    );

    const create_result = await Payment.create({
      account_id: payment.account_id,
      date: retry_date,
      amount: payment.amount,
      type: payment.type,
      direction: payment.direction,
      track: decision.payment_track || payment.track || PaymentTrack.BANK_CARD,
      subscription_id: payment.subscription_id,
      billing_cycle_id: payment.billing_cycle_id,
      memo: `retry_for:${payment.id};code:${decision.code};bucket:${decision.bucket};action:${decision.action}`,
    });

    if (!create_result.ok) {
      return Result.fail(create_result.error);
    }

    const retry_payment = create_result.data;

    const update_result = await Payment.update(retry_payment.id, {
      status: PaymentStatus.SCHEDULED,
      retry_prev_payment_id: payment.id,
      retry_sequence_nb: (payment.retry_sequence_nb || 0) + 1,
      retry_routing_ctx,
      retry_annotation: `${decision.action}:${decision.bucket}`,
      retry_logic_version: 1,
      retry_trace_data: {
        source_payment_id: payment.id,
        source_code: decision.code,
        source_bucket: decision.bucket,
        total_retry_cnt: decision.total_retry_cnt,
      },
    });

    if (!update_result.ok) {
      return Result.fail(update_result.error);
    }

    return Result.success({
      action: decision.action,
      scheduled_payment: update_result.data,
      alert_required: false,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        payment_id: payment.id,
        decision,
      },
      'Failed to schedule retry payment'
    );
    return Result.fail(new ServerInternalError(e));
  }
}
