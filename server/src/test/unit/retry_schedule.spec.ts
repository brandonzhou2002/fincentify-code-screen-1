import 'reflect-metadata';
import { expect } from 'chai';
import { PaymentTrack } from '@prisma/client';
import { PaymentStatusCode } from '../../service/payment/PaymentStatusCode';
import schedule_retry_payment from '../../service/payment/retry/schedule_retry_payment';
import {
  AgingBucket,
  RetryAction,
  ResolvedRetryDecision,
} from '../../service/payment/retry/retry_rules';

const basePayment: any = {
  id: 'payment_1',
  account_id: 'account_1',
  amount: 1199,
  type: 'SUBSCRIPTION',
  direction: null,
  track: PaymentTrack.BANK_CARD,
  payment_method_id: null,
  payment_method_processor_id: null,
  subscription_id: null,
  billing_cycle_id: null,
  retry_routing_ctx: [],
  retry_sequence_nb: 0,
  date: new Date('2026-02-24T00:00:00.000Z'),
};

function makeDecision(action: RetryAction): ResolvedRetryDecision {
  return {
    action,
    payment_track: null,
    code: PaymentStatusCode.INTERNAL_FAILURE,
    bucket: AgingBucket.D0_30,
    total_retry_cnt: 0,
    retry_routing_ctx_patch: [],
  };
}

describe('retry scheduling result paths', () => {
  it('returns alert_required for ALERT_BACKOFF without scheduling new payment', async () => {
    const result = await schedule_retry_payment({
      payment: basePayment,
      decision: makeDecision(RetryAction.ALERT_BACKOFF),
      ref_date: new Date('2026-02-24T00:00:00.000Z'),
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.ALERT_BACKOFF);
    expect(result.data.alert_required).to.equal(true);
    expect(result.data.scheduled_payment).to.equal(undefined);
  });

  it('returns non-alert backoff without scheduling new payment', async () => {
    const result = await schedule_retry_payment({
      payment: basePayment,
      decision: makeDecision(RetryAction.BACKOFF),
      ref_date: new Date('2026-02-24T00:00:00.000Z'),
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.BACKOFF);
    expect(result.data.alert_required).to.equal(false);
    expect(result.data.scheduled_payment).to.equal(undefined);
  });
});
