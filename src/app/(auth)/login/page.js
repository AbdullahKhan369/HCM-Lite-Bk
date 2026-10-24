'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { errText } from '@/lib/helpers';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ErrorBox from '@/components/ui/ErrorBox';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/setup/status')
      .then((s) => { if (s && !s.initialized) router.replace('/setup'); else setChecking(false); })
      .catch(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (!loading && user) router.replace(user.mustChangePassword ? '/change-password' : '/dashboard');
  }, [loading, user, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) { setError(new Error('Email and password are required')); return; }
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      router.replace(u.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  if (checking || loading) return <Spinner full />;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <Card title="HCM Lite - Sign in" className="w-full">
        <form onSubmit={submit} className="space-y-3">
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <ErrorBox message={errText(error)} />}
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}
