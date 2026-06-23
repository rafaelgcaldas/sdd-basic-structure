'use client';

import Cookies from 'js-cookie';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { decodeJwtPayload } from '../util/jwt.util';

const COOKIE_NAME = 'auth_token';
const COOKIE_EXPIRES_DAYS = 7;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const storedToken = Cookies.get(COOKIE_NAME);
    if (storedToken) {
      const payload = decodeJwtPayload(storedToken);
      if (payload) {
        setToken(storedToken);
        setUser({ id: payload.sub, name: payload.name, email: payload.email });
        setStatus('authenticated');
        return;
      }
    }
    setStatus('unauthenticated');
  }, []);

  const login = useCallback((newToken: string) => {
    const payload = decodeJwtPayload(newToken);
    if (!payload) return;
    Cookies.set(COOKIE_NAME, newToken, {
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    setToken(newToken);
    setUser({ id: payload.sub, name: payload.name, email: payload.email });
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(COOKIE_NAME);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
