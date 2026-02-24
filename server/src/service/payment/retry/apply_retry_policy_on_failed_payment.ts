import ApplicationError, { ServerInternalError } from 'lib/ApplicationError';
import Result from 'lib/Result';
import Payment from 'model/Payment';
import BillingCycle from 'model/BillingCycle';
import { init_logger } from 'util/logger';
import { PaymentStatusCode } from '../PaymentStatusCode';
import schedule_retry_payment, { RetryScheduleResult } from './schedule_retry_payment';
import { resolve_retry_decision } from './retry_rules';

const logger = init_logger('payment:retry:apply_retry_policy');

function compute_days_overdue_from_payment_date({ payment, ref_date }: { payment: Payment; ref_date: Date }): number {
  const age_ms = ref_date.getTime() - new Date(payment.date).getTime();
  return Math.max(0, Math.floor(age_ms / (1000 * 60 * 60 * 24)));
}

async function compute_days_overdue({ payment, ref_date }: { payment: Payment; ref_date: Date }): Promise<number> {
  if (!payment.billing_cycle_id) {
    return compute_days_overdue_from_payment_date({ payment, ref_date });
  }

  const billing_cycle_result = await BillingCycle.fetch_by_id(payment.billing_cycle_id);
  if (!billing_cycle_result.ok || !billing_cycle_result.data) {
    return compute_days_overdue_from_payment_date({ payment, ref_date });
  }

  const billing_cycle = billing_cycle_result.data;
  if (billing_cycle.days_overdue !== null && billing_cycle.days_overdue !== undefined) {
    return Math.max(0, billing_cycle.days_overdue);
  }

  const age_ms = ref_date.getTime() - new Date(billing_cycle.start_date).getTime();
  return Math.max(0, Math.floor(age_ms / (1000 * 60 * 60 * 24)));
}

export default async function apply_retry_policy_on_failed_payment({
  payment,
  code,
  ref_date,
}: {
  payment: Payment;
  code: PaymentStatusCode;
  ref_date: Date;
}): Promise<Result<RetryScheduleResult, ApplicationError>> {
  try {
    const days_overdue = await compute_days_overdue({ payment, ref_date });
    const total_retry_cnt = payment.retry_sequence_nb || 0;

    const decision_result = resolve_retry_decision({
      code,
      days_overdue,
      total_retry_cnt,
    });

    if (!decision_result.ok) {
      return Result.fail(decision_result.error);
    }

    const decision = decision_result.data;

    logger.info(
      {
        payment_id: payment.id,
        code,
        days_overdue,
        total_retry_cnt,
        action: decision.action,
        track: decision.payment_track,
        bucket: decision.bucket,
        retry_routing_ctx_patch: decision.retry_routing_ctx_patch,
      },
      'Resolved retry policy for failed payment'
    );

    return schedule_retry_payment({
      payment,
      decision,
      ref_date,
    });
  } catch (e) {
    logger.error(
      {
        error_message: e.message,
        error_stack: e.stack,
        payment_id: payment.id,
        code,
      },
      'Failed to apply retry policy on failed payment'
    );
    return Result.fail(new ServerInternalError(e));
  }
}
