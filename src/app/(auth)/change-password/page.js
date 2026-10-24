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

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.currentPassword) { setError(new Error('Enter your current password')); return; }
    if (form.newPassword.length < 8) { setError(new Error('New password must be at least 8 characters')); return; }
    if (form.newPassword !== form.confirm) { setError(new Error('New passwords do not match')); return; }
    if (form.newPassword === form.currentPassword) { setError(new Error('New password must be different')); return; }
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      await refresh();
      router.replace('/dashboard');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  if (loading || !user) return <Spinner full />;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <Card title="Change password" className="w-full">
        {user.mustChangePassword && <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">You must set a new password before continuing.</p>}
        <form onSubmit={submit} className="space-y-3">
          <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
          <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} hint="At least 8 characters" />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          {error && <ErrorBox message={errText(error)} />}
          <Button type="submit" loading={busy} className="w-full">Update password</Button>
          <Button variant="ghost" onClick={logout} className="w-full">Log out</Button>
        </form>
      </Card>
    </main>
  );
}
