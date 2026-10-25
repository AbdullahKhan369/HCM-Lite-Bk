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
  const [showPassword, setShowPassword] = useState(false);
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

          {/* Password field with show/hide toggle */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                // Eye-off icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                // Eye icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {error && <ErrorBox message={errText(error)} />}
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}