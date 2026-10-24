'use client';
import { Fragment, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { fmtDate, fmtTime } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Empty, Btn, PageHeader, inputCls, listOf } from '@/features/common-b/ui';

const LIMIT = 20;

function Json({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {value === null || value === undefined ? (
        <p className="text-xs text-slate-400">None</p>
      ) : (
        <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">{JSON.stringify(value, null, 2)}</pre>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ action: '', entity: '' });
  const [applied, setApplied] = useState({ action: '', entity: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);

  const isAdmin = user?.role === 'admin';
  const { data, loading, error, reload } = useFetch(async () => {
    if (!isAdmin) return null;
    const params = { page, limit: LIMIT };
    if (applied.action) params.action = applied.action;
    if (applied.entity) params.entity = applied.entity;
    return api.getPaged('/api/audit-logs', params);
  }, [page, applied.action, applied.entity, isAdmin]);

  if (user && !isAdmin) return <ErrorBox error="Only admins can view the audit log." />;

  const rows = listOf(data?.data);
  const total = data?.meta?.total ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  function apply(e) {
    e.preventDefault();
    setPage(1);
    setOpen(null);
    setApplied({ action: form.action.trim(), entity: form.entity.trim() });
  }

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Every create, update, approval and finalization" />
      <form onSubmit={apply} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
        <label className="text-xs text-slate-600">
          Action
          <input className={inputCls} placeholder="e.g. create, approve, finalize" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
        </label>
        <label className="text-xs text-slate-600">
          Entity
          <input className={inputCls} placeholder="e.g. employee, leave, payroll" value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} />
        </label>
        <div className="flex items-end gap-2">
          <Btn type="submit" className="flex-1">
            Apply filters
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => {
              setForm({ action: '', entity: '' });
              setApplied({ action: '', entity: '' });
              setPage(1);
            }}
          >
            Clear
          </Btn>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <Empty text="No audit entries match these filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const isOpen = open === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {fmtDate(r.createdAt)} {fmtTime(r.createdAt)}
                        </td>
                        <td className="px-3 py-2">{r.actorName || '-'}</td>
                        <td className="px-3 py-2">{r.action}</td>
                        <td className="px-3 py-2">
                          {r.entity}
                          {r.entityId ? <span className="ml-1 text-xs text-slate-400">{String(r.entityId).slice(-6)}</span> : null}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)} className="text-indigo-600 hover:underline">
                            {isOpen ? 'Hide details' : 'Show details'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-3 py-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <Json label="Before" value={r.before} />
                              <Json label="After" value={r.after} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>
              Page {page} of {pages} ({total} entries)
            </span>
            <div className="flex gap-2">
              <Btn variant="secondary" disabled={page <= 1} onClick={() => { setOpen(null); setPage((p) => p - 1); }}>
                Previous
              </Btn>
              <Btn variant="secondary" disabled={page >= pages} onClick={() => { setOpen(null); setPage((p) => p + 1); }}>
                Next
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
