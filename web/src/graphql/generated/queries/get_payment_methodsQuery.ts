import { gql, QueryResult, useQuery } from '@apollo/client';
import { PaymentMethodList, ErrorResponse } from '../serverModel';
import { PaymentMethodListFragment, ErrorResponseFragment } from '../fragments';

export interface PaymentMethodListResponse {
  success: boolean;
  data?: PaymentMethodList;
  error?: ErrorResponse;
}

const useGet_payment_methodsQuery = (
  paymentMethodListFragment = PaymentMethodListFragment,
  errorResponseFragment = ErrorResponseFragment,
): QueryResult<{get_payment_methods: PaymentMethodListResponse}> => {
  const get_payment_methodsGqlString = gql`
    ${paymentMethodListFragment()}
    ${errorResponseFragment()}
    query Get_payment_methods {
      get_payment_methods {
        success
        data {
          ...PaymentMethodListFragment
        }
        error {
          ...ErrorResponseFragment
        }
      }
    }
  `

  return useQuery<{get_payment_methods: PaymentMethodListResponse}>(get_payment_methodsGqlString, {
    fetchPolicy: 'no-cache',
  });
};

export default useGet_payment_methodsQuery
