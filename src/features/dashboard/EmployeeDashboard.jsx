'use client';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { fmtDate, fmtTime, fmtMoney } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Panel, Empty, Pill, listOf } from '@/features/common-b/ui';
import { Kpi } from './Charts';

const TONE = { present: 'green', late: 'yellow', half_day: 'yellow', missing_checkout: 'red' };

export default function EmployeeDashboard() {
  const { data, loading, error, reload } = useFetch(() => api.get('/api/dashboard/me'), []);
  const ann = useFetch(() => api.get('/api/announcements'), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Empty text="No dashboard data yet." />;

  const target = data.weeklyTarget || 40;
  const hours = Number(data.hoursThisWeek) || 0;
  const pctDone = Math.min(100, Math.round((hours / target) * 100));
  const rec = data.todayRecord;
  const balances = Array.isArray(data.leaveBalances) ? data.leaveBalances : [];
  const slip = data.lastPayslip;
  const announcements = listOf(ann.data).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Panel title="Today">
          {rec ? (
            <div className="space-y-1 text-sm">
              <Pill tone={TONE[rec.status] || 'gray'}>{String(rec.status).replace('_', ' ')}</Pill>
              <p>In: {rec.checkInAt ? fmtTime(rec.checkInAt) : '-'}</p>
              <p>Out: {rec.checkOutAt ? fmtTime(rec.checkOutAt) : 'Not yet'}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">You have not checked in today.</p>
          )}
          <Link href="/attendance" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
            Go to attendance
          </Link>
        </Panel>
        <Panel title="Hours this week">
          <p className="text-2xl font-semibold">
            {hours} <span className="text-sm font-normal text-slate-500">/ {target} h</span>
          </p>
          <div className="mt-2 h-2 w-full rounded bg-slate-100" aria-label={`${pctDone}% of weekly target`}>
            <div className="h-2 rounded bg-indigo-600" style={{ width: `${pctDone}%` }} />
          </div>
        </Panel>
        <Kpi label="Late arrivals" value={data.lateCount ?? 0} hint="In the current period" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Leave balances">
          {balances.length === 0 ? (
            <Empty text="No leave balances available." />
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {balances.map((b) => (
                <li key={b.leaveTypeId || b.code} className="flex justify-between py-2">
                  <span>{b.name}</span>
                  <span className="font-medium">{b.remaining === null || b.remaining === undefined ? 'Unlimited' : `${b.remaining} of ${b.quota} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Last payslip">
          {slip ? (
            <div className="text-sm">
              <p className="text-slate-500">{slip.month}</p>
              <p className="text-2xl font-semibold">{fmtMoney(slip.net)}</p>
              <p className="text-slate-500">Net pay</p>
              <Link href="/payslips" className="mt-2 inline-block text-indigo-600 hover:underline">
                View payslips
              </Link>
            </div>
          ) : (
            <Empty text="No payslip has been published yet." />
          )}
        </Panel>
      </div>

      <Panel title="Announcements">
        {ann.loading ? (
          <Spinner />
        ) : ann.error ? (
          <ErrorBox error={ann.error} onRetry={ann.reload} />
        ) : announcements.length === 0 ? (
          <Empty text="No announcements." />
        ) : (
          <ul className="space-y-3 text-sm">
            {announcements.map((a) => (
              <li key={a.id}>
                <p className="font-medium">{a.title}</p>
                <p className="text-slate-600">{a.body}</p>
                {a.createdAt && <p className="text-xs text-slate-400">{fmtDate(a.createdAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
