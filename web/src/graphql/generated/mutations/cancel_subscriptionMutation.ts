import { ApolloClient, gql } from '@apollo/client';
import { Subscription, ErrorResponse } from '../serverModel';
import { SubscriptionFragment, ErrorResponseFragment } from '../fragments';

export interface SubscriptionResponse {
  success: boolean;
  data?: Subscription;
  error?: ErrorResponse;
}

const cancel_subscriptionGqlString = gql`
  ${SubscriptionFragment()}
  ${ErrorResponseFragment()}
  mutation Cancel_subscription {
    cancel_subscription {
      success
      data {
        ...SubscriptionFragment
      }
      error {
        ...ErrorResponseFragment
      }
    }
  }
`;

const sendCancel_subscriptionMutation = (
  apolloClient: ApolloClient<object>,
): Promise<{ data: { cancel_subscription: SubscriptionResponse } }> => {
  return apolloClient.mutate({
    mutation: cancel_subscriptionGqlString,
  }) as Promise<{ data: { cancel_subscription: SubscriptionResponse } }>;
};

export default sendCancel_subscriptionMutation;
