import jwt from 'jsonwebtoken';
import config from 'util/config';

export interface UserContext {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  type: 'CUSTOMER';
}

export interface JwtPayload {
  user_context: UserContext;
  iat: number;
  exp: number;
}

class JwtToken {
  private static get secret(): string {
    return config.get('jwt:secret') || 'default-secret-change-in-production';
  }

  private static get expires_in(): string {
    return config.get('jwt:expires_in') || '7d';
  }

  static from_user(user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  }): string {
    const user_context: UserContext = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      type: 'CUSTOMER',
    };

    return jwt.sign({ user_context }, this.secret, {
      expiresIn: this.expires_in,
    } as jwt.SignOptions);
  }

  static verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static get_user_context(token: string): UserContext | null {
    const payload = this.verify(token);
    return payload?.user_context || null;
  }
}

export default JwtToken;
