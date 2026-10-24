'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth, RequireRole } from '@/lib/auth';
import { Async, asList, errText, refId, refName, useFetch } from '@/lib/helpers';
import { fmtDate, fmtMoney } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import ErrorBox from '@/components/ui/ErrorBox';

export default function EmployeeDetailPage() {
  return (
    <RequireRole roles={['admin', 'hr']}>
      <Inner />
    </RequireRole>
  );
}

function Row({ k, children }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-100 py-1.5 text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Inner() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = user.role === 'hr';
  const state = useFetch(() => api.get('/employees/' + id), [id]);
  const depts = useFetch(() => api.get('/departments'), []);
  const desigs = useFetch(() => api.get('/designations'), []);
  const [modal, setModal] = useState(null); // 'edit' | 'salary' | 'status'
  const deptList = asList(depts.data);
  const desigList = asList(desigs.data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employee profile</h1>
        <Link href="/employees" className="text-sm text-indigo-600">Back to list</Link>
      </div>
      <Async state={state}>
        {(d) => {
          const e = d.employee;
          const s = d.attendanceSummary || {};
          return (
            <>
              <Card title={`${e.name} (${e.code})`} actions={canEdit && (
                <>
                  <Button variant="secondary" onClick={() => setModal('edit')}>Edit</Button>
                  <Button variant="secondary" onClick={() => setModal('salary')}>Change salary</Button>
                  <Button variant="secondary" onClick={() => setModal('status')}>Change status</Button>
                </>
              )}>
                <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                  <div>
                    <Row k="Email">{e.email}</Row>
                    <Row k="Phone">{e.phone || '-'}</Row>
                    <Row k="Address">{e.address || '-'}</Row>
                    <Row k="Gender">{e.gender || '-'}</Row>
                  </div>
                  <div>
                    <Row k="Department">{e.department || refName(e.departmentId, deptList)}</Row>
                    <Row k="Designation">{e.designation || refName(e.designationId, desigList)}</Row>
                    <Row k="Join date">{fmtDate(e.joinDate)}</Row>
                    <Row k="Exit date">{e.exitDate ? fmtDate(e.exitDate) : '-'}</Row>
                    <Row k="Status"><Badge value={e.status} /></Row>
                    <Row k="Basic salary">{fmtMoney(e.basicSalary)}</Row>
                  </div>
                </div>
              </Card>

              <Card title="Attendance summary">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[['Present', s.present], ['Late', s.late], ['Absent', s.absent], ['Half day', s.halfDay]].map(([l, v]) => (
                    <div key={l} className="rounded border border-gray-200 p-3 text-center">
                      <div className="text-2xl font-semibold">{v === undefined || v === null ? '-' : v}</div>
                      <div className="text-xs text-gray-500">{l}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Leave balances">
                <Table
                  rows={d.leaveBalances || []}
                  rowKey="leaveTypeId"
                  empty="No leave balances."
                  columns={[
                    { key: 'name', header: 'Type' },
                    { key: 'quota', header: 'Quota', render: (b) => (b.quota === null || b.quota === undefined ? 'Unlimited' : b.quota) },
                    { key: 'used', header: 'Used' },
                    { key: 'remaining', header: 'Remaining', render: (b) => (b.remaining === null || b.remaining === undefined ? '-' : b.remaining) },
                  ]}
                />
              </Card>

              <Card title="Last payslip">
                {d.lastPayslip ? (
                  <div className="text-sm">
                    <Row k="Month">{d.lastPayslip.month}</Row>
                    <Row k="Gross">{fmtMoney(d.lastPayslip.gross)}</Row>
                    <Row k="Net">{fmtMoney(d.lastPayslip.net)}</Row>
                  </div>
                ) : <p className="text-sm text-gray-500">No payslip yet.</p>}
              </Card>

              {modal === 'edit' && <EditModal e={e} depts={deptList} desigs={desigList} onClose={() => setModal(null)} onSaved={() => { setModal(null); state.reload(); }} />}
              {modal === 'salary' && <SalaryModal e={e} onClose={() => setModal(null)} onSaved={() => { setModal(null); state.reload(); }} />}
              {modal === 'status' && <StatusModal e={e} onClose={() => setModal(null)} onSaved={() => { setModal(null); state.reload(); }} />}
            </>
          );
        }}
      </Async>
    </div>
  );
}

function useSave(fn, onSaved) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (ev) => {
    ev.preventDefault();
    setBusy(true); setError(null);
    try { await fn(); onSaved(); } catch (err) { setError(err); setBusy(false); }
  };
  return { busy, error, run };
}

function EditModal({ e, depts, desigs, onClose, onSaved }) {
  const [f, setF] = useState({
    name: e.name || '', email: e.email || '', phone: e.phone || '', address: e.address || '',
    gender: e.gender || 'male', departmentId: refId(e.departmentId), designationId: refId(e.designationId),
    joinDate: String(e.joinDate || '').slice(0, 10),
  });
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const { busy, error, run } = useSave(() => {
    if (!f.name.trim() || !f.email.trim()) throw new Error('Name and email are required');
    return api.put('/employees/' + e.id, f);
  }, onSaved);
  const dl = desigs.filter((d) => !f.departmentId || !d.departmentId || refId(d.departmentId) === f.departmentId);
  return (
    <Modal title="Edit employee" onClose={onClose}>
      <form onSubmit={run} className="space-y-3">
        <Input label="Name" value={f.name} onChange={set('name')} />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} />
        <Input label="Phone" value={f.phone} onChange={set('phone')} />
        <Input label="Address" value={f.address} onChange={set('address')} />
        <Select label="Gender" value={f.gender} onChange={set('gender')}>
          <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
        </Select>
        <Select label="Department" value={f.departmentId} onChange={(ev) => setF({ ...f, departmentId: ev.target.value, designationId: '' })}>
          <option value="">Select...</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select label="Designation" value={f.designationId} onChange={set('designationId')}>
          <option value="">Select...</option>
          {dl.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Input label="Join date" type="date" value={f.joinDate} onChange={set('joinDate')} />
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2"><Button type="submit" loading={busy}>Save</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}

function SalaryModal({ e, onClose, onSaved }) {
  const [v, setV] = useState(String(e.basicSalary || ''));
  const { busy, error, run } = useSave(() => {
    if (!(Number(v) > 0)) throw new Error('Salary must be greater than 0');
    return api.put('/employees/' + e.id + '/salary', { basicSalary: Number(v) });
  }, onSaved);
  return (
    <Modal title="Change basic salary" onClose={onClose}>
      <form onSubmit={run} className="space-y-3">
        <Input label="Basic salary (PKR)" type="number" min="1" value={v} onChange={(ev) => setV(ev.target.value)} />
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2"><Button type="submit" loading={busy}>Save</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}

function StatusModal({ e, onClose, onSaved }) {
  const [status, setStatus] = useState(e.status || 'active');
  const [exitDate, setExitDate] = useState(String(e.exitDate || '').slice(0, 10));
  const { busy, error, run } = useSave(() => {
    const body = { status };
    if (status === 'inactive' && exitDate) body.exitDate = exitDate;
    return api.patch('/employees/' + e.id + '/status', body);
  }, onSaved);
  return (
    <Modal title="Change status" onClose={onClose}>
      <form onSubmit={run} className="space-y-3">
        <Select label="Status" value={status} onChange={(ev) => setStatus(ev.target.value)}>
          <option value="probation">Probation</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </Select>
        {status === 'inactive' && <Input label="Exit date" type="date" value={exitDate} onChange={(ev) => setExitDate(ev.target.value)} />}
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2"><Button type="submit" loading={busy}>Save</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}
