import { expect } from 'chai';
import { PaymentTrack } from '@prisma/client';
import { PaymentStatusCode } from '../../service/payment/PaymentStatusCode';
import {
  AgingBucket,
  RetryAction,
  get_aging_bucket,
  resolve_retry_decision,
} from '../../service/payment/retry/retry_rules';

describe('payment retry rules', () => {
  it('maps days overdue to expected bucket boundaries', () => {
    expect(get_aging_bucket(0)).to.equal(AgingBucket.D0_30);
    expect(get_aging_bucket(30)).to.equal(AgingBucket.D0_30);
    expect(get_aging_bucket(31)).to.equal(AgingBucket.D31_60);
    expect(get_aging_bucket(60)).to.equal(AgingBucket.D31_60);
    expect(get_aging_bucket(61)).to.equal(AgingBucket.D61_180);
    expect(get_aging_bucket(180)).to.equal(AgingBucket.D61_180);
    expect(get_aging_bucket(181)).to.equal(AgingBucket.D181_PLUS);
  });

  it('returns immediate retry for external failure in 0-30 bucket', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.EXTERNAL_FAILURE,
      days_overdue: 10,
      total_retry_cnt: 0,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.IMMEDIATE_RETRY);
    expect(result.data.payment_track).to.equal(PaymentTrack.ANY_CARD);
  });

  it('returns alert + backoff for internal failure in 0-30 bucket', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.INTERNAL_FAILURE,
      days_overdue: 5,
      total_retry_cnt: 0,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.ALERT_BACKOFF);
    expect(result.data.payment_track).to.equal(null);
  });

  it('returns backoff for external failure in 181+ bucket', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.EXTERNAL_FAILURE,
      days_overdue: 181,
      total_retry_cnt: 0,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.BACKOFF);
    expect(result.data.payment_track).to.equal(null);
  });

  it('applies provider-1 exclusion override in 31-60 bucket when retries exceed threshold', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.NSF,
      days_overdue: 45,
      total_retry_cnt: 9,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.RESCHEDULE_NEXT_FRIDAY);
    expect(result.data.retry_routing_ctx_patch).to.deep.equal([
      'NO_PROVIDER_1',
    ]);
  });

  it('applies provider-1 exclusion override for 601 in 31-60 bucket over threshold', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.CARD_GATEWAY_BLOCK,
      days_overdue: 45,
      total_retry_cnt: 9,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.RESCHEDULE_NEXT_FRIDAY_EOM);
    expect(result.data.payment_track).to.equal(PaymentTrack.BANK_CARD);
    expect(result.data.retry_routing_ctx_patch).to.deep.equal(['NO_PROVIDER_1']);
  });

  it('keeps 61-180 behavior for 701 at retry count threshold (<= 12)', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.NSF,
      days_overdue: 120,
      total_retry_cnt: 12,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.RESCHEDULE_NEXT_FRIDAY_EOM);
    expect(result.data.payment_track).to.equal(PaymentTrack.BANK_CARD);
  });

  it('forces backoff for 61-180 bucket when retries exceed 12 on configured codes', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.NO_REMAINING_BANK_CARD_PROCESSOR,
      days_overdue: 100,
      total_retry_cnt: 13,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.BACKOFF);
    expect(result.data.payment_track).to.equal(null);
  });

  it('returns RetryNotPossible error on not-possible codes', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.NO_VALID_ANY_CARD,
      days_overdue: 10,
      total_retry_cnt: 0,
    });

    expect(result.ok).to.equal(false);
    expect(result.error.name).to.equal('RetryNotPossible');
  });

  it('returns RetryNotPossible error for EFT not-possible codes', () => {
    const result = resolve_retry_decision({
      code: PaymentStatusCode.EFT_GENERIC_FAIL,
      days_overdue: 20,
      total_retry_cnt: 1,
    });

    expect(result.ok).to.equal(false);
    expect(result.error.name).to.equal('RetryNotPossible');
  });

  it('falls back to backoff for unknown codes', () => {
    const result = resolve_retry_decision({
      code: 999 as PaymentStatusCode,
      days_overdue: 10,
      total_retry_cnt: 0,
    });

    expect(result.ok).to.equal(true);
    expect(result.data.action).to.equal(RetryAction.BACKOFF);
    expect(result.data.payment_track).to.equal(null);
  });
});
