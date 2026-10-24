'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Async, Pager, asList, errText, useFetch } from '@/lib/helpers';
import { fmtDate, fmtTime, monthBounds, monthStr, shiftMonth, todayStr } from '@/lib/format';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

const CAL_COLORS = {
  present: 'bg-green-100 text-green-800', late: 'bg-yellow-100 text-yellow-800', half_day: 'bg-yellow-100 text-yellow-800',
  missing_checkout: 'bg-red-100 text-red-800', absent: 'bg-red-100 text-red-800', on_leave: 'bg-blue-100 text-blue-800',
  weekend: 'bg-gray-100 text-gray-400', holiday: 'bg-purple-100 text-purple-800',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const isEmp = user.role === 'employee';
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(monthStr(todayStr()));
  const emps = useFetch(() => (isEmp ? Promise.resolve(null) : api.getPaged('/employees', { limit: 100 })), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Attendance</h1>
        <div className="flex gap-2 text-sm">
          {!isEmp && <Link href="/attendance/board" className="text-indigo-600">Daily board</Link>}
          <Link href="/attendance/corrections" className="text-indigo-600">Corrections</Link>
        </div>
      </div>

      {isEmp && <TodayWidget />}

      {!isEmp && (
        <Card>
          <Async state={emps} empty="No employees yet." isEmpty={(d) => asList(d && d.data).length === 0}>
            {(d) => (
              <Select label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Select an employee...</option>
                {asList(d.data).map((x) => <option key={x.id} value={x.id}>{x.code} - {x.name}</option>)}
              </Select>
            )}
          </Async>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, -1))}>&lt;</Button>
        <Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, 1))}>&gt;</Button>
      </div>

      {!isEmp && !employeeId ? (
        <EmptyState message="Select an employee to view their calendar and history." />
      ) : (
        <>
          <CalendarCard month={month} employeeId={isEmp ? '' : employeeId} />
          <HistoryCard month={month} employeeId={isEmp ? '' : employeeId} />
        </>
      )}
    </div>
  );
}

function TodayWidget() {
  const state = useFetch(() => api.get('/attendance/today'), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (kind) => {
    setBusy(true); setError('');
    try {
      await api.post('/attendance/' + kind, {});
      state.reload();
      window.dispatchEvent(new Event('hcm:attendance'));
    } catch (e) { setError(errText(e)); }
    setBusy(false);
  };

  return (
    <Card title={'Today - ' + fmtDate(todayStr())}>
      <Async state={state}>
        {(d) => {
          const r = d && d.record;
          return (
            <div className="space-y-3">
              {!r && <p className="text-sm text-gray-600">You have not checked in yet.</p>}
              {r && (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><div className="text-gray-500">Check-in</div><div className="font-medium">{fmtTime(r.checkInAt)}</div></div>
                  <div><div className="text-gray-500">Check-out</div><div className="font-medium">{fmtTime(r.checkOutAt)}</div></div>
                  <div><div className="text-gray-500">Worked</div><div className="font-medium">{r.checkOutAt ? (r.workedHours ?? 0) + ' h' : '-'}</div></div>
                  <div><div className="text-gray-500">Status</div><Badge value={r.status} /></div>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!r && <Button loading={busy} onClick={() => act('check-in')}>Check in</Button>}
              {r && !r.checkOutAt && <Button loading={busy} onClick={() => act('check-out')}>Check out</Button>}
              {r && r.checkOutAt && <p className="text-sm text-green-700">You are done for today.</p>}
            </div>
          );
        }}
      </Async>
    </Card>
  );
}

function CalendarCard({ month, employeeId }) {
  const state = useFetch(() => api.get('/attendance/calendar', { month, employeeId }), [month, employeeId]);
  const [y, m] = month.split('-').map(Number);
  const offset = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return (
    <Card title="Calendar">
      <Async state={state} empty="No calendar data for this month." isEmpty={(d) => asList(d).length === 0}>
        {(d) => {
          const list = asList(d);
          return (
            <div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((x) => <div key={x}>{x}</div>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: offset }).map((_, i) => <div key={'b' + i} />)}
                {list.map((c) => (
                  <div key={c.date} title={c.status} className={`flex min-h-[44px] flex-col items-center justify-center rounded p-0.5 text-center text-[10px] leading-tight sm:min-h-[56px] sm:text-xs ${CAL_COLORS[c.status] || 'bg-white border border-gray-200'}`}>
                    <span className="font-semibold">{Number(c.date.slice(8, 10))}</span>
                    <span className="hidden sm:block">{String(c.status || '').replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {Object.keys(CAL_COLORS).map((k) => <span key={k} className={`rounded px-2 py-0.5 ${CAL_COLORS[k]}`}>{k.replace(/_/g, ' ')}</span>)}
              </div>
            </div>
          );
        }}
      </Async>
    </Card>
  );
}

function HistoryCard({ month, employeeId }) {
  const [page, setPage] = useState(1);
  const { from, to } = monthBounds(month);
  const state = useFetch(() => api.getPaged('/attendance', { employeeId, from, to, page, limit: 31 }), [month, employeeId, page]);
  return (
    <Card title="History">
      <Async state={state} empty="No attendance records in this month." isEmpty={(d) => asList(d.data).length === 0}>
        {(d) => (
          <>
            <Table
              rows={asList(d.data)}
              columns={[
                { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
                { key: 'checkInAt', header: 'In', render: (r) => fmtTime(r.checkInAt) },
                { key: 'checkOutAt', header: 'Out', render: (r) => fmtTime(r.checkOutAt) },
                { key: 'workedHours', header: 'Hours', render: (r) => (r.workedHours ?? '-') },
                { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
              ]}
            />
            <Pager meta={d.meta} page={page} setPage={setPage} />
          </>
        )}
      </Async>
    </Card>
  );
}
