import React, {
  createContext,
  MutableRefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useNavigate, useLocation, Location } from 'react-router-dom';
import { useAuthActions, useAuthState } from './basicAuth';
import { get_user_context_from_auth_token } from './userContext';

// Route constants
export const HOME_PAGE_ROUTE = '/';
export const LOGIN_PAGE_ROUTE = '/login';
export const SIGNUP_PAGE_ROUTE = '/signup';

export type AuthProceduresContextType = {
  saved_url_before_logout?: Location | null;
  set_saved_url_before_logout: (url: Location | null) => void;
  should_notify_auth_token_failure: MutableRefObject<boolean>;
};

const AuthProceduresContext = createContext<AuthProceduresContextType>({
  saved_url_before_logout: null,
  set_saved_url_before_logout: () => {},
  should_notify_auth_token_failure: { current: true },
});

type AuthProviderPropsType = {
  children: ReactNode;
};

export const AuthProceduresProvider = ({ children }: AuthProviderPropsType) => {
  const [saved_url_before_logout, set_saved_url_before_logout] = useState<Location | null>(null);
  // Need to use useRef here otherwise we get fucked stale function error
  const should_notify_auth_token_failure = useRef(true);
  return (
    <AuthProceduresContext.Provider
      value={{
        saved_url_before_logout,
        set_saved_url_before_logout,
        should_notify_auth_token_failure,
      }}
    >
      {children}
    </AuthProceduresContext.Provider>
  );
};

const useLoginLogOutProcedures = (): [(jwt: string) => void, () => void] => {
  const [login_with_jwt, log_out_basic] = useAuthActions();
  const auth_procedures_context = useContext(AuthProceduresContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Assumes jwt is correct
  const login = useCallback(
    (jwt: string) => {
      login_with_jwt(jwt);
      auth_procedures_context.should_notify_auth_token_failure.current = true;
      auth_procedures_context.set_saved_url_before_logout(null);

      // Navigate to home after login
      navigate(HOME_PAGE_ROUTE);
    },
    [login_with_jwt, navigate, auth_procedures_context]
  );

  const log_out = useCallback(() => {
    const user_context = get_user_context_from_auth_token();
    if (user_context) {
      localStorage.setItem('lastEmail', user_context.email);
    }
    log_out_basic();
    auth_procedures_context.set_saved_url_before_logout(location);
    navigate(LOGIN_PAGE_ROUTE);
  }, [log_out_basic, navigate, location, auth_procedures_context]);

  return [login, log_out];
};

/* Encapsulate all logic for handling session expiry auth failures */
const useAuthTokenFailureHandler = () => {
  const [_, _2, notify_login_is_stale] = useAuthActions();
  const [_3, log_out] = useLoginLogOutProcedures();
  const auth_procedures_context = useContext(AuthProceduresContext);

  const handle_auth_token_failure = useCallback(() => {
    if (auth_procedures_context.should_notify_auth_token_failure.current) {
      notify_login_is_stale();
      console.warn('Your session has expired. Please log in again.');
      log_out();
      auth_procedures_context.should_notify_auth_token_failure.current = false;
    }
  }, [notify_login_is_stale, log_out, auth_procedures_context]);

  return handle_auth_token_failure;
};

type AuthProcedures = {
  login: (jwt: string) => void;
  log_out: () => void;
  on_auth_token_failure: () => void;
};

const useAuthProcedures = (): AuthProcedures => {
  const [login, log_out] = useLoginLogOutProcedures();
  const handle_auth_token_failure = useAuthTokenFailureHandler();

  const auth_procedures = useMemo(
    () => ({
      login,
      log_out,
      on_auth_token_failure: handle_auth_token_failure,
    }),
    [login, log_out, handle_auth_token_failure]
  );

  return auth_procedures;
};

export default useAuthProcedures;
