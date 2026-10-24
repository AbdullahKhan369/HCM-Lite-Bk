'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Async, errText, useFetch } from '@/lib/helpers';
import { fmtDate, fmtMoney } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ErrorBox from '@/components/ui/ErrorBox';

function Row({ k, children }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-100 py-1.5 text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My profile</h1>
      <Card title="Account" actions={<Link href="/change-password" className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Change password</Link>}>
        <Row k="Name">{user.name}</Row>
        <Row k="Email">{user.email}</Row>
        <Row k="Role"><Badge value={user.role} /></Row>
      </Card>
      {user.role === 'employee' && <EmployeeCard />}
    </div>
  );
}

function EmployeeCard() {
  const state = useFetch(() => api.get('/employees/me'), []);
  return (
    <Async state={state}>
      {(e) => <EmployeeDetails e={e} onSaved={state.reload} />}
    </Async>
  );
}

function EmployeeDetails({ e, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ phone: e.phone || '', address: e.address || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async (ev) => {
    ev.preventDefault();
    setBusy(true); setError(null);
    try { await api.patch('/employees/me', { phone: f.phone.trim(), address: f.address.trim() }); setEditing(false); onSaved(); }
    catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <Card title="Employee details" actions={!editing && <Button variant="secondary" onClick={() => setEditing(true)}>Edit contact info</Button>}>
      <Row k="Code">{e.code}</Row>
      <Row k="Join date">{fmtDate(e.joinDate)}</Row>
      <Row k="Status"><Badge value={e.status} /></Row>
      <Row k="Basic salary">{fmtMoney(e.basicSalary)}</Row>
      {!editing && (
        <>
          <Row k="Phone">{e.phone || '-'}</Row>
          <Row k="Address">{e.address || '-'}</Row>
        </>
      )}
      {editing && (
        <form onSubmit={save} className="mt-3 space-y-3">
          <Input label="Phone" value={f.phone} onChange={(ev) => setF({ ...f, phone: ev.target.value })} />
          <Input label="Address" value={f.address} onChange={(ev) => setF({ ...f, address: ev.target.value })} />
          {error && <ErrorBox message={errText(error)} />}
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>Save</Button>
            <Button variant="secondary" onClick={() => { setEditing(false); setError(null); }}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
