'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Panel, Empty } from '@/features/common-b/ui';

export const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value ?? '-'}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Box({ title, rows, children }) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <Empty text="No data for this selection." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function BarBox({ title, data, xKey, bars, fmt }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Box title={title} rows={rows}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={50} />
        <Tooltip formatter={fmt} />
        {bars.length > 1 && <Legend />}
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={b.color || COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </Box>
  );
}

export function LineBox({ title, data, xKey, yKey, name, fmt }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Box title={title} rows={rows}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={50} />
        <Tooltip formatter={fmt} />
        <Line type="monotone" dataKey={yKey} name={name || yKey} stroke={COLORS[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </Box>
  );
}

export function PieBox({ title, data, nameKey, valueKey }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Box title={title} rows={rows}>
      <PieChart>
        <Pie data={rows} dataKey={valueKey} nameKey={nameKey} outerRadius={85} label>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </Box>
  );
}
