import { ApolloClient, gql } from '@apollo/client';
import { PaymentMethod, ErrorResponse } from '../serverModel';
import { PaymentMethodFragment, ErrorResponseFragment } from '../fragments';

export interface PaymentMethodResponse {
  success: boolean;
  data?: PaymentMethod;
  error?: ErrorResponse;
}
export interface AddCardInput {
  pan: string;
  cvv: string;
  exp_month: string;
  exp_year: string;
  postal_code?: string;
  set_default?: boolean;
  debit_prepaid_only?: boolean;
}


const add_cardGqlString = gql`
  ${PaymentMethodFragment()}
  ${ErrorResponseFragment()}
  mutation Add_card($data: AddCardInput!) {
    add_card(data: $data) {
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
const sendAdd_cardMutation = (
  apolloClient: ApolloClient<object>,
  inputData: AddCardInput,
): Promise<{ data: { add_card: PaymentMethodResponse} }> => {
  return apolloClient.mutate({
    mutation: add_cardGqlString,
    variables: { data: { ...inputData } },
  }) as Promise<{ data: { add_card: PaymentMethodResponse} }>;
};

export default sendAdd_cardMutation
