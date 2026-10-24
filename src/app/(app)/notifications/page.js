'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { Async, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDateTime } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function NotificationsPage() {
  const state = useFetch(() => api.get('/notifications'), []);
  const [error, setError] = useState('');

  const changed = () => { state.reload(); window.dispatchEvent(new Event('hcm:notifications')); };
  const markRead = async (n) => {
    setError('');
    try { await api.patch('/notifications/' + n.id + '/read', {}); changed(); } catch (e) { setError(errText(e)); }
  };
  const readAll = async () => {
    setError('');
    try { await api.post('/notifications/read-all', {}); changed(); } catch (e) { setError(errText(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <Button variant="secondary" onClick={readAll}>Mark all as read</Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Async state={state} empty="You have no notifications." isEmpty={(d) => asList(d).length === 0}>
        {(d) => (
          <div className="space-y-2">
            {asList(d).map((n) => (
              <Card key={n.id} className={n.read ? 'opacity-70' : 'border-indigo-300'}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{n.title}</span>
                      {n.type && <Badge value={n.type} color="gray" />}
                      {!n.read && <Badge value="new" color="blue" />}
                    </div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-500">{fmtDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <Button variant="secondary" onClick={() => markRead(n)}>Mark read</Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
