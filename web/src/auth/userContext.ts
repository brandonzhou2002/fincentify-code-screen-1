import jwtDecode from 'jwt-decode';
import { get_auth_token } from './authStorage';

export const UserType = {
  CUSTOMER: 'CUSTOMER' as const,
};

export type UserTypeType = typeof UserType;

export type UserContext = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  type: keyof UserTypeType;
};

interface JwtPayload {
  user_context: UserContext;
  iat: number;
  exp: number;
}

export const get_user_context_from_auth_token = (): UserContext | null => {
  const token = get_auth_token();
  if (!token) return null;

  try {
    const token_info = jwtDecode<JwtPayload>(token);
    return token_info.user_context;
  } catch (err) {
    return null;
  }
};
