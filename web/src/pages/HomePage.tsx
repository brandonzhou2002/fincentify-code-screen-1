import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import useMeQuery from '../graphql/generated/queries/meQuery';
import useAuthProcedures from '../auth/authProcedures';

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

const LogoutButton = styled.button`
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const Main = styled.main`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const WelcomeText = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const UserInfo = styled.div`
  color: #666;
  line-height: 1.6;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const ActionButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background-color: #0066cc;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: #0052a3;
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background-color: white;
  color: #0066cc;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #0066cc;

  &:hover {
    background-color: #f0f7ff;
  }
`;

const HomePage: React.FC = () => {
  const { log_out } = useAuthProcedures();
  const { data, loading, error } = useMeQuery();

  if (loading) {
    return (
      <Container>
        <LoadingText>Loading...</LoadingText>
      </Container>
    );
  }

  const user = data?.me?.data;

  return (
    <Container>
      <Header>
        <Logo>Code Screen</Logo>
        <LogoutButton onClick={log_out}>Logout</LogoutButton>
      </Header>
      <Main>
        <Card>
          <WelcomeText>
            Welcome, {user?.first_name || user?.email || 'User'}!
          </WelcomeText>
          {user && (
            <UserInfo>
              <p><strong>Email:</strong> {user.email}</p>
              {user.first_name && <p><strong>First Name:</strong> {user.first_name}</p>}
              {user.last_name && <p><strong>Last Name:</strong> {user.last_name}</p>}
              <p><strong>Status:</strong> {user.status}</p>
            </UserInfo>
          )}
          {error && <p>Error loading user data</p>}
          <ActionButtons>
            <ActionButton to="/membership">Membership</ActionButton>
            <ActionButton to="/add-card">Add Payment Card</ActionButton>
            <SecondaryButton to="/my-cards">View My Cards</SecondaryButton>
          </ActionButtons>
        </Card>
      </Main>
    </Container>
  );
};

export default HomePage;
