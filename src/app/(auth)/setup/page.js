'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenStore } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { errText, fieldErrors } from '@/lib/helpers';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ErrorBox from '@/components/ui/ErrorBox';

export default function SetupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ companyName: '', adminName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/setup/status')
      .then((s) => { if (s && s.initialized) router.replace('/login'); else setChecking(false); })
      .catch((e) => { setError(e); setChecking(false); });
  }, [router]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.companyName.trim()) { setError(new Error('Company name is required')); return; }
    if (form.password && form.password.length < 8) { setError(new Error('Password must be at least 8 characters')); return; }
    const body = { companyName: form.companyName.trim() };
    if (form.adminName.trim()) body.adminName = form.adminName.trim();
    if (form.email.trim()) body.email = form.email.trim();
    if (form.password) body.password = form.password;
    setBusy(true);
    try {
      const r = await api.post('/setup', body);
      tokenStore.set(r.token);
      await refresh();
      router.replace('/dashboard');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  if (checking) return <Spinner full />;
  const fe = fieldErrors(error);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <Card title="Welcome - first-time setup" className="w-full">
        <p className="mb-4 text-sm text-gray-600">Create your company and the first admin account. If the server already has ADMIN_EMAIL / ADMIN_PASSWORD configured, only the company name is needed.</p>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Company name *" value={form.companyName} onChange={set('companyName')} error={fe.companyName} />
          <Input label="Admin name" value={form.adminName} onChange={set('adminName')} error={fe.adminName} />
          <Input label="Admin email" type="email" value={form.email} onChange={set('email')} error={fe.email} />
          <Input label="Admin password" type="password" value={form.password} onChange={set('password')} error={fe.password} hint="At least 8 characters" />
          {error && <ErrorBox message={errText(error)} />}
          <Button type="submit" loading={busy} className="w-full">Complete setup</Button>
        </form>
      </Card>
    </main>
  );
}
