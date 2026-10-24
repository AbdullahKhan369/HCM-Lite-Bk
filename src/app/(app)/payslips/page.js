'use client';
import { useMemo, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { fmtMoney } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Empty, Btn, PageHeader, inputCls, listOf } from '@/features/common-b/ui';

export default function PayslipsPage() {
  const { user } = useAuth();
  const staff = user?.role === 'hr' || user?.role === 'admin';
  const [month, setMonth] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dlId, setDlId] = useState(null);
  const [dlErr, setDlErr] = useState(null);

  const emps = useFetch(async () => (staff ? (await api.getPaged('/api/employees', { limit: 100 })).data : []), [staff]);
  const empList = listOf(emps.data);
  const empName = useMemo(() => Object.fromEntries(empList.map((e) => [e.id, e.name])), [empList]);

  const params = {};
  if (month) params.month = month;
  if (staff && employeeId) params.employeeId = employeeId;
  const { data, loading, error, reload } = useFetch(() => api.get('/api/payslips', params), [month, employeeId, staff]);
  const slips = listOf(data);

  async function download(s) {
    setDlId(s.id);
    setDlErr(null);
    try {
      await api.download(`/api/payslips/${s.id}/pdf`, `payslip-${s.month}.pdf`);
    } catch (e) {
      setDlErr(e);
    } finally {
      setDlId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Payslips" subtitle={staff ? 'Search payslips by month or employee' : 'Your finalized payslips'} />
      <div className={`mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 ${staff ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <label className="text-xs text-slate-600">
          Month
          <input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        {staff && (
          <label className="text-xs text-slate-600">
            Employee
            <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">All employees</option>
              {empList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.code})
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-end">
          <Btn variant="secondary" className="w-full" onClick={() => { setMonth(''); setEmployeeId(''); }}>
            Clear filters
          </Btn>
        </div>
      </div>

      {dlErr && (
        <div className="mb-3">
          <ErrorBox error={dlErr} />
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : slips.length === 0 ? (
        <Empty text="No payslips found." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Month</th>
                {staff && <th className="px-3 py-2">Employee</th>}
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Deduction</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slips.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.month}</td>
                  {staff && <td className="px-3 py-2">{s.employeeName || empName[s.employeeId] || s.employeeId}</td>}
                  <td className="px-3 py-2 text-right">{fmtMoney(Number(s.gross) || 0)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(Number(s.deduction) || 0)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(Number(s.monthlyTax) || 0)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmtMoney(Number(s.net) || 0)}</td>
                  <td className="px-3 py-2 text-right">
                    <Btn variant="secondary" disabled={dlId === s.id} onClick={() => download(s)}>
                      {dlId === s.id ? 'Downloading...' : 'Download PDF'}
                    </Btn>
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
