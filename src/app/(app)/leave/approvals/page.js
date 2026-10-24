'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { RequireRole } from '@/lib/auth';
import { Async, Pager, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDate } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ErrorBox from '@/components/ui/ErrorBox';

export default function ApprovalsPage() {
  return (
    <RequireRole roles={['hr']}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const state = useFetch(() => api.getPaged('/leaves', { status, page, limit: 20 }), [status, page]);
  const [deciding, setDeciding] = useState(null);

  const columns = [
    { key: 'employeeName', header: 'Employee', render: (l) => l.employeeName || '-' },
    { key: 'leaveTypeName', header: 'Type', render: (l) => l.leaveTypeName || '-' },
    { key: 'startDate', header: 'From', render: (l) => fmtDate(l.startDate) },
    { key: 'endDate', header: 'To', render: (l) => fmtDate(l.endDate) },
    { key: 'days', header: 'Days' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (l) => <Badge value={l.status} /> },
    { key: 'comment', header: 'Comment' },
    {
      key: 'actions', header: '', render: (l) => (l.status === 'pending' ? (
        <div className="flex gap-1">
          <Button onClick={() => setDeciding({ item: l, decision: 'approved' })}>Approve</Button>
          <Button variant="danger" onClick={() => setDeciding({ item: l, decision: 'rejected' })}>Reject</Button>
        </div>
      ) : null),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Leave approvals</h1>
      <Card actions={(
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All</option>
        </Select>
      )}>
        <Async state={state} empty="Nothing to review here." isEmpty={(d) => asList(d.data).length === 0}>
          {(d) => (
            <>
              <Table rows={asList(d.data)} columns={columns} />
              <Pager meta={d.meta} page={page} setPage={setPage} />
            </>
          )}
        </Async>
      </Card>
      {deciding && <DecisionModal {...deciding} onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); state.reload(); }} />}
    </div>
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
    try { await api.patch('/leaves/' + item.id + '/decision', { decision, comment: comment.trim() }); onDone(); }
    catch (err) { setError(err); setBusy(false); }
  };
  return (
    <Modal title={(decision === 'approved' ? 'Approve' : 'Reject') + ' leave'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-gray-600">{item.employeeName} - {item.leaveTypeName}, {fmtDate(item.startDate)} to {fmtDate(item.endDate)} ({item.days} day(s))</p>
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
