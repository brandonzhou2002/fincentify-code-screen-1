import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ApolloClient, InMemoryCache, ApolloLink, HttpLink, ApolloProvider } from '@apollo/client';
import { get_auth_token } from '../auth/authStorage';
import { Response } from './types';
import { ERROR_CODES } from './errorCodes';
import { OperationDefinitionNode } from 'graphql/language/ast';
import CustomRetryLink from './customRetryLink';
import useAuthProcedures from '../auth/authProcedures';
import { useNavigate } from 'react-router-dom';

type CustomApolloProviderPropsType = {
  children: React.ReactNode;
};

const CustomApolloProvider = ({ children }: CustomApolloProviderPropsType) => {
  const auth_procedures = useAuthProcedures();
  const navigate = useNavigate();

  const auth_link = setContext((_, { headers }) => {
    const token = get_auth_token();
    return {
      headers: {
        ...headers,
        ...(token && { 'auth-token': `${token}` }),
      },
    };
  });

  const client_context_link = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        'user-agent': window.navigator.userAgent,
      },
    };
  });

  // This link is for setting an idempotency key on headers
  const idempotency_link = setContext((operation, { headers }) => {
    let add_idempotency_key = false;
    for (const documentNode of operation.query.definitions as Array<OperationDefinitionNode>) {
      if (documentNode.operation === 'mutation') {
        add_idempotency_key = true;
      }
    }
    return {
      headers: {
        ...headers,
        ...(add_idempotency_key && { 'idempotency-key': `${uuidv4()}` }),
      },
    };
  });

  // If our graphql server responds, it will always return a network response with code 200
  // even if the 'actual' code isn't (the server returns another code in the response body)
  // This link if only useful for if requests really fail, as in if it gets blocked by CORS
  // or if someone messes up query syntax
  const network_response_error_link = onError((errors) => {
    if (errors.graphQLErrors) {
      console.error('GraphQL Error occurred');
      errors.graphQLErrors.map(({ message, locations, path }) => {
        console.log(`[GQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
        return null;
      });
    }
    if (errors.networkError) {
      console.error('Network Error:', errors.networkError);
    }
  });

  // This link is for catching actual application level errors from the server
  const response_error_link = new ApolloLink((operation, forward) => {
    return forward(operation).map((response: Response<any, any>) => {
      let inner_data = response.data[Object.keys(response.data)[0]];
      if (inner_data.error) {
        switch (inner_data.error.code) {
          case ERROR_CODES.AuthenticationError:
            auth_procedures.on_auth_token_failure();
            break;
        }
      }
      return response;
    });
  });

  const retry_link = new CustomRetryLink();

  const http_link = new HttpLink({
    uri: 'http://localhost:3200/v1'
  });

  const link = ApolloLink.from([
    auth_link,
    client_context_link,
    idempotency_link,
    response_error_link,
    network_response_error_link,
    retry_link,
    http_link,
  ]);

  const cache = new InMemoryCache();
  const client = new ApolloClient({
    link,
    cache,
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default CustomApolloProvider;
