import { ApolloClient, gql } from '@apollo/client';
import { PaymentMethod, ErrorResponse } from '../serverModel';
import { PaymentMethodFragment, ErrorResponseFragment } from '../fragments';

export interface PaymentMethodResponse {
  success: boolean;
  data?: PaymentMethod;
  error?: ErrorResponse;
}
export interface RemoveCardInput {
  payment_method_id: string;
}


const remove_cardGqlString = gql`
  ${PaymentMethodFragment()}
  ${ErrorResponseFragment()}
  mutation Remove_card($data: RemoveCardInput!) {
    remove_card(data: $data) {
      success
      data {
        ...PaymentMethodFragment
      }
      error {
        ...ErrorResponseFragment
      }
    }
  }
`;
const sendRemove_cardMutation = (
  apolloClient: ApolloClient<object>,
  inputData: RemoveCardInput,
): Promise<{ data: { remove_card: PaymentMethodResponse} }> => {
  return apolloClient.mutate({
    mutation: remove_cardGqlString,
    variables: { data: { ...inputData } },
  }) as Promise<{ data: { remove_card: PaymentMethodResponse} }>;
};

export default sendRemove_cardMutation
