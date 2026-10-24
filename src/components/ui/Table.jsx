'use client';
import EmptyState from '@/components/ui/EmptyState';

export default function Table({ columns, rows, rowKey = 'id', onRowClick, empty = 'No records found.' }) {
  if (!rows || rows.length === 0) return <EmptyState message={empty} />;
  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-2">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={r[rowKey] !== undefined ? r[rowKey] : i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 align-top">
                  {c.render ? c.render(r) : (r[c.key] !== undefined && r[c.key] !== null && r[c.key] !== '' ? r[c.key] : '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
