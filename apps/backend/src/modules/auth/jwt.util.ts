import * as jwt from 'jsonwebtoken';

export interface TokenUser {
  id: string;
  name: string;
  email: string;
}

export function signUserToken(user: TokenUser, secret: string): string {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn: '14d' },
  );
}
