import React from 'react';
import { Link } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import styled from 'styled-components';
import useGet_payment_methodsQuery from '../graphql/generated/queries/get_payment_methodsQuery';
import sendRemove_cardMutation from '../graphql/generated/mutations/remove_cardMutation';
import useAuthProcedures from '../auth/authProcedures';
import { PaymentMethod, CardNetwork } from '../graphql/generated/serverModel';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.header`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: #333;
  font-size: 22px;
  font-weight: 700;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const HeaderLink = styled(Link)`
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(102, 126, 234, 0.1);
  }
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }
`;

const Main = styled.main`
  padding: 40px 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const PageTitle = styled.h2`
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PageSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  margin-bottom: 32px;
`;

const CardsGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
`;

const CardItem = styled.div<{ $is_default?: boolean }>`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  ${({ $is_default }) =>
    $is_default &&
    `
    border: 2px solid #667eea;
  `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const CardNetworkLogo = styled.div<{ $network?: string }>`
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;

  ${({ $network }) => {
    switch ($network) {
      case 'VISA':
        return `
          background: linear-gradient(135deg, #1a1f71 0%, #2563eb 100%);
          color: white;
        `;
      case 'MASTERCARD':
        return `
          background: linear-gradient(135deg, #eb001b 0%, #f79e1b 100%);
          color: white;
        `;
      case 'AMERICAN_EXPRESS':
        return `
          background: linear-gradient(135deg, #006fcf 0%, #00a1e4 100%);
          color: white;
        `;
      case 'DISCOVER':
        return `
          background: linear-gradient(135deg, #ff6000 0%, #ffb200 100%);
          color: white;
        `;
      case 'UNIONPAY':
        return `
          background: linear-gradient(135deg, #da291c 0%, #004c99 100%);
          color: white;
        `;
      case 'JCB':
        return `
          background: linear-gradient(135deg, #0f4c81 0%, #c41230 100%);
          color: white;
        `;
      default:
        return `
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
          color: white;
        `;
    }
  }}
`;

const CardBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const DefaultBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $status }) => {
    switch ($status) {
      case 'VALID':
        return `
          background-color: #d1fae5;
          color: #065f46;
        `;
      case 'PROCESSING':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case 'EXPIRED':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      case 'BLOCKED':
      case 'INVALID':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const CardNumber = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-bottom: 16px;
`;

const CardDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const CardActions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

const RemoveButton = styled.button`
  border: 1px solid #dc3545;
  background-color: white;
  color: #dc3545;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #fff5f5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardLabel = styled.span`
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
`;

const CardValue = styled.span`
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

const CardIssuer = styled.div`
  text-align: right;
`;

const IssuerName = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const FundingType = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
`;

const EmptyTitle = styled.h3`
  color: #374151;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const EmptyDescription = styled.p`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 24px;
`;

const AddCardButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: #dc3545;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
`;

const ActionErrorMessage = styled.div`
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 16px;
  font-size: 13px;
`;

const FloatingAddButton = styled(Link)`
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
  }
`;

// Helper functions
const format_card_network_display = (network?: string): string => {
  switch (network) {
    case 'VISA':
      return 'VISA';
    case 'MASTERCARD':
      return 'MC';
    case 'AMERICAN_EXPRESS':
      return 'AMEX';
    case 'DISCOVER':
      return 'DISC';
    case 'UNIONPAY':
      return 'UP';
    case 'JCB':
      return 'JCB';
    default:
      return 'CARD';
  }
};

const format_expiry = (month?: string, year?: string): string => {
  if (!month || !year) return 'N/A';
  const formatted_month = month.padStart(2, '0');
  const formatted_year = year.slice(-2);
  return `${formatted_month}/${formatted_year}`;
};

const format_last4 = (last4?: string): string => {
  if (!last4) return '****';
  return `**** **** **** ${last4}`;
};

const format_funding_type = (funding_type?: string): string => {
  if (!funding_type) return '';
  return funding_type.charAt(0) + funding_type.slice(1).toLowerCase();
};

const format_issuer_name = (issuer?: string, card_brand?: string): string => {
  if (card_brand) return card_brand;
  if (issuer) return issuer;
  return 'Unknown Issuer';
};

// Component
const MyCardsPage: React.FC = () => {
  const apolloClient = useApolloClient();
  const { log_out } = useAuthProcedures();
  const { data, loading, error, refetch } = useGet_payment_methodsQuery();
  const [remove_error, setRemoveError] = React.useState<string | null>(null);
  const [removing_card_id, setRemovingCardId] = React.useState<string | null>(null);

  const payment_methods = data?.get_payment_methods?.data?.items || [];
  const active_cards = payment_methods.filter(
    (pm: PaymentMethod) => !pm.deleted && pm.type === 'CARD'
  );

  const handle_remove_card = async (card: PaymentMethod) => {
    setRemoveError(null);

    if (!window.confirm(`Remove card ending in ${card.last4 || '****'}?`)) {
      return;
    }

    setRemovingCardId(card.id);
    try {
      const result = await sendRemove_cardMutation(apolloClient, {
        payment_method_id: card.id,
      });

      if (!result.data.remove_card.success) {
        setRemoveError(result.data.remove_card.error?.detail || 'Failed to remove card');
        return;
      }

      await refetch();
    } catch (e) {
      setRemoveError('Failed to remove card');
    } finally {
      setRemovingCardId(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Logo>Code Screen</Logo>
          <HeaderActions>
            <HeaderLink to="/">Home</HeaderLink>
            <LogoutButton onClick={log_out}>Logout</LogoutButton>
          </HeaderActions>
        </Header>
        <Main>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </Main>
      </Container>
    );
  }

  if (error || data?.get_payment_methods?.error) {
    const error_message =
      data?.get_payment_methods?.error?.detail || 'Failed to load payment methods';
    return (
      <Container>
        <Header>
          <Logo>Code Screen</Logo>
          <HeaderActions>
            <HeaderLink to="/">Home</HeaderLink>
            <LogoutButton onClick={log_out}>Logout</LogoutButton>
          </HeaderActions>
        </Header>
        <Main>
          <ErrorMessage>{error_message}</ErrorMessage>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>Code Screen</Logo>
        <HeaderActions>
          <HeaderLink to="/">Home</HeaderLink>
          <LogoutButton onClick={log_out}>Logout</LogoutButton>
        </HeaderActions>
      </Header>
      <Main>
        <PageTitle>My Cards</PageTitle>
        <PageSubtitle>
          Manage your saved payment methods
        </PageSubtitle>
        {remove_error && <ActionErrorMessage>{remove_error}</ActionErrorMessage>}

        {active_cards.length === 0 ? (
          <EmptyState>
            <EmptyIcon>💳</EmptyIcon>
            <EmptyTitle>No cards on file</EmptyTitle>
            <EmptyDescription>
              Add a payment card to get started with quick and secure payments.
            </EmptyDescription>
            <AddCardButton to="/add-card">+ Add Your First Card</AddCardButton>
          </EmptyState>
        ) : (
          <>
            <CardsGrid>
              {active_cards.map((card: PaymentMethod) => (
                <CardItem key={card.id} $is_default={card.default}>
                  <CardHeader>
                    <CardNetworkLogo $network={card.card_network}>
                      {format_card_network_display(card.card_network)}
                    </CardNetworkLogo>
                    <CardBadges>
                      {card.default && <DefaultBadge>Default</DefaultBadge>}
                      <StatusBadge $status={card.status}>{card.status}</StatusBadge>
                    </CardBadges>
                  </CardHeader>

                  <CardNumber>{format_last4(card.last4)}</CardNumber>

                  <CardDetails>
                    <CardInfo>
                      <CardLabel>Expires</CardLabel>
                      <CardValue>{format_expiry(card.exp_month, card.exp_year)}</CardValue>
                    </CardInfo>
                    <CardIssuer>
                      <IssuerName>
                        {format_issuer_name(card.issuer, card.card_brand)}
                      </IssuerName>
                      {card.funding_type && (
                        <FundingType>{format_funding_type(card.funding_type)} Card</FundingType>
                      )}
                    </CardIssuer>
                  </CardDetails>
                  <CardActions>
                    <RemoveButton
                      onClick={() => handle_remove_card(card)}
                      disabled={removing_card_id === card.id}
                    >
                      {removing_card_id === card.id ? 'Removing...' : 'Remove'}
                    </RemoveButton>
                  </CardActions>
                </CardItem>
              ))}
            </CardsGrid>
            <FloatingAddButton to="/add-card">+</FloatingAddButton>
          </>
        )}
      </Main>
    </Container>
  );
};

export default MyCardsPage;
