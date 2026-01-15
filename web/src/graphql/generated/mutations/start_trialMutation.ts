import { ApolloClient, gql } from '@apollo/client';
import { Subscription, ErrorResponse } from '../serverModel';
import { SubscriptionFragment, ErrorResponseFragment } from '../fragments';

export interface SubscriptionResponse {
  success: boolean;
  data?: Subscription;
  error?: ErrorResponse;
}

const start_trialGqlString = gql`
  ${SubscriptionFragment()}
  ${ErrorResponseFragment()}
  mutation Start_trial {
    start_trial {
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

const sendStart_trialMutation = (
  apolloClient: ApolloClient<object>,
): Promise<{ data: { start_trial: SubscriptionResponse } }> => {
  return apolloClient.mutate({
    mutation: start_trialGqlString,
  }) as Promise<{ data: { start_trial: SubscriptionResponse } }>;
};

export default sendStart_trialMutation;
