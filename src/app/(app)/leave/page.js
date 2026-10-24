'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Async, Pager, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDate, todayStr } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import ErrorBox from '@/components/ui/ErrorBox';

export default function LeavePage() {
  const { user } = useAuth();
  const isEmp = user.role === 'employee';
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const hist = useFetch(() => api.getPaged('/leaves', { status, page, limit: 15 }), [status, page]);
  const bal = useFetch(() => (isEmp ? api.get('/leaves/balance') : Promise.resolve([])), [isEmp]);
  const [cancelErr, setCancelErr] = useState('');

  const refreshAll = () => { hist.reload(); bal.reload(); window.dispatchEvent(new Event('hcm:notifications')); };

  const cancel = async (l) => {
    if (!window.confirm('Cancel this leave request?')) return;
    setCancelErr('');
    try { await api.patch('/leaves/' + l.id + '/cancel', {}); refreshAll(); } catch (e) { setCancelErr(errText(e)); }
  };

  const canCancel = (l) => isEmp && (l.status === 'pending' || (l.status === 'approved' && l.startDate > todayStr()));

  const columns = [
    ...(!isEmp ? [{ key: 'employeeName', header: 'Employee', render: (l) => l.employeeName || '-' }] : []),
    { key: 'leaveTypeName', header: 'Type', render: (l) => l.leaveTypeName || '-' },
    { key: 'startDate', header: 'From', render: (l) => fmtDate(l.startDate) },
    { key: 'endDate', header: 'To', render: (l) => fmtDate(l.endDate) },
    { key: 'days', header: 'Days' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (l) => <Badge value={l.status} /> },
    { key: 'comment', header: 'HR comment' },
    ...(isEmp ? [{ key: 'actions', header: '', render: (l) => (canCancel(l) ? <Button variant="secondary" onClick={() => cancel(l)}>Cancel</Button> : null) }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Leave</h1>
        {user.role === 'hr' && <Link href="/leave/approvals" className="text-sm text-indigo-600">Go to approvals inbox</Link>}
      </div>

      {isEmp && (
        <>
          <Async state={bal} empty="No leave balances found." isEmpty={(d) => asList(d).length === 0}>
            {(d) => (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {asList(d).map((b) => (
                  <div key={b.leaveTypeId} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="text-xs uppercase text-gray-500">{b.name}</div>
                    <div className="text-2xl font-semibold">{b.remaining === null || b.remaining === undefined ? 'Unlimited' : b.remaining}</div>
                    <div className="text-xs text-gray-500">{b.quota === null || b.quota === undefined ? 'Used ' + b.used : 'Used ' + b.used + ' of ' + b.quota}</div>
                  </div>
                ))}
              </div>
            )}
          </Async>
          <ApplyCard onDone={refreshAll} />
        </>
      )}

      <Card title={isEmp ? 'My leave history' : 'All leave requests'} actions={(
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      )}>
        {cancelErr && <p className="mb-2 text-sm text-red-600">{cancelErr}</p>}
        <Async state={hist} empty="No leave requests yet." isEmpty={(d) => asList(d.data).length === 0}>
          {(d) => (
            <>
              <Table rows={asList(d.data)} columns={columns} />
              <Pager meta={d.meta} page={page} setPage={setPage} />
            </>
          )}
        </Async>
      </Card>
    </div>
  );
}

function ApplyCard({ onDone }) {
  const types = useFetch(() => api.get('/leave-types'), []);
  const [f, setF] = useState({ leaveTypeId: '', startDate: todayStr(), endDate: todayStr(), reason: '' });
  const [smartText, setSmartText] = useState('');
  const [smartBusy, setSmartBusy] = useState(false);
  const [smartMsg, setSmartMsg] = useState(null); // { kind:'ok'|'fail', text }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const smart = async () => {
    if (!smartText.trim()) { setSmartMsg({ kind: 'fail', text: 'Type what you need, e.g. "sick leave tomorrow and the day after".' }); return; }
    setSmartBusy(true); setSmartMsg(null);
    try {
      const r = await api.post('/ai/smart-leave', { text: smartText.trim() });
      setF({
        leaveTypeId: r.leaveTypeId || '',
        startDate: r.startDate || f.startDate,
        endDate: r.endDate || r.startDate || f.endDate,
        reason: r.reason || '',
      });
      setSmartMsg({ kind: 'ok', text: 'AI-generated suggestion. Please review the form below and confirm before submitting.' });
    } catch (e) {
      setSmartMsg({ kind: 'fail', text: 'Could not understand that request. Please fill in the form below.' });
    }
    setSmartBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setOkMsg('');
    if (!f.leaveTypeId) { setError(new Error('Select a leave type')); return; }
    if (!f.startDate || !f.endDate) { setError(new Error('Select start and end dates')); return; }
    if (f.endDate < f.startDate) { setError(new Error('End date cannot be before start date')); return; }
    if (!f.reason.trim()) { setError(new Error('Reason is required')); return; }
    setBusy(true);
    try {
      await api.post('/leaves', { leaveTypeId: f.leaveTypeId, startDate: f.startDate, endDate: f.endDate, reason: f.reason.trim() });
      setOkMsg('Leave request submitted.');
      setF({ leaveTypeId: '', startDate: todayStr(), endDate: todayStr(), reason: '' });
      setSmartText(''); setSmartMsg(null);
      onDone();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <Card title="Apply for leave">
      <div className="mb-4 rounded border border-indigo-200 bg-indigo-50 p-3">
        <label className="block text-sm font-medium text-indigo-900" htmlFor="smart">Smart leave (optional)</label>
        <textarea id="smart" rows={2} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" placeholder='e.g. "I need 2 days sick leave starting tomorrow because of fever"' value={smartText} onChange={(e) => setSmartText(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <Button loading={smartBusy} onClick={smart}>Fill form with AI</Button>
        </div>
        {smartMsg && <p className={`mt-2 text-sm ${smartMsg.kind === 'ok' ? 'text-indigo-800' : 'text-amber-700'}`}>{smartMsg.text}</p>}
      </div>

      <Async state={types}>
        {(d) => (
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Leave type" value={f.leaveTypeId} onChange={set('leaveTypeId')}>
              <option value="">Select...</option>
              {asList(d).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Input label="Start date" type="date" value={f.startDate} onChange={set('startDate')} />
            <Input label="End date" type="date" value={f.endDate} onChange={set('endDate')} />
            <Input label="Reason" value={f.reason} onChange={set('reason')} className="sm:col-span-3" />
            <div className="space-y-2 sm:col-span-3">
              {error && <ErrorBox message={errText(error)} />}
              {okMsg && <p className="text-sm text-green-700">{okMsg}</p>}
              <Button type="submit" loading={busy}>Submit leave request</Button>
            </div>
          </form>
        )}
      </Async>
    </Card>
  );
}
