'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Async, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDate, fmtTime, todayStr, toIsoKarachi } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ErrorBox from '@/components/ui/ErrorBox';

export default function CorrectionsPage() {
  const { user } = useAuth();
  const isEmp = user.role === 'employee';
  const isHr = user.role === 'hr';
  const [status, setStatus] = useState('');
  const state = useFetch(() => api.get('/attendance/corrections', { status }), [status]);
  const [deciding, setDeciding] = useState(null); // { item, decision }

  const columns = [
    ...(!isEmp ? [{ key: 'employeeName', header: 'Employee', render: (c) => c.employeeName || (c.employee && c.employee.name) || (c.employeeId && c.employeeId.name) || '-' }] : []),
    { key: 'date', header: 'Date', render: (c) => fmtDate(c.date) },
    { key: 'checkIn', header: 'In', render: (c) => fmtTime(c.checkIn) },
    { key: 'checkOut', header: 'Out', render: (c) => fmtTime(c.checkOut) },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
    { key: 'comment', header: 'Comment' },
    ...(isHr ? [{
      key: 'actions', header: '', render: (c) => (c.status === 'pending' ? (
        <div className="flex gap-1">
          <Button onClick={() => setDeciding({ item: c, decision: 'approved' })}>Approve</Button>
          <Button variant="danger" onClick={() => setDeciding({ item: c, decision: 'rejected' })}>Reject</Button>
        </div>
      ) : null),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Attendance corrections</h1>
      {isEmp && <RequestForm onDone={state.reload} />}
      <Card title={isEmp ? 'My requests' : 'Requests'} actions={(
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      )}>
        <Async state={state} empty="No correction requests." isEmpty={(d) => asList(d).length === 0}>
          {(d) => <Table rows={asList(d)} columns={columns} />}
        </Async>
      </Card>
      {deciding && <DecisionModal {...deciding} onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); state.reload(); window.dispatchEvent(new Event('hcm:notifications')); }} />}
    </div>
  );
}

function RequestForm({ onDone }) {
  const [f, setF] = useState({ date: todayStr(), checkIn: '09:00', checkOut: '18:00', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setOkMsg('');
    if (!f.date) { setError(new Error('Date is required')); return; }
    if (!f.checkIn && !f.checkOut) { setError(new Error('Enter a check-in time, a check-out time, or both')); return; }
    if (f.checkIn && f.checkOut && f.checkIn >= f.checkOut) { setError(new Error('Check-out must be after check-in')); return; }
    if (!f.reason.trim()) { setError(new Error('Reason is required')); return; }
    setBusy(true);
    try {
      await api.post('/attendance/corrections', {
        date: f.date, checkIn: toIsoKarachi(f.date, f.checkIn), checkOut: toIsoKarachi(f.date, f.checkOut), reason: f.reason.trim(),
      });
      setOkMsg('Request submitted.');
      setF({ ...f, reason: '' });
      onDone();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <Card title="Request a correction">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Date" type="date" max={todayStr()} value={f.date} onChange={set('date')} />
        <Input label="Check-in time" type="time" value={f.checkIn} onChange={set('checkIn')} />
        <Input label="Check-out time" type="time" value={f.checkOut} onChange={set('checkOut')} />
        <Input label="Reason" value={f.reason} onChange={set('reason')} className="sm:col-span-3" />
        <div className="sm:col-span-3 space-y-2">
          {error && <ErrorBox message={errText(error)} />}
          {okMsg && <p className="text-sm text-green-700">{okMsg}</p>}
          <Button type="submit" loading={busy}>Submit request</Button>
        </div>
      </form>
    </Card>
  );
}

function DecisionModal({ item, decision, onClose, onDone }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (decision === 'rejected' && !comment.trim()) { setError(new Error('Please add a comment when rejecting')); return; }
    setBusy(true); setError(null);
    try { await api.patch('/attendance/corrections/' + item.id + '/decision', { decision, comment: comment.trim() }); onDone(); }
    catch (err) { setError(err); setBusy(false); }
  };
  return (
    <Modal title={(decision === 'approved' ? 'Approve' : 'Reject') + ' correction'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-gray-600">{fmtDate(item.date)} - {item.reason}</p>
        <Input label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2">
          <Button type="submit" variant={decision === 'approved' ? 'primary' : 'danger'} loading={busy}>Confirm {decision === 'approved' ? 'approval' : 'rejection'}</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
