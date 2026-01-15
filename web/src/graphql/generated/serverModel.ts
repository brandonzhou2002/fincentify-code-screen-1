export const UserStatus = {
  ACTIVE: 'ACTIVE' as 'ACTIVE',
  INACTIVE: 'INACTIVE' as 'INACTIVE',
  SUSPENDED: 'SUSPENDED' as 'SUSPENDED',
};
export type UserStatusType = typeof UserStatus;

export const PaymentMethodType = {
  CARD: 'CARD' as 'CARD',
};
export type PaymentMethodTypeType = typeof PaymentMethodType;

export const PaymentMethodStatus = {
  PROCESSING: 'PROCESSING' as 'PROCESSING',
  VALID: 'VALID' as 'VALID',
  INVALID: 'INVALID' as 'INVALID',
  DELETED: 'DELETED' as 'DELETED',
  EXPIRED: 'EXPIRED' as 'EXPIRED',
  BLOCKED: 'BLOCKED' as 'BLOCKED',
  ADD_FAILED: 'ADD_FAILED' as 'ADD_FAILED',
};
export type PaymentMethodStatusType = typeof PaymentMethodStatus;

export const CardNetwork = {
  VISA: 'VISA' as 'VISA',
  MASTERCARD: 'MASTERCARD' as 'MASTERCARD',
  AMERICAN_EXPRESS: 'AMERICAN_EXPRESS' as 'AMERICAN_EXPRESS',
  DISCOVER: 'DISCOVER' as 'DISCOVER',
  UNIONPAY: 'UNIONPAY' as 'UNIONPAY',
  JCB: 'JCB' as 'JCB',
};
export type CardNetworkType = typeof CardNetwork;

export const CardFundingType = {
  CREDIT: 'CREDIT' as 'CREDIT',
  DEBIT: 'DEBIT' as 'DEBIT',
  PREPAID: 'PREPAID' as 'PREPAID',
};
export type CardFundingTypeType = typeof CardFundingType;

export const PaymentProvider = {
  PROVIDER_1: 'PROVIDER_1' as 'PROVIDER_1',
  PROVIDER_2: 'PROVIDER_2' as 'PROVIDER_2',
  PROVIDER_3: 'PROVIDER_3' as 'PROVIDER_3',
  PROVIDER_4: 'PROVIDER_4' as 'PROVIDER_4',
};
export type PaymentProviderType = typeof PaymentProvider;

export const PaymentStatus = {
  SCHEDULED: 'SCHEDULED' as 'SCHEDULED',
  PENDING: 'PENDING' as 'PENDING',
  SENT: 'SENT' as 'SENT',
  PAID: 'PAID' as 'PAID',
  FAILED: 'FAILED' as 'FAILED',
  CANCELLED: 'CANCELLED' as 'CANCELLED',
  REFUNDED: 'REFUNDED' as 'REFUNDED',
  BATCH_PROCESSING: 'BATCH_PROCESSING' as 'BATCH_PROCESSING',
  BATCH_FILE_ADDED: 'BATCH_FILE_ADDED' as 'BATCH_FILE_ADDED',
};
export type PaymentStatusType = typeof PaymentStatus;

export const PaymentDirectionType = {
  ACCOUNT_PAYABLE: 'ACCOUNT_PAYABLE' as 'ACCOUNT_PAYABLE',
  ACCOUNT_RECEIVABLE: 'ACCOUNT_RECEIVABLE' as 'ACCOUNT_RECEIVABLE',
};
export type PaymentDirectionTypeType = typeof PaymentDirectionType;

export const PaymentTrack = {
  BANK_CARD: 'BANK_CARD' as 'BANK_CARD',
  ANY_CARD: 'ANY_CARD' as 'ANY_CARD',
};
export type PaymentTrackType = typeof PaymentTrack;

export const PaymentType = {
  SUBSCRIPTION: 'SUBSCRIPTION' as 'SUBSCRIPTION',
  SUBSCRIPTION_RETRY: 'SUBSCRIPTION_RETRY' as 'SUBSCRIPTION_RETRY',
  SUBSCRIPTION_RETRY_LATER: 'SUBSCRIPTION_RETRY_LATER' as 'SUBSCRIPTION_RETRY_LATER',
  SUBSCRIPTION_MANUAL: 'SUBSCRIPTION_MANUAL' as 'SUBSCRIPTION_MANUAL',
  SUBSCRIPTION_ADMIN: 'SUBSCRIPTION_ADMIN' as 'SUBSCRIPTION_ADMIN',
  SUBSCRIPTION_FUNDING_SETTLEMENT: 'SUBSCRIPTION_FUNDING_SETTLEMENT' as 'SUBSCRIPTION_FUNDING_SETTLEMENT',
  OTHER: 'OTHER' as 'OTHER',
};
export type PaymentTypeType = typeof PaymentType;

export const PaymentAsyncProcessingStatus = {
  READY: 'READY' as 'READY',
  IN_PROGRESS: 'IN_PROGRESS' as 'IN_PROGRESS',
  ADDED_TO_FILE: 'ADDED_TO_FILE' as 'ADDED_TO_FILE',
  SENT_TO_PROCESSOR: 'SENT_TO_PROCESSOR' as 'SENT_TO_PROCESSOR',
};
export type PaymentAsyncProcessingStatusType = typeof PaymentAsyncProcessingStatus;

// Subscription enums
export const SubscriptionStatus = {
  TRIAL: 'TRIAL' as 'TRIAL',
  ACTIVE: 'ACTIVE' as 'ACTIVE',
  PAYMENT_FAILED: 'PAYMENT_FAILED' as 'PAYMENT_FAILED',
  OVERDUE: 'OVERDUE' as 'OVERDUE',
  SCHEDULED_CANCELLATION: 'SCHEDULED_CANCELLATION' as 'SCHEDULED_CANCELLATION',
  CANCELLED: 'CANCELLED' as 'CANCELLED',
  DEACTIVATED: 'DEACTIVATED' as 'DEACTIVATED',
  WRITTEN_OFF: 'WRITTEN_OFF' as 'WRITTEN_OFF',
  AWAITING_PAYMENT_CONFIRMATION: 'AWAITING_PAYMENT_CONFIRMATION' as 'AWAITING_PAYMENT_CONFIRMATION',
};
export type SubscriptionStatusType = typeof SubscriptionStatus;

export const SubscriptionType = {
  MEMBERSHIP: 'MEMBERSHIP' as 'MEMBERSHIP',
};
export type SubscriptionTypeType = typeof SubscriptionType;

export const SubscriptionProcessingStatus = {
  NONE: 'NONE' as 'NONE',
  PROCESSING: 'PROCESSING' as 'PROCESSING',
};
export type SubscriptionProcessingStatusType = typeof SubscriptionProcessingStatus;

// BillingCycle enums
export const BillingCycleStatus = {
  NEW: 'NEW' as 'NEW',
  UNPAID: 'UNPAID' as 'UNPAID',
  REFUNDED: 'REFUNDED' as 'REFUNDED',
  TRIAL: 'TRIAL' as 'TRIAL',
  PAID: 'PAID' as 'PAID',
  FREE_CREDIT: 'FREE_CREDIT' as 'FREE_CREDIT',
  CANCELLED: 'CANCELLED' as 'CANCELLED',
  WRITTEN_OFF: 'WRITTEN_OFF' as 'WRITTEN_OFF',
};
export type BillingCycleStatusType = typeof BillingCycleStatus;

// CustomerAccount enums
export const BillingAccountStatus = {
  OPEN: 'OPEN' as 'OPEN',
  CLOSED: 'CLOSED' as 'CLOSED',
};
export type BillingAccountStatusType = typeof BillingAccountStatus;

export const BillingAccountRating = {
  NA: 'NA' as 'NA',
  NEW: 'NEW' as 'NEW',
  OK: 'OK' as 'OK',
  MISSED: 'MISSED' as 'MISSED',
  D30: 'D30' as 'D30',
  D60: 'D60' as 'D60',
  D90: 'D90' as 'D90',
  D120: 'D120' as 'D120',
  D150: 'D150' as 'D150',
  D180: 'D180' as 'D180',
  WRITTEN_OFF: 'WRITTEN_OFF' as 'WRITTEN_OFF',
  PAID_PREV_WRITE_OFF: 'PAID_PREV_WRITE_OFF' as 'PAID_PREV_WRITE_OFF',
};
export type BillingAccountRatingType = typeof BillingAccountRating;

export const CustomerAccountType = {
  SUBSCRIPTION: 'SUBSCRIPTION' as 'SUBSCRIPTION',
};
export type CustomerAccountTypeType = typeof CustomerAccountType;

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: keyof UserStatusType;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  code: number;
  name: string;
  detail?: string;
  service?: string;
  flow?: string;
}

export interface PaymentMethodList {
  items: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  type: keyof PaymentMethodTypeType;
  status: keyof PaymentMethodStatusType;
  customer_id?: string;
  issuer?: string;
  iin?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  card_network?: keyof CardNetworkType;
  card_brand?: string;
  routing_nb?: string;
  account_name?: string;
  account_type?: string;
  funding_type?: keyof CardFundingTypeType;
  default: boolean;
  deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  processors?: PaymentMethodProcessor[];
}

export interface PaymentMethodProcessor {
  id: string;
  processor_external_id?: string;
  provider_name: keyof PaymentProviderType;
  payment_method_id: string;
  provider_account_id?: string;
  is_recurring?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Token {
  token: string;
}

export interface Payment {
  id: string;
  status: keyof PaymentStatusType;
  code?: number;
  direction?: keyof PaymentDirectionTypeType;
  track?: keyof PaymentTrackType;
  type: keyof PaymentTypeType;
  date: string;
  amount: number;
  transaction_id?: string;
  account_id: string;
  payment_method_id?: string;
  payment_method_processor_id?: string;
  subscription_id?: string;
  billing_cycle_id?: string;
  retry_routing_ctx: string[];
  retry_sequence_nb: number;
  retry_prev_payment_id?: string;
  retry_annotation?: string;
  retry_logic_version?: number;
  memo?: string;
  fail_reason?: string;
  processing_split_key?: number;
  async_processing_status?: keyof PaymentAsyncProcessingStatusType;
  async_processing_reference_id?: string;
  async_processing_input_file_id?: string;
  async_processing_output_file_id?: string;
  created_at: string;
  processed_at?: string;
  updated_at: string;
  payment_method?: PaymentMethod;
  payment_method_processor?: PaymentMethodProcessor;
}

export interface BillingCycle {
  id: string;
  start_date: string;
  end_date: string;
  status?: keyof BillingCycleStatusType;
  subscription_id?: string;
  days_overdue?: number;
  payment_date?: string;
  payment_amount?: number;
  memo?: string;
  deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAccount {
  id: string;
  customer_id?: string;
  type: keyof CustomerAccountTypeType;
  status: keyof BillingAccountStatusType;
  rating: keyof BillingAccountRatingType;
  balance: number;
  balance_due_date?: string;
  balance_past_due?: number;
  first_delinquent_date?: string;
  last_successful_payment_amount?: number;
  last_successful_payment_date?: string;
  last_failed_payment_amount?: number;
  last_failed_payment_date?: string;
  authorization_rate?: number;
  nsf_count?: number;
  card_block_count?: number;
  payment_history: string[];
  last_payment_history_update?: string;
  last_marking_date?: string;
  opened_on?: string;
  closed_on?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  account_id: string;
  type: keyof SubscriptionTypeType;
  status?: keyof SubscriptionStatusType;
  processing_status: keyof SubscriptionProcessingStatusType;
  start_date: string;
  inactive_after?: string;
  current_billing_cycle_id?: string;
  amount: number;
  payment_failure_cnt: number;
  last_marking_start?: string;
  last_marking_end?: string;
  created_at: string;
  updated_at: string;
  account?: CustomerAccount;
  current_billing_cycle?: BillingCycle;
}

export interface MembershipStatus {
  has_subscription: boolean;
  subscription?: Subscription;
  current_billing_cycle?: BillingCycle;
  account?: CustomerAccount;
  account_balance: number;
  next_billing_date?: string;
  is_trial: boolean;
  days_remaining_in_cycle: number;
}
