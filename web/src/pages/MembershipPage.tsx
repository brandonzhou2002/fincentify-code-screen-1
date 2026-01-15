import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import styled from 'styled-components';
import useGet_membership_statusQuery from '../graphql/generated/queries/get_membership_statusQuery';
import sendStart_trialMutation from '../graphql/generated/mutations/start_trialMutation';
import sendRestart_membershipMutation from '../graphql/generated/mutations/restart_membershipMutation';
import { SubscriptionStatus } from '../graphql/generated/serverModel';

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
  max-width: 600px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const ErrorText = styled.p`
  color: #dc3545;
  text-align: center;
  padding: 20px;
`;

const StatusBadge = styled.span<{ status?: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({ status }) => {
    switch (status) {
      case 'TRIAL':
        return '#17a2b8';
      case 'ACTIVE':
        return '#28a745';
      case 'PAYMENT_FAILED':
      case 'OVERDUE':
        return '#dc3545';
      case 'SCHEDULED_CANCELLATION':
        return '#ffc107';
      case 'CANCELLED':
      case 'DEACTIVATED':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  }};
  color: white;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 500;
  font-size: 14px;
`;

const TrialBadge = styled.div`
  background-color: #17a2b8;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 16px;
`;

const PriceText = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const PriceSubtext = styled.div`
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0;
`;

const BenefitItem = styled.li`
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: #333;
  font-size: 14px;

  &::before {
    content: '✓';
    color: #28a745;
    font-weight: bold;
    margin-right: 12px;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #ccc;
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

const CancelLink = styled(Link)`
  display: block;
  text-align: center;
  color: #dc3545;
  text-decoration: none;
  font-size: 14px;
  margin-top: 20px;

  &:hover {
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
`;

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

const MembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { data, loading, error, refetch } = useGet_membership_statusQuery();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [membershipRestarted, setMembershipRestarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    setErrorMessage(null);

    try {
      const result = await sendStart_trialMutation(apolloClient);

      if (result.data.start_trial.success) {
        setTrialStarted(true);
        refetch();
      } else {
        setErrorMessage(result.data.start_trial.error?.detail || 'Failed to start trial');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleRestartMembership = async () => {
    setIsRestarting(true);
    setErrorMessage(null);

    try {
      const result = await sendRestart_membershipMutation(apolloClient);

      if (result.data.restart_membership.success) {
        setMembershipRestarted(true);
        refetch();
      } else {
        setErrorMessage(result.data.restart_membership.error?.detail || 'Failed to restart membership');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsRestarting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Logo>Membership</Logo>
          <BackLink to="/">Back to Home</BackLink>
        </Header>
        <LoadingText>Loading...</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Logo>Membership</Logo>
          <BackLink to="/">Back to Home</BackLink>
        </Header>
        <Main>
          <ErrorText>Error loading membership status</ErrorText>
        </Main>
      </Container>
    );
  }

  const membershipStatus = data?.get_membership_status?.data;
  const hasSubscription = membershipStatus?.has_subscription;
  const subscription = membershipStatus?.subscription;
  const billingCycle = membershipStatus?.current_billing_cycle;

  // Check if subscription allows cancellation
  const canCancel = subscription?.status && [
    SubscriptionStatus.TRIAL,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAYMENT_FAILED,
    SubscriptionStatus.OVERDUE,
  ].includes(subscription.status as any);

  // Check if subscription allows restart
  const canRestart = subscription?.status && [
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.DEACTIVATED,
    SubscriptionStatus.SCHEDULED_CANCELLATION,
  ].includes(subscription.status as any);

  return (
    <Container>
      <Header>
        <Logo>Membership</Logo>
        <BackLink to="/">Back to Home</BackLink>
      </Header>
      <Main>
        {trialStarted && (
          <SuccessMessage>
            Your 14-day free trial has started!
          </SuccessMessage>
        )}

        {membershipRestarted && (
          <SuccessMessage>
            Your membership has been restarted successfully!
          </SuccessMessage>
        )}

        {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

        {!hasSubscription ? (
          // No subscription - Show trial start page
          <Card>
            <TrialBadge>14 DAYS FREE</TrialBadge>
            <Title>Start Your Free Trial</Title>
            <PriceText>$0.00</PriceText>
            <PriceSubtext>$11.99/mo after trial ends</PriceSubtext>

            <Subtitle>
              Get access to all premium features for 14 days, completely free.
              Cancel anytime with no penalty.
            </Subtitle>

            <BenefitsList>
              <BenefitItem>Enhanced credit monitoring</BenefitItem>
              <BenefitItem>Real-time alerts</BenefitItem>
              <BenefitItem>Automatic payment processing</BenefitItem>
              <BenefitItem>Credit planner & simulator</BenefitItem>
              <BenefitItem>Priority support</BenefitItem>
            </BenefitsList>

            <PrimaryButton onClick={handleStartTrial} disabled={isStartingTrial}>
              {isStartingTrial ? 'Starting...' : 'Start my 14 days FREE trial'}
            </PrimaryButton>

            <SecondaryButton to="/">I don't want a free trial</SecondaryButton>
          </Card>
        ) : (
          // Has subscription - Show membership status
          <>
            <Card>
              <Title>Membership Status</Title>

              <InfoRow>
                <InfoLabel>Status</InfoLabel>
                <StatusBadge status={subscription?.status}>
                  {subscription?.status?.replace(/_/g, ' ') || 'Unknown'}
                </StatusBadge>
              </InfoRow>

              <InfoRow>
                <InfoLabel>Plan</InfoLabel>
                <InfoValue>Membership - {formatCurrency(subscription?.amount || 0)}/mo</InfoValue>
              </InfoRow>

              {membershipStatus?.is_trial && (
                <InfoRow>
                  <InfoLabel>Trial Status</InfoLabel>
                  <InfoValue>Active ({membershipStatus.days_remaining_in_cycle} days remaining)</InfoValue>
                </InfoRow>
              )}

              <InfoRow>
                <InfoLabel>Current Period</InfoLabel>
                <InfoValue>
                  {formatDate(billingCycle?.start_date)} - {formatDate(billingCycle?.end_date)}
                </InfoValue>
              </InfoRow>

              <InfoRow>
                <InfoLabel>Next Billing Date</InfoLabel>
                <InfoValue>{formatDate(membershipStatus?.next_billing_date)}</InfoValue>
              </InfoRow>

              <InfoRow>
                <InfoLabel>Account Balance</InfoLabel>
                <InfoValue>{formatCurrency(membershipStatus?.account_balance || 0)}</InfoValue>
              </InfoRow>

              {subscription?.inactive_after && (
                <InfoRow>
                  <InfoLabel>Membership Ends</InfoLabel>
                  <InfoValue>{formatDate(subscription.inactive_after)}</InfoValue>
                </InfoRow>
              )}
            </Card>

            {canCancel && (
              <CancelLink to="/membership/cancel">
                Cancel Membership
              </CancelLink>
            )}

            {canRestart && (
              <Card>
                <Title>Restart Your Membership</Title>
                <Subtitle>
                  Ready to come back? Restart your membership to regain access to all premium features.
                </Subtitle>
                <PrimaryButton onClick={handleRestartMembership} disabled={isRestarting}>
                  {isRestarting ? 'Restarting...' : 'Restart Membership'}
                </PrimaryButton>
              </Card>
            )}
          </>
        )}
      </Main>
    </Container>
  );
};

export default MembershipPage;
