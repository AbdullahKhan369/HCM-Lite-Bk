'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenStore } from '@/lib/apiClient';
import ErrorBox from '@/components/ui/ErrorBox';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const u = await api.get('/auth/me');
      setUser(u);
      return u;
    } catch (e) {
      if (e.status === 401 || e.status === 403) setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Hides a page from roles that are not allowed to see it.
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    return <ErrorBox message="You do not have access to this page." />;
  }
  return children;
}
