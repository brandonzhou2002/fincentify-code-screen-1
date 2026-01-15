import { gql, QueryResult, useQuery } from '@apollo/client';
import { MembershipStatus, ErrorResponse } from '../serverModel';
import { MembershipStatusFragment, ErrorResponseFragment } from '../fragments';

export interface MembershipStatusResponse {
  success: boolean;
  data?: MembershipStatus;
  error?: ErrorResponse;
}

const useGet_membership_statusQuery = (
  membershipStatusFragment = MembershipStatusFragment,
  errorResponseFragment = ErrorResponseFragment,
): QueryResult<{ get_membership_status: MembershipStatusResponse }> => {
  const gqlString = gql`
    ${membershipStatusFragment()}
    ${errorResponseFragment()}
    query Get_membership_status {
      get_membership_status {
        success
        data {
          ...MembershipStatusFragment
        }
        error {
          ...ErrorResponseFragment
        }
      }
    }
  `;

  return useQuery<{ get_membership_status: MembershipStatusResponse }>(gqlString, {
    fetchPolicy: 'no-cache',
  });
};

export default useGet_membership_statusQuery;
