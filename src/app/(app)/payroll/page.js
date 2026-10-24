'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { fmtMoney } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Empty, Btn, Panel, PageHeader, inputCls, listOf } from '@/features/common-b/ui';
import StatusBadge from '@/features/payroll/StatusBadge';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function PayrollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(() => api.get('/api/payroll/runs'), []);
  const [month, setMonth] = useState(currentMonth());
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);

  const isHr = user?.role === 'hr';
  const runs = listOf(data);

  async function create() {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      setCreateErr(new Error('Pick a month first.'));
      return;
    }
    setCreating(true);
    setCreateErr(null);
    try {
      const res = await api.post('/api/payroll/runs', { month });
      const id = res?.run?.id || res?.id;
      if (id) router.push(`/payroll/${id}`);
      else reload();
    } catch (e) {
      setCreateErr(e.status === 409 ? new Error(`A payroll run for ${month} already exists.`) : e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader title="Payroll" subtitle="Monthly payroll runs" />
      {isHr && (
        <Panel title="Create payroll run" className="mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-600">
              Month
              <input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <Btn onClick={create} disabled={creating}>
              {creating ? 'Creating...' : 'Create run'}
            </Btn>
          </div>
          {createErr && (
            <div className="mt-3">
              <ErrorBox error={createErr} />
            </div>
          )}
        </Panel>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : runs.length === 0 ? (
        <Empty text={isHr ? 'No payroll runs yet. Create the first one above.' : 'No payroll runs yet.'} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Deductions</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.month}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-right">{fmtMoney(r.totals?.gross || 0)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(r.totals?.deductions || 0)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(r.totals?.tax || 0)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmtMoney(r.totals?.net || 0)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/payroll/${r.id}`} className="text-indigo-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
