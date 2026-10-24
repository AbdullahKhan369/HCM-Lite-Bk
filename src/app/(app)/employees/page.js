'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth, RequireRole } from '@/lib/auth';
import { Async, Pager, asList, errText, refName, useFetch } from '@/lib/helpers';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';

export default function EmployeesPage() {
  return (
    <RequireRole roles={['admin', 'hr']}>
      <EmployeesInner />
    </RequireRole>
  );
}

function EmployeesInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState({ search: '', departmentId: '', designationId: '', status: '' });
  const [filters, setFilters] = useState(q);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const depts = useFetch(() => api.get('/departments'), []);
  const desigs = useFetch(() => api.get('/designations'), []);
  const list = useFetch(() => api.getPaged('/employees', { ...filters, page, limit: 20 }), [JSON.stringify(filters), page]);

  const deptList = asList(depts.data);
  const desigList = asList(desigs.data);

  const apply = (e) => { e.preventDefault(); setPage(1); setFilters(q); };
  const reset = () => { const z = { search: '', departmentId: '', designationId: '', status: '' }; setQ(z); setFilters(z); setPage(1); };

  const exportCsv = async () => {
    setExporting(true); setExportError('');
    try { await api.download('/employees/export.csv', 'employees.csv'); } catch (e) { setExportError(errText(e)); }
    setExporting(false);
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department', render: (e) => e.department || refName(e.departmentId, deptList) },
    { key: 'designation', header: 'Designation', render: (e) => e.designation || refName(e.designationId, desigList) },
    { key: 'status', header: 'Status', render: (e) => <Badge value={e.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Employees</h1>
        {user.role === 'hr' && (
          <div className="flex gap-2">
            <Button variant="secondary" loading={exporting} onClick={exportCsv}>Export CSV</Button>
            <Link href="/employees/new" className="inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Register employee</Link>
          </div>
        )}
      </div>
      {exportError && <p className="text-sm text-red-600">{exportError}</p>}

      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Search" placeholder="Name, email, code" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} />
          <Select label="Department" value={q.departmentId} onChange={(e) => setQ({ ...q, departmentId: e.target.value })}>
            <option value="">All</option>
            {deptList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select label="Designation" value={q.designationId} onChange={(e) => setQ({ ...q, designationId: e.target.value })}>
            <option value="">All</option>
            {desigList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select label="Status" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
            <option value="">All</option>
            <option value="probation">Probation</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <Button variant="secondary" onClick={reset}>Reset</Button>
          </div>
        </form>
      </Card>

      <Async state={list} empty="No employees match your filters." isEmpty={(d) => asList(d.data).length === 0}>
        {(d) => (
          <>
            <Table columns={columns} rows={asList(d.data)} onRowClick={(e) => router.push('/employees/' + e.id)} />
            <Pager meta={d.meta} page={page} setPage={setPage} />
          </>
        )}
      </Async>
    </div>
  );
}
