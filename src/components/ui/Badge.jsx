'use client';
const COLORS = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
};
const MAP = {
  present: 'green', active: 'green', approved: 'green', finalized: 'green',
  late: 'yellow', pending: 'yellow', probation: 'yellow', half_day: 'yellow', draft: 'yellow',
  absent: 'red', rejected: 'red', inactive: 'red', missing_checkout: 'red',
  on_leave: 'blue', admin: 'blue', hr: 'blue',
};

export default function Badge({ value, color }) {
  if (!value && value !== 0) return <span className="text-gray-400">-</span>;
  const c = COLORS[color || MAP[value] || 'gray'];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{String(value).replace(/_/g, ' ')}</span>;
}
