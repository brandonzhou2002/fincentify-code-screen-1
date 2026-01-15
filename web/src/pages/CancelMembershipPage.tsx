import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import styled from 'styled-components';
import useGet_membership_statusQuery from '../graphql/generated/queries/get_membership_statusQuery';
import sendCancel_subscriptionMutation from '../graphql/generated/mutations/cancel_subscriptionMutation';

const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: #333;
  font-size: 24px;
`;

const BackLink = styled(Link)`
  color: #0066cc;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const Main = styled.main`
  padding: 40px;
  max-width: 500px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
  text-align: center;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const ErrorText = styled.p`
  color: #dc3545;
  text-align: center;
  padding: 12px;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const WarningBox = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const InfoText = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
  text-align: center;
`;

const DangerButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;

  &:hover {
    background-color: #c82333;
  }

  &:disabled {
    background-color: #e4606d;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 14px 24px;
  background-color: white;
  color: #0066cc;
  text-decoration: none;
  border: 1px solid #0066cc;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  box-sizing: border-box;

  &:hover {
    background-color: #f0f7ff;
  }
`;

const SuccessCard = styled(Card)`
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const SuccessTitle = styled.h2`
  color: #28a745;
  margin-bottom: 16px;
`;

const SuccessText = styled.p`
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const formatDate = (dateString?: string) => {
  if (!dateString) return 'your current billing period';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const CancelMembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { data, loading, error } = useGet_membership_statusQuery();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMessage(null);

    try {
      const result = await sendCancel_subscriptionMutation(apolloClient);

      if (result.data.cancel_subscription.success) {
        setCancelled(true);
      } else {
        setErrorMessage(result.data.cancel_subscription.error?.detail || 'Failed to cancel subscription');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Logo>Cancel Membership</Logo>
          <BackLink to="/membership">Back to Membership</BackLink>
        </Header>
        <LoadingText>Loading...</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Logo>Cancel Membership</Logo>
          <BackLink to="/membership">Back to Membership</BackLink>
        </Header>
        <Main>
          <ErrorText>Error loading membership status</ErrorText>
        </Main>
      </Container>
    );
  }

  const membershipStatus = data?.get_membership_status?.data;
  const subscription = membershipStatus?.subscription;
  const billingCycle = membershipStatus?.current_billing_cycle;

  // If user doesn't have a subscription, redirect to membership page
  if (!membershipStatus?.has_subscription) {
    return (
      <Container>
        <Header>
          <Logo>Cancel Membership</Logo>
          <BackLink to="/membership">Back to Membership</BackLink>
        </Header>
        <Main>
          <Card>
            <Title>No Active Membership</Title>
            <Subtitle>You don't have an active membership to cancel.</Subtitle>
            <SecondaryButton to="/membership">Go to Membership</SecondaryButton>
          </Card>
        </Main>
      </Container>
    );
  }

  if (cancelled) {
    return (
      <Container>
        <Header>
          <Logo>Membership Cancelled</Logo>
          <BackLink to="/">Back to Home</BackLink>
        </Header>
        <Main>
          <SuccessCard>
            <SuccessIcon>✓</SuccessIcon>
            <SuccessTitle>Membership Cancelled</SuccessTitle>
            <SuccessText>
              We're sad to see you go. Your membership will remain active until{' '}
              {formatDate(billingCycle?.end_date)}. You can restart your membership anytime.
            </SuccessText>
            <SecondaryButton to="/membership">Go to Membership</SecondaryButton>
          </SuccessCard>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>Cancel Membership</Logo>
        <BackLink to="/membership">Back to Membership</BackLink>
      </Header>
      <Main>
        <Card>
          <Title>Are you sure you want to cancel?</Title>

          {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

          <WarningBox>
            <WarningTitle>You will lose access to:</WarningTitle>
            <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
              <li>Enhanced credit monitoring</li>
              <li>Real-time alerts</li>
              <li>Automatic payment processing</li>
              <li>Credit planner & simulator</li>
              <li>Priority support</li>
            </ul>
          </WarningBox>

          <InfoText>
            Your membership will remain active until{' '}
            <strong>{formatDate(billingCycle?.end_date)}</strong>. After that, your account will be
            downgraded.
          </InfoText>

          <DangerButton onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Cancel Membership'}
          </DangerButton>

          <SecondaryButton to="/membership">Keep My Membership</SecondaryButton>
        </Card>
      </Main>
    </Container>
  );
};

export default CancelMembershipPage;
