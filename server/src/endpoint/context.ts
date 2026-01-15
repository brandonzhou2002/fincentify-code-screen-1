import User from 'model/User';

export interface Context {
  auth_token: string;
  idempotency_key: string;
  ip: string;
  user_agent: string;
  // Populated by Authenticate middleware
  user?: User;
  // Populated by AuthenticateNoFetch middleware
  user_id?: string;
}
