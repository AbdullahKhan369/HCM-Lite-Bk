'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Async, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDateTime } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ErrorBox from '@/components/ui/ErrorBox';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const canPost = user.role === 'admin' || user.role === 'hr';
  const state = useFetch(() => api.get('/announcements'), []);
  const [f, setF] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!f.title.trim() || !f.body.trim()) { setError(new Error('Title and message are required')); return; }
    setBusy(true);
    try { await api.post('/announcements', { title: f.title.trim(), body: f.body.trim() }); setF({ title: '', body: '' }); state.reload(); }
    catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Announcements</h1>
      {canPost && (
        <Card title="Post an announcement">
          <form onSubmit={submit} className="space-y-3">
            <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Message</span>
              <textarea rows={4} className="w-full rounded border border-gray-300 p-2 text-sm" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            </label>
            {error && <ErrorBox message={errText(error)} />}
            <Button type="submit" loading={busy}>Post</Button>
          </form>
        </Card>
      )}
      <Async state={state} empty="No announcements yet." isEmpty={(d) => asList(d).length === 0}>
        {(d) => (
          <div className="space-y-3">
            {asList(d).map((a) => (
              <Card key={a.id} title={a.title}>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{a.body}</p>
                <p className="mt-2 text-xs text-gray-500">{a.authorName ? a.authorName + ' - ' : ''}{fmtDateTime(a.createdAt)}</p>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
