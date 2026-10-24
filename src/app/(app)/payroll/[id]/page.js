'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { fmtMoney, fmtDate } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Empty, Btn, Modal, PageHeader } from '@/features/common-b/ui';
import StatusBadge from '@/features/payroll/StatusBadge';

const money = (v) => fmtMoney(Number(v) || 0);

export default function PayrollDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => api.get(`/api/payroll/runs/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const run = data?.run;
  if (!run) return <Empty text="Payroll run not found." />;
  const items = Array.isArray(data.items) ? data.items : [];
  const draft = run.status === 'draft';
  const locked = run.status === 'finalized';

  async function act(path) {
    setBusy(true);
    setActionErr(null);
    try {
      await api.post(path);
      setConfirmOpen(false);
      reload();
    } catch (e) {
      setActionErr(e.status === 403 ? new Error('This payroll run is locked and cannot be changed.') : e);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const sum = (k) => items.reduce((a, i) => a + (Number(i[k]) || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Payroll ${run.month}`}
        subtitle={<StatusBadge status={run.status} />}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/payroll" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Back to runs
            </Link>
            {user?.role === 'hr' && draft && (
              <Btn variant="secondary" disabled={busy} onClick={() => act(`/api/payroll/runs/${id}/recalculate`)}>
                {busy ? 'Working...' : 'Recalculate'}
              </Btn>
            )}
            {user?.role === 'admin' && draft && (
              <Btn disabled={busy} onClick={() => setConfirmOpen(true)}>
                Finalize
              </Btn>
            )}
          </div>
        }
      />

      {locked && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
          This run is finalized and locked. It can no longer be recalculated or edited.
          {run.finalizedAt ? ` Finalized on ${fmtDate(run.finalizedAt)}.` : ''}
        </div>
      )}
      {actionErr && (
        <div className="mb-4">
          <ErrorBox error={actionErr} />
        </div>
      )}

      {items.length === 0 ? (
        <Empty text="This run has no payslip items." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2 text-right">Basic</th>
                <th className="px-3 py-2 text-right">HRA</th>
                <th className="px-3 py-2 text-right">Medical</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Work days</th>
                <th className="px-3 py-2 text-right">Absent</th>
                <th className="px-3 py-2 text-right">Unpaid</th>
                <th className="px-3 py-2 text-right">Half</th>
                <th className="px-3 py-2 text-right">Deduction</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id || i.employeeId}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{i.employeeName}</div>
                    <div className="text-xs text-slate-400">{i.code}</div>
                  </td>
                  <td className="px-3 py-2 text-right">{money(i.basic)}</td>
                  <td className="px-3 py-2 text-right">{money(i.hra)}</td>
                  <td className="px-3 py-2 text-right">{money(i.medical)}</td>
                  <td className="px-3 py-2 text-right">{money(i.gross)}</td>
                  <td className="px-3 py-2 text-right">{i.workingDays}</td>
                  <td className="px-3 py-2 text-right">{i.absentDays}</td>
                  <td className="px-3 py-2 text-right">{i.unpaidDays}</td>
                  <td className="px-3 py-2 text-right">{i.halfDays}</td>
                  <td className="px-3 py-2 text-right">{money(i.deduction)}</td>
                  <td className="px-3 py-2 text-right">{money(i.monthlyTax)}</td>
                  <td className="px-3 py-2 text-right font-medium">{money(i.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-medium">
              <tr>
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{money(sum('basic'))}</td>
                <td className="px-3 py-2 text-right">{money(sum('hra'))}</td>
                <td className="px-3 py-2 text-right">{money(sum('medical'))}</td>
                <td className="px-3 py-2 text-right">{money(sum('gross'))}</td>
                <td colSpan={4} />
                <td className="px-3 py-2 text-right">{money(sum('deduction'))}</td>
                <td className="px-3 py-2 text-right">{money(sum('monthlyTax'))}</td>
                <td className="px-3 py-2 text-right">{money(sum('net'))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Modal open={confirmOpen} title="Finalize payroll?" onClose={() => !busy && setConfirmOpen(false)}>
        <p className="text-sm text-slate-600">
          Finalizing {run.month} locks the run and notifies every employee that their payslip is ready. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" disabled={busy} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => act(`/api/payroll/runs/${id}/finalize`)}>
            {busy ? 'Finalizing...' : 'Yes, finalize'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
