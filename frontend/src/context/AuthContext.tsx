/**
 * frontend/src/context/AuthContext.tsx
 * ──────────────────────────────────────
 * Handles Django JWT authentication and stores the Supabase session tokens
 * that are returned alongside the JWT from the login endpoint.
 *
 * The SupabaseContext (which wraps this) reads supbaseTokens from localStorage
 * on mount and calls supabase.auth.setSession() to authenticate Realtime.
 */
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types';

interface SupabaseSessionTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface AuthCtx {
  user: User | null;
  login: (tokens: {
    access: string;
    refresh: string;
    user: User;
    supabase_session?: SupabaseSessionTokens;
  }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isMother: boolean;
  /** Supabase session tokens — used by SupabaseContext to call setSession() */
  supabaseTokens: SupabaseSessionTokens | null;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('supabase_tokens');
      return null;
    }
  });

  const [supabaseTokens, setSupabaseTokens] = useState<SupabaseSessionTokens | null>(() => {
    try {
      const t = localStorage.getItem('supabase_tokens');
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(
    ({
      access,
      refresh,
      user: u,
      supabase_session,
    }: {
      access: string;
      refresh: string;
      user: User;
      supabase_session?: SupabaseSessionTokens;
    }) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);

      // Store Supabase session tokens for SupabaseContext to consume
      if (supabase_session) {
        localStorage.setItem('supabase_tokens', JSON.stringify(supabase_session));
        setSupabaseTokens(supabase_session);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    setSupabaseTokens(null);
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? '';
    return {
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: role === 'ADMIN',
      isDoctor: role === 'DOCTOR',
      isNurse: role === 'NURSE',
      isMother: role === 'MOTHER',
      supabaseTokens,
    };
  }, [user, login, logout, supabaseTokens]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
