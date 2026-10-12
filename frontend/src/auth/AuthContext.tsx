import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { api } from '../api/endpoints';
import type { AuthResponse, Credentials } from '../types/api';

// Token + username persisted in localStorage so a refresh keeps you logged in (frontend-spec.md §5).
const TOKEN_KEY = 'pymentor.token';
const USER_KEY = 'pymentor.username';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (creds: Credentials) => Promise<void>;
  signup: (creds: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    const t = readStored(TOKEN_KEY);
    setAuthToken(t); // attach before the first render's queries fire
    return t;
  });
  const [username, setUsername] = useState<string | null>(() => readStored(USER_KEY));

  const store = useCallback((res: AuthResponse) => {
    setAuthToken(res.access_token);
    setToken(res.access_token);
    setUsername(res.username);
    try {
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, res.username);
    } catch {
      /* session-only if storage is blocked */
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUsername(null);
    queryClient.clear();
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* nothing to clear */
    }
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      username,
      login: async (creds) => store(await api.login(creds)),
      signup: async (creds) => store(await api.signup(creds)),
      logout,
    }),
    [token, username, store, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
