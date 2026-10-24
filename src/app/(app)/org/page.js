'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { RequireRole } from '@/lib/auth';
import { Async, asList, errText, refId, refName, useFetch } from '@/lib/helpers';
import { fmtDate } from '@/lib/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ErrorBox from '@/components/ui/ErrorBox';

const TABS = [
  ['company', 'Company'],
  ['departments', 'Departments'],
  ['designations', 'Designations'],
  ['leave-types', 'Leave types'],
  ['holidays', 'Holidays'],
];

export default function OrgPage() {
  return (
    <RequireRole roles={['admin']}>
      <OrgInner />
    </RequireRole>
  );
}

function OrgInner() {
  const [tab, setTab] = useState('company');
  const depts = useFetch(() => api.get('/departments'), []);
  const deptList = asList(depts.data);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Organization</h1>
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-t px-3 py-2 text-sm ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{l}</button>
        ))}
      </div>

      {tab === 'company' && <CompanySettings />}

      {tab === 'departments' && (
        <Crud
          key="departments" title="Departments" path="/departments" addLabel="Add department"
          fields={[{ key: 'name', label: 'Name', type: 'text' }]}
          columns={[{ key: 'name', header: 'Name' }]}
          onChanged={depts.reload}
        />
      )}

      {tab === 'designations' && (
        <Async state={depts}>
          {() => (
            <Crud
              key="designations" title="Designations" path="/designations" addLabel="Add designation"
              fields={[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'departmentId', label: 'Department', type: 'select', options: deptList.map((d) => ({ value: d.id, label: d.name })) },
              ]}
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'departmentId', header: 'Department', render: (r) => refName(r.departmentId, deptList) },
              ]}
            />
          )}
        </Async>
      )}

      {tab === 'leave-types' && (
        <Crud
          key="leave-types" title="Leave types" path="/leave-types" addLabel="Add leave type" canDelete={false}
          fields={[
            { key: 'code', label: 'Code', type: 'select', options: ['annual', 'sick', 'casual', 'unpaid'].map((c) => ({ value: c, label: c })) },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'yearlyQuota', label: 'Yearly quota (days, blank = unlimited)', type: 'number', nullable: true },
          ]}
          columns={[
            { key: 'code', header: 'Code' },
            { key: 'name', header: 'Name' },
            { key: 'yearlyQuota', header: 'Yearly quota', render: (r) => (r.yearlyQuota === null || r.yearlyQuota === undefined ? 'Unlimited' : r.yearlyQuota) },
          ]}
        />
      )}

      {tab === 'holidays' && (
        <Crud
          key="holidays" title="Holidays" path="/holidays" addLabel="Add holiday" canEdit={false}
          fields={[
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'name', label: 'Name', type: 'text' },
          ]}
          columns={[
            { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'name', header: 'Name' },
          ]}
        />
      )}
    </div>
  );
}

function CompanySettings() {
  const state = useFetch(() => api.get('/settings'), []);
  return (
    <Card title="Company settings">
      <Async state={state}>{(s) => <SettingsForm initial={s} onSaved={state.reload} />}</Async>
    </Card>
  );
}

function SettingsForm({ initial, onSaved }) {
  const [f, setF] = useState({
    companyName: initial.companyName || '',
    officeStart: initial.officeStart || '09:00',
    graceMinutes: initial.graceMinutes ?? 15,
    halfDayHours: initial.halfDayHours ?? 5,
    weekend: Array.isArray(initial.weekend) ? initial.weekend : [0, 6],
    officeLat: initial.officeLat ?? '',
    officeLng: initial.officeLng ?? '',
    radiusMeters: initial.radiusMeters ?? 150,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (i) => setF({ ...f, weekend: f.weekend.includes(i) ? f.weekend.filter((x) => x !== i) : [...f.weekend, i].sort() });

  const useMyLocation = () => {
    setGeoMsg('');
    if (!navigator.geolocation) { setGeoMsg('Geolocation is not supported by this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setF((cur) => ({ ...cur, officeLat: Number(pos.coords.latitude.toFixed(6)), officeLng: Number(pos.coords.longitude.toFixed(6)) })),
      (err) => setGeoMsg('Could not get your location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setOkMsg('');
    if (!f.companyName.trim()) { setError(new Error('Company name is required')); return; }
    const body = {
      companyName: f.companyName.trim(),
      officeStart: f.officeStart,
      graceMinutes: Number(f.graceMinutes),
      halfDayHours: Number(f.halfDayHours),
      weekend: f.weekend,
      radiusMeters: Number(f.radiusMeters),
    };
    if (f.officeLat !== '' && f.officeLng !== '') { body.officeLat = Number(f.officeLat); body.officeLng = Number(f.officeLng); }
    setBusy(true);
    try { await api.put('/settings', body); setOkMsg('Settings saved.'); onSaved(); }
    catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input label="Company name" value={f.companyName} onChange={set('companyName')} className="sm:col-span-2" />
      <Input label="Office start time" type="time" value={f.officeStart} onChange={set('officeStart')} />
      <Input label="Grace minutes" type="number" min="0" value={f.graceMinutes} onChange={set('graceMinutes')} />
      <Input label="Half-day threshold (hours)" type="number" min="0" step="0.5" value={f.halfDayHours} onChange={set('halfDayHours')} />
      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">Weekend days</span>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={d} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={f.weekend.includes(i)} onChange={() => toggleDay(i)} /> {d}
            </label>
          ))}
        </div>
      </div>
      <Input label="Office latitude" type="number" step="any" value={f.officeLat} onChange={set('officeLat')} />
      <Input label="Office longitude" type="number" step="any" value={f.officeLng} onChange={set('officeLng')} />
      <Input label="Radius (meters)" type="number" min="0" value={f.radiusMeters} onChange={set('radiusMeters')} />
      <div className="flex items-end">
        <Button variant="secondary" onClick={useMyLocation}>Use my current location</Button>
      </div>
      <div className="space-y-2 sm:col-span-2">
        {geoMsg && <p className="text-sm text-amber-700">{geoMsg}</p>}
        {error && <ErrorBox message={errText(error)} />}
        {okMsg && <p className="text-sm text-green-700">{okMsg}</p>}
        <Button type="submit" loading={busy}>Save settings</Button>
      </div>
    </form>
  );
}

function initialForm(fields, item) {
  const o = {};
  fields.forEach((fl) => {
    let v = item ? item[fl.key] : '';
    if (fl.type === 'select') v = refId(v);
    if (fl.type === 'date') v = String(v || '').slice(0, 10);
    if (v === null || v === undefined) v = '';
    o[fl.key] = v;
  });
  return o;
}

// Generic list + add/edit/delete used by all simple org tabs
function Crud({ title, path, fields, columns, addLabel, canEdit = true, canDelete = true, onChanged }) {
  const state = useFetch(() => api.get(path), [path]);
  const [modal, setModal] = useState(null); // { item|null }
  const [delErr, setDelErr] = useState('');

  const remove = async (r) => {
    if (!window.confirm('Delete "' + (r.name || r.code) + '"?')) return;
    setDelErr('');
    try { await api.del(path + '/' + r.id); state.reload(); if (onChanged) onChanged(); }
    catch (e) { setDelErr(errText(e)); }
  };

  const cols = [
    ...columns,
    ...(canEdit || canDelete ? [{
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1">
          {canEdit && <Button variant="secondary" onClick={() => setModal({ item: r })}>Edit</Button>}
          {canDelete && <Button variant="danger" onClick={() => remove(r)}>Delete</Button>}
        </div>
      ),
    }] : []),
  ];

  return (
    <Card title={title} actions={<Button onClick={() => setModal({ item: null })}>{addLabel}</Button>}>
      {delErr && <p className="mb-2 text-sm text-red-600">{delErr}</p>}
      <Async state={state} empty={'No ' + title.toLowerCase() + ' yet.'} isEmpty={(d) => asList(d).length === 0}>
        {(d) => <Table rows={asList(d)} columns={cols} />}
      </Async>
      {modal && (
        <CrudModal
          title={(modal.item ? 'Edit ' : 'Add ') + title.toLowerCase()} path={path} fields={fields} item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); state.reload(); if (onChanged) onChanged(); }}
        />
      )}
    </Card>
  );
}

function CrudModal({ title, path, fields, item, onClose, onSaved }) {
  const [f, setF] = useState(initialForm(fields, item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const body = {};
    for (const fl of fields) {
      let v = f[fl.key];
      if (fl.type === 'number') {
        if (v === '' || v === null) { if (!fl.nullable) { setError(new Error(fl.label + ' is required')); return; } v = null; }
        else v = Number(v);
      } else if (typeof v === 'string') {
        v = v.trim();
        if (!v) { setError(new Error(fl.label + ' is required')); return; }
      }
      body[fl.key] = v;
    }
    setBusy(true);
    try {
      if (item) await api.put(path + '/' + item.id, body); else await api.post(path, body);
      onSaved();
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {fields.map((fl) => (fl.type === 'select' ? (
          <Select key={fl.key} label={fl.label} value={f[fl.key]} onChange={(e) => setF({ ...f, [fl.key]: e.target.value })}>
            <option value="">Select...</option>
            {fl.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ) : (
          <Input key={fl.key} label={fl.label} type={fl.type} min={fl.type === 'number' ? '0' : undefined} value={f[fl.key]} onChange={(e) => setF({ ...f, [fl.key]: e.target.value })} />
        )))}
        {error && <ErrorBox message={errText(error)} />}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
