'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, unwrap } from '@/lib/api';

export type WebUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  permissions?: string[];
};

export const canSell = (user: WebUser | null) => !!user && (
  ['admin', 'gestor', 'funcionario'].includes(user.role ?? '')
  || !!user.permissions?.includes('vendas.criar')
);

type AuthValue = {
  user: WebUser | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: Partial<WebUser>) => void;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(async () => {
    try {
      const response = await apiFetch<unknown>('/me');
      setUser(unwrap<WebUser>(response as never));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUser(); }, [loadUser]);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') router.replace('/login');
    if (user && pathname === '/login') router.replace('/');
  }, [loading, pathname, router, user]);

  const signIn = async (email: string, password: string, remember: boolean) => {
    await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password, remember }) });
    await loadUser();
    router.replace('/');
  };

  const signOut = async () => {
    try { await apiFetch('/logout', { method: 'POST', body: '{}' }); }
    finally {
      setUser(null);
      router.replace('/login');
    }
  };

  const updateUser = (updated: Partial<WebUser>) => setUser((current) => current ? { ...current, ...updated } : current);

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    signIn,
    signOut,
    updateUser,
    can: (permission) => !!user && (user.role === 'admin' || !!user.permissions?.includes(permission)),
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
