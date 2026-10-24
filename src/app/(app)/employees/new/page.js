'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { RequireRole } from '@/lib/auth';
import { Async, CopyBox, asList, errText, fieldErrors, refId, useFetch } from '@/lib/helpers';
import { todayStr } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import ErrorBox from '@/components/ui/ErrorBox';

const EMPTY = {
  code: '', name: '', email: '', phone: '', address: '', gender: 'male',
  departmentId: '', designationId: '', joinDate: todayStr(), basicSalary: '', status: 'probation',
};

export default function NewEmployeePage() {
  return (
    <RequireRole roles={['hr']}>
      <NewEmployeeInner />
    </RequireRole>
  );
}

function NewEmployeeInner() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const depts = useFetch(() => api.get('/departments'), []);
  const desigs = useFetch(() => api.get('/designations'), []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const required = ['code', 'name', 'email', 'departmentId', 'designationId', 'joinDate'];
    for (const k of required) {
      if (!String(form[k]).trim()) { setError(new Error('Please fill in: ' + k)); return; }
    }
    if (!(Number(form.basicSalary) > 0)) { setError(new Error('Basic salary must be greater than 0')); return; }
    setBusy(true);
    try {
      const r = await api.post('/employees', { ...form, basicSalary: Number(form.basicSalary) });
      setResult(r);
      setForm(EMPTY);
    } catch (err) {
      setError(err);
    }
    setBusy(false);
  };

  const fe = fieldErrors(error);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Register employee</h1>
        <Link href="/employees" className="text-sm text-indigo-600">Back to list</Link>
      </div>

      {result && (
        <Card title="Employee created">
          <p className="mb-3 text-sm">
            <b>{result.employee.name}</b> ({result.employee.email}) was registered. Give them this temporary password:
          </p>
          <CopyBox label="Temporary password" value={result.temporaryPassword} />
          <div className="mt-3 flex gap-2">
            <Link href={'/employees/' + result.employee.id} className="rounded border border-gray-300 px-3 py-2 text-sm">Open profile</Link>
            <Button variant="secondary" onClick={() => setResult(null)}>Register another</Button>
          </div>
        </Card>
      )}

      {!result && (
        <Async state={{ ...depts, data: depts.data && desigs.data ? {} : null, loading: depts.loading || desigs.loading, error: depts.error || desigs.error, reload: () => { depts.reload(); desigs.reload(); } }}>
          {() => {
            const deptList = asList(depts.data);
            const desigList = asList(desigs.data).filter((d) => !form.departmentId || !d.departmentId || refId(d.departmentId) === form.departmentId);
            return (
              <Card>
                <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Employee code *" value={form.code} onChange={set('code')} error={fe.code} />
                  <Input label="Full name *" value={form.name} onChange={set('name')} error={fe.name} />
                  <Input label="Email *" type="email" value={form.email} onChange={set('email')} error={fe.email} />
                  <Input label="Phone" value={form.phone} onChange={set('phone')} error={fe.phone} />
                  <Input label="Address" value={form.address} onChange={set('address')} error={fe.address} className="sm:col-span-2" />
                  <Select label="Gender" value={form.gender} onChange={set('gender')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                  <Select label="Status" value={form.status} onChange={set('status')}>
                    <option value="probation">Probation</option>
                    <option value="active">Active</option>
                  </Select>
                  <Select label="Department *" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value, designationId: '' })} error={fe.departmentId}>
                    <option value="">Select...</option>
                    {deptList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                  <Select label="Designation *" value={form.designationId} onChange={set('designationId')} error={fe.designationId}>
                    <option value="">Select...</option>
                    {desigList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                  <Input label="Join date *" type="date" value={form.joinDate} onChange={set('joinDate')} error={fe.joinDate} />
                  <Input label="Basic salary (PKR) *" type="number" min="1" value={form.basicSalary} onChange={set('basicSalary')} error={fe.basicSalary} />
                  <div className="sm:col-span-2">
                    {error && <ErrorBox message={errText(error)} />}
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" loading={busy}>Register</Button>
                  </div>
                </form>
              </Card>
            );
          }}
        </Async>
      )}
    </div>
  );
}
