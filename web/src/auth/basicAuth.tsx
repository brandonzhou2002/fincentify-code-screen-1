import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { clear_auth_tokens, get_auth_token, set_auth_token } from './authStorage';

/***********************************************************\

Takes care of application independent auth state and actions
- DO NOT use actions provided here for application logic
- Instead use actions provided by authProcedures

\***********************************************************/

export type AuthContextType = {
  user_id: string | null;
  is_logged_in: boolean;
  // If user is in logged in state but their token is gone/expired
  // Basically tells us user is logged out without actually changing the login state
  is_login_stale: boolean;
  login_with_jwt: (jwt: string, user_id?: string) => void;
  log_out: () => void;
  notify_login_is_stale: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user_id: null,
  is_logged_in: false,
  login_with_jwt: () => {},
  log_out: () => {},
  is_login_stale: false,
  notify_login_is_stale: () => {},
});

type AuthProviderPropsType = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderPropsType) => {
  const token = get_auth_token();
  const [user_id, setUserId] = useState<string | null>(null);
  const [is_logged_in, setIsLoggedIn] = useState(!!token && token !== '' && token !== 'undefined');
  const [is_login_stale, setIsLoginStale] = useState(false);

  // Assumes jwt is correct
  const login_with_jwt = useCallback(
    (jwt: string, user_id?: string) => {
      setUserId(user_id || null);
      set_auth_token(jwt);
      setIsLoggedIn(true);
      setIsLoginStale(false);
    },
    [setUserId, setIsLoggedIn, setIsLoginStale]
  );

  const log_out = useCallback(() => {
    clear_auth_tokens();
    setUserId(null);
    setIsLoggedIn(false);
    setIsLoginStale(false);
  }, [setUserId, setIsLoggedIn, setIsLoginStale]);

  const notify_login_is_stale = useCallback(() => {
    setIsLoginStale(true);
  }, [setIsLoginStale]);

  return (
    <AuthContext.Provider
      value={{ user_id, is_logged_in, is_login_stale, login_with_jwt, log_out, notify_login_is_stale }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthState = (): [boolean, boolean, string | null] => {
  const auth_context = useContext(AuthContext);
  return [auth_context.is_logged_in, auth_context.is_login_stale, auth_context.user_id];
};

export const useAuthActions = (): [
  (jwt: string, user_id?: string) => void,
  () => void,
  () => void
] => {
  const auth_context = useContext(AuthContext);
  return [auth_context.login_with_jwt, auth_context.log_out, auth_context.notify_login_is_stale];
};
