import React, { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import sendSignupMutation from '../graphql/generated/mutations/signupMutation';
import useAuthProcedures from '../auth/authProcedures';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const FormCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }
`;

const Button = styled.button`
  padding: 12px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  text-align: center;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;
`;

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, set_first_name] = useState('');
  const [last_name, set_last_name] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthProcedures();
  const apollo_client = useApolloClient();

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await sendSignupMutation(apollo_client, {
        email,
        password,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
      });

      if (result.data.signup.success) {
        login(result.data.signup.data.token);
      } else {
        setError(result.data.signup.error?.detail || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormCard>
        <Title>Sign Up</Title>
        <Form onSubmit={handle_submit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Input
            type="text"
            placeholder="First Name"
            value={first_name}
            onChange={(e) => set_first_name(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => set_last_name(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </Form>
        <LinkText>
          Already have an account? <Link to="/login">Login</Link>
        </LinkText>
      </FormCard>
    </Container>
  );
};

export default SignupPage;
