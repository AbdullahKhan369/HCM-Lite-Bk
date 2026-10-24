'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { RequireRole } from '@/lib/auth';
import { Async, asList, useFetch } from '@/lib/helpers';
import { fmtTime, todayStr } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';

export default function BoardPage() {
  return (
    <RequireRole roles={['admin', 'hr']}>
      <BoardInner />
    </RequireRole>
  );
}

function BoardInner() {
  const [date, setDate] = useState(todayStr());
  const [departmentId, setDepartmentId] = useState('');
  const depts = useFetch(() => api.get('/departments'), []);
  const state = useFetch(() => api.get('/attendance/board', { date, departmentId }), [date, departmentId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Attendance board</h1>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All departments</option>
            {asList(depts.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
      </Card>
      <Async state={state} empty="No employees for this date and filter." isEmpty={(d) => asList(d).length === 0}>
        {(d) => {
          const rows = asList(d);
          const counts = {};
          rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
          return (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.keys(counts).map((k) => <span key={k} className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1"><Badge value={k} /> {counts[k]}</span>)}
              </div>
              <Table
                rowKey="employeeId"
                rows={rows}
                columns={[
                  { key: 'code', header: 'Code' },
                  { key: 'name', header: 'Name' },
                  { key: 'department', header: 'Department', render: (r) => (r.department && r.department.name) || r.department || '-' },
                  { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
                  { key: 'checkInAt', header: 'In', render: (r) => fmtTime(r.checkInAt) },
                  { key: 'checkOutAt', header: 'Out', render: (r) => fmtTime(r.checkOutAt) },
                  { key: 'workedHours', header: 'Hours', render: (r) => (r.workedHours ?? '-') },
                ]}
              />
            </>
          );
        }}
      </Async>
    </div>
  );
}
