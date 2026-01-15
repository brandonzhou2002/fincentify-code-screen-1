import { ApolloClient, gql } from '@apollo/client';
import { Subscription, ErrorResponse } from '../serverModel';
import { SubscriptionFragment, ErrorResponseFragment } from '../fragments';

export interface SubscriptionResponse {
  success: boolean;
  data?: Subscription;
  error?: ErrorResponse;
}

const restart_membershipGqlString = gql`
  ${SubscriptionFragment()}
  ${ErrorResponseFragment()}
  mutation Restart_membership {
    restart_membership {
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

const sendRestart_membershipMutation = (
  apolloClient: ApolloClient<object>,
): Promise<{ data: { restart_membership: SubscriptionResponse } }> => {
  return apolloClient.mutate({
    mutation: restart_membershipGqlString,
  }) as Promise<{ data: { restart_membership: SubscriptionResponse } }>;
};

export default sendRestart_membershipMutation;
