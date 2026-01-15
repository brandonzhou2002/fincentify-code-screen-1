import { ApolloClient, gql } from '@apollo/client';
import { Token, ErrorResponse } from '../serverModel';
import { TokenFragment, ErrorResponseFragment } from '../fragments';

export interface SignupResponse {
  success: boolean;
  data?: Token;
  error?: ErrorResponse;
}
export interface SignupInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}


const signupGqlString = gql`
  ${TokenFragment()}
  ${ErrorResponseFragment()}
  mutation Signup($data: SignupInput!) {
    signup(data: $data) {
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
const sendSignupMutation = (
  apolloClient: ApolloClient<object>,
  inputData: SignupInput,
): Promise<{ data: { signup: SignupResponse} }> => {
  return apolloClient.mutate({
    mutation: signupGqlString,
    variables: { data: { ...inputData } },
  }) as Promise<{ data: { signup: SignupResponse} }>;
};

export default sendSignupMutation
