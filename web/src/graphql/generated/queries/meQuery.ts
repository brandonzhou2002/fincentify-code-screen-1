import { gql, QueryResult, useQuery } from '@apollo/client';
import { User, ErrorResponse } from '../serverModel';
import { UserFragment, ErrorResponseFragment } from '../fragments';

export interface UserResponse {
  success: boolean;
  data?: User;
  error?: ErrorResponse;
}

const useMeQuery = (
  userFragment = UserFragment,
  errorResponseFragment = ErrorResponseFragment,
): QueryResult<{me: UserResponse}> => {
  const meGqlString = gql`
    ${userFragment()}
    ${errorResponseFragment()}
    query Me {
      me {
        success
        data {
          ...UserFragment
        }
        error {
          ...ErrorResponseFragment
        }
      }
    }
  `

  return useQuery<{me: UserResponse}>(meGqlString, {
    fetchPolicy: 'no-cache',
  });
};

export default useMeQuery
