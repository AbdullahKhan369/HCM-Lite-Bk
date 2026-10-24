'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { RequireRole } from '@/lib/auth';
import { Async, CopyBox, Pager, asList, errText, fieldErrors, useFetch } from '@/lib/helpers';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ErrorBox from '@/components/ui/ErrorBox';

export default function UsersPage() {
  return (
    <RequireRole roles={['admin']}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const state = useFetch(() => api.getPaged('/users', { role, page, limit: 20 }), [role, page]);
  const [showCreate, setShowCreate] = useState(false);
  const [temp, setTemp] = useState(null); // { name, password }
  const [actionErr, setActionErr] = useState('');

  const toggle = async (u) => {
    setActionErr('');
    try { await api.patch('/users/' + u.id + (u.isActive ? '/deactivate' : '/activate'), {}); state.reload(); }
    catch (e) { setActionErr(errText(e)); }
  };

  const reset = async (u) => {
    if (!window.confirm('Reset password for ' + u.name + '?')) return;
    setActionErr('');
    try {
      const r = await api.post('/users/' + u.id + '/reset-password', {});
      setTemp({ name: u.name, password: r.temporaryPassword });
    } catch (e) { setActionErr(errText(e)); }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => <Badge value={u.role} /> },
    { key: 'isActive', header: 'Active', render: (u) => <Badge value={u.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions', header: '', render: (u) => (
        <div className="flex flex-wrap gap-1">
          <Button variant="secondary" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
          <Button variant="secondary" onClick={() => reset(u)}>Reset password</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Users</h1>
        <Button onClick={() => setShowCreate(true)}>Create HR user</Button>
      </div>
      <Card actions={(
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="employee">Employee</option>
        </Select>
      )}>
        {actionErr && <p className="mb-2 text-sm text-red-600">{actionErr}</p>}
        <Async state={state} empty="No users found." isEmpty={(d) => asList(d.data).length === 0}>
          {(d) => (
            <>
              <Table rows={asList(d.data)} columns={columns} />
              <Pager meta={d.meta} page={page} setPage={setPage} />
            </>
          )}
        </Async>
      </Card>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); state.reload(); }} />}
      {temp && (
        <Modal title="Temporary password" onClose={() => setTemp(null)}>
          <p className="mb-3 text-sm">New temporary password for <b>{temp.name}</b>:</p>
          <CopyBox label="Temporary password" value={temp.password} />
          <Button className="mt-3" variant="secondary" onClick={() => setTemp(null)}>Close</Button>
        </Modal>
      )}
    </div>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!f.name.trim() || !f.email.trim()) { setError(new Error('Name and email are required')); return; }
    if (f.password.length < 8) { setError(new Error('Password must be at least 8 characters')); return; }
    setBusy(true);
    try { await api.post('/users', { name: f.name.trim(), email: f.email.trim(), password: f.password }); onCreated(); }
    catch (err) { setError(err); setBusy(false); }
  };
  const fe = fieldErrors(error);
  return (
    <Modal title="Create HR user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={fe.name} />
        <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={fe.email} />
        <Input label="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={fe.password} hint="At least 8 characters" />
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2"><Button type="submit" loading={busy}>Create</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}
