'use client';
import { api } from '@/lib/apiClient';
import { useFetch, inputCls, listOf } from '@/features/common-b/ui';

const pad = (n) => String(n).padStart(2, '0');
export const dayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function defaultRange() {
  const now = new Date();
  return { from: dayStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: dayStr(now), departmentId: '' };
}
export function cleanFilters(f) {
  const out = {};
  if (f.from) out.from = f.from;
  if (f.to) out.to = f.to;
  if (f.departmentId) out.departmentId = f.departmentId;
  return out;
}

export default function Filters({ value, onChange }) {
  const { data } = useFetch(() => api.get('/api/departments'), []);
  const depts = listOf(data);
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4">
      <label className="text-xs text-slate-600">
        From
        <input type="date" className={inputCls} value={value.from} max={value.to || undefined} onChange={(e) => set('from', e.target.value)} />
      </label>
      <label className="text-xs text-slate-600">
        To
        <input type="date" className={inputCls} value={value.to} min={value.from || undefined} onChange={(e) => set('to', e.target.value)} />
      </label>
      <label className="text-xs text-slate-600">
        Department
        <select className={inputCls} value={value.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
          <option value="">All departments</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <button type="button" onClick={() => onChange(defaultRange())} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Reset to this month
        </button>
      </div>
    </div>
  );
}
