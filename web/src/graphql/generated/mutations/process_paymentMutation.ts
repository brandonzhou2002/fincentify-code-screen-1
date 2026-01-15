import { ApolloClient, gql } from '@apollo/client';
import { Payment, ErrorResponse } from '../serverModel';
import { PaymentFragment, ErrorResponseFragment } from '../fragments';

export interface PaymentResponse {
  success: boolean;
  data?: Payment;
  error?: ErrorResponse;
}
export interface ProcessPaymentInput {
  payment_id: string;
}


const process_paymentGqlString = gql`
  ${PaymentFragment()}
  ${ErrorResponseFragment()}
  mutation Process_payment($data: ProcessPaymentInput!) {
    process_payment(data: $data) {
      success
      data {
        ...PaymentFragment
      }
      error {
        ...ErrorResponseFragment
      }
    }
  }
`;
const sendProcess_paymentMutation = (
  apolloClient: ApolloClient<object>,
  inputData: ProcessPaymentInput,
): Promise<{ data: { process_payment: PaymentResponse} }> => {
  return apolloClient.mutate({
    mutation: process_paymentGqlString,
    variables: { data: { ...inputData } },
  }) as Promise<{ data: { process_payment: PaymentResponse} }>;
};

export default sendProcess_paymentMutation
