import { gql } from '@apollo/client';

/*************************************************************************************
  These are standard gql fragments for querying all the fields on our backend objects

  Note:
  - These are built to have to option to be customized. To override a subfragment,
    make a subfragment with the same name as the one being overridden as a function,
    and pass it in to the parent fragment subfragmentOverrides

    eg. const ErrorFragment = () => gql`
      fragment ErrorFragment on ErrorResponse {
        code
        // Note we omitted fields to customize this query
      }
    `

    ParentFragment({errorFragment: ErrorFragment})

*************************************************************************************/


export const UserFragment = () => gql`
  fragment UserFragment on User {
    id
    email
    first_name
    last_name
    status
    created_at
    updated_at
  }
`;

export const ErrorResponseFragment = () => gql`
  fragment ErrorResponseFragment on ErrorResponse {
    code
    name
    detail
    service
    flow
  }
`;

export const PaymentMethodProcessorFragment = () => gql`
  fragment PaymentMethodProcessorFragment on PaymentMethodProcessor {
    id
    processor_external_id
    provider_name
    payment_method_id
    provider_account_id
    is_recurring
    created_at
    updated_at
  }
`;

export const TokenFragment = () => gql`
  fragment TokenFragment on Token {
    token
  }
`;

const paymentMethodListFragmentDefaultSubfragments = {
  paymentMethodFragment: PaymentMethodFragment,
};

export function PaymentMethodListFragment(subfragmentOverrides = {}) {
  const subfragments = {
    ...paymentMethodListFragmentDefaultSubfragments,
    ...subfragmentOverrides,
  }

  return gql`
    
    ${subfragments.paymentMethodFragment()}

    fragment PaymentMethodListFragment on PaymentMethodList {
      items {
        ...PaymentMethodFragment
      }
    }
  `;
};

const paymentMethodFragmentDefaultSubfragments = {
  paymentMethodProcessorFragment: PaymentMethodProcessorFragment,
};

export function PaymentMethodFragment(subfragmentOverrides = {}) {
  const subfragments = {
    ...paymentMethodFragmentDefaultSubfragments,
    ...subfragmentOverrides,
  }

  return gql`
    
    ${subfragments.paymentMethodProcessorFragment()}

    fragment PaymentMethodFragment on PaymentMethod {
      id
      type
      status
      customer_id
      issuer
      iin
      last4
      exp_month
      exp_year
      card_network
      card_brand
      routing_nb
      account_name
      account_type
      funding_type
      default
      deleted
      deleted_at
      deleted_by
      memo
      created_at
      updated_at
      processors {
        ...PaymentMethodProcessorFragment
      }
    }
  `;
};

const paymentFragmentDefaultSubfragments = {
  paymentMethodFragment: PaymentMethodFragment,
  paymentMethodProcessorFragment: PaymentMethodProcessorFragment,
};

export function PaymentFragment(subfragmentOverrides = {}) {
  const subfragments = {
    ...paymentFragmentDefaultSubfragments,
    ...subfragmentOverrides,
  }

  return gql`

    ${subfragments.paymentMethodFragment()}
    ${subfragments.paymentMethodProcessorFragment()}

    fragment PaymentFragment on Payment {
      id
      status
      code
      direction
      track
      type
      date
      amount
      transaction_id
      account_id
      payment_method_id
      payment_method_processor_id
      subscription_id
      billing_cycle_id
      retry_routing_ctx
      retry_sequence_nb
      retry_prev_payment_id
      retry_annotation
      retry_logic_version
      memo
      fail_reason
      processing_split_key
      async_processing_status
      async_processing_reference_id
      async_processing_input_file_id
      async_processing_output_file_id
      created_at
      processed_at
      updated_at
      payment_method {
        ...PaymentMethodFragment
      }
      payment_method_processor {
        ...PaymentMethodProcessorFragment
      }
    }
  `;
};

// Billing Cycle Fragment
export const BillingCycleFragment = () => gql`
  fragment BillingCycleFragment on BillingCycle {
    id
    start_date
    end_date
    status
    subscription_id
    days_overdue
    payment_date
    payment_amount
    memo
    deleted
    deleted_at
    created_at
    updated_at
  }
`;

// Customer Account Fragment
export const CustomerAccountFragment = () => gql`
  fragment CustomerAccountFragment on CustomerAccount {
    id
    customer_id
    type
    status
    rating
    balance
    balance_due_date
    balance_past_due
    first_delinquent_date
    last_successful_payment_amount
    last_successful_payment_date
    last_failed_payment_amount
    last_failed_payment_date
    authorization_rate
    nsf_count
    card_block_count
    payment_history
    last_payment_history_update
    last_marking_date
    opened_on
    closed_on
    created_at
    updated_at
  }
`;

// Subscription Fragment
const subscriptionFragmentDefaultSubfragments = {
  billingCycleFragment: BillingCycleFragment,
  customerAccountFragment: CustomerAccountFragment,
};

export function SubscriptionFragment(subfragmentOverrides = {}) {
  const subfragments = {
    ...subscriptionFragmentDefaultSubfragments,
    ...subfragmentOverrides,
  };

  return gql`
    ${subfragments.billingCycleFragment()}
    ${subfragments.customerAccountFragment()}

    fragment SubscriptionFragment on Subscription {
      id
      customer_id
      account_id
      type
      status
      processing_status
      start_date
      inactive_after
      current_billing_cycle_id
      amount
      payment_failure_cnt
      last_marking_start
      last_marking_end
      created_at
      updated_at
      current_billing_cycle {
        ...BillingCycleFragment
      }
      account {
        ...CustomerAccountFragment
      }
    }
  `;
}

// Membership Status Fragment
const membershipStatusFragmentDefaultSubfragments = {
  subscriptionFragment: SubscriptionFragment,
  billingCycleFragment: BillingCycleFragment,
  customerAccountFragment: CustomerAccountFragment,
};

export function MembershipStatusFragment(subfragmentOverrides = {}) {
  const subfragments = {
    ...membershipStatusFragmentDefaultSubfragments,
    ...subfragmentOverrides,
  };

  return gql`
    ${subfragments.subscriptionFragment()}

    fragment MembershipStatusFragment on MembershipStatus {
      has_subscription
      subscription {
        ...SubscriptionFragment
      }
      current_billing_cycle {
        ...BillingCycleFragment
      }
      account {
        ...CustomerAccountFragment
      }
      account_balance
      next_billing_date
      is_trial
      days_remaining_in_cycle
    }
  `;
}
