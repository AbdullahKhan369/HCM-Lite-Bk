'use client';
import { api } from '@/lib/apiClient';
import { useFetch, Spinner, ErrorBox, Panel, Empty, pct } from '@/features/common-b/ui';
import { Kpi, BarBox, LineBox } from './Charts';
import { cleanFilters } from './Filters';

export default function HrDashboard({ filters }) {
  const q = cleanFilters(filters);
  const { data, loading, error, reload } = useFetch(() => api.get('/api/dashboard/hr', q), [filters.from, filters.to, filters.departmentId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Empty text="No dashboard data yet." />;
  const k = data.kpis || {};
  const trend = (data.attendanceTrend || []).map((r) => ({ ...r, rate: pct(r.rate) }));
  const absent = (data.absenteeismByDept || []).map((r) => ({ ...r, rate: pct(r.rate) }));
  const late = Array.isArray(data.topLateComers) ? data.topLateComers.slice(0, 5) : [];
  const pctFmt = (v) => `${v}%`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Headcount" value={k.headcount} />
        <Kpi label="Present today" value={k.present} />
        <Kpi label="On leave" value={k.onLeave} />
        <Kpi label="Late today" value={k.lateToday} />
        <Kpi label="Pending approvals" value={k.pendingApprovals} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineBox title="Attendance rate (%)" data={trend} xKey="date" yKey="rate" name="Rate" fmt={pctFmt} />
        <BarBox title="Absenteeism by department (%)" data={absent} xKey="department" bars={[{ key: 'rate', name: 'Absenteeism' }]} fmt={pctFmt} />
        <BarBox title="Leave by type (days)" data={data.leaveByType} xKey="type" bars={[{ key: 'days', name: 'Days' }]} />
        <Panel title="Top 5 late-comers">
          {late.length === 0 ? (
            <Empty text="No late arrivals in this period." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1 pr-2">#</th>
                    <th className="py-1 pr-2">Employee</th>
                    <th className="py-1 text-right">Late days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {late.map((r, i) => (
                    <tr key={r.employeeId || i}>
                      <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                      <td className="py-2 pr-2">{r.name}</td>
                      <td className="py-2 text-right font-medium">{r.lateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
