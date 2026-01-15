import { ApolloClient, gql } from '@apollo/client';
import { Token, ErrorResponse } from '../serverModel';
import { TokenFragment, ErrorResponseFragment } from '../fragments';

export interface LoginResponse {
  success: boolean;
  data?: Token;
  error?: ErrorResponse;
}
export interface LoginInput {
  email: string;
  password: string;
}


const loginGqlString = gql`
  ${TokenFragment()}
  ${ErrorResponseFragment()}
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      success
      data {
        ...TokenFragment
      }
      error {
        ...ErrorResponseFragment
      }
    }
  }
`;
const sendLoginMutation = (
  apolloClient: ApolloClient<object>,
  inputData: LoginInput,
): Promise<{ data: { login: LoginResponse} }> => {
  return apolloClient.mutate({
    mutation: loginGqlString,
    variables: { data: { ...inputData } },
  }) as Promise<{ data: { login: LoginResponse} }>;
};

export default sendLoginMutation
