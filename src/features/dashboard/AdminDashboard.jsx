'use client';
import { api } from '@/lib/apiClient';
import { fmtMoney, fmtDate, fmtTime } from '@/lib/format';
import { useFetch, Spinner, ErrorBox, Panel, Empty } from '@/features/common-b/ui';
import { Kpi, BarBox, PieBox } from './Charts';
import { cleanFilters } from './Filters';

export default function AdminDashboard({ filters }) {
  const q = cleanFilters(filters);
  const { data, loading, error, reload } = useFetch(() => api.get('/api/dashboard/admin', q), [filters.from, filters.to, filters.departmentId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Empty text="No dashboard data yet." />;
  const k = data.kpis || {};
  const feed = Array.isArray(data.auditFeed) ? data.auditFeed : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Headcount" value={k.headcount} hint="Active + probation" />
        <Kpi label="Attrition (YTD)" value={k.attritionYtd} />
        <Kpi label="Payroll cost" value={fmtMoney(k.payrollCost || 0)} />
        <Kpi label="Average salary" value={fmtMoney(k.avgSalary || 0)} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarBox title="Headcount by department" data={data.headcountByDept} xKey="department" bars={[{ key: 'count', name: 'Employees' }]} />
        <BarBox
          title="Payroll cost by department"
          data={data.payrollCostByDept}
          xKey="department"
          bars={[{ key: 'gross', name: 'Gross' }, { key: 'net', name: 'Net' }]}
          fmt={(v) => fmtMoney(v)}
        />
        <PieBox title="Gender split" data={data.genderSplit} nameKey="gender" valueKey="count" />
        <BarBox title="Tenure" data={data.tenureBuckets} xKey="label" bars={[{ key: 'count', name: 'Employees' }]} />
      </div>
      <Panel title="Recent activity">
        {feed.length === 0 ? (
          <Empty text="No audit activity yet." />
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {feed.map((a, i) => (
              <li key={a.id || i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{a.actorName || 'System'}</span> {a.action} <span className="text-slate-500">{a.entity}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {fmtDate(a.createdAt)} {fmtTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
