import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/basicAuth';
import { AuthProceduresProvider } from './auth/authProcedures';
import CustomApolloProvider from './graphql/CustomApolloProvider';
import './index.css';

const MainComponent = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthProceduresProvider>
          <CustomApolloProvider>
            <App />
          </CustomApolloProvider>
        </AuthProceduresProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const main = () => {
  const container = document.getElementById('root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <MainComponent />
      </React.StrictMode>
    );
  }
};

main();
