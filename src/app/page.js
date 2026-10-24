'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (user) { router.replace('/dashboard'); return; }
    api.get('/setup/status')
      .then((s) => router.replace(s && s.initialized ? '/login' : '/setup'))
      .catch(() => router.replace('/login'));
  }, [loading, user, router]);
  return <Spinner full />;
}
