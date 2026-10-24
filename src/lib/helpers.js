'use client';
import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import ErrorBox from '@/components/ui/ErrorBox';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

export function asList(d) {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.items)) return d.items;
  return [];
}

export function errText(e) {
  if (!e) return '';
  let m = e.message || 'Something went wrong';
  if (Array.isArray(e.details) && e.details.length) {
    m += ': ' + e.details.map((d) => (d.field ? d.field + ' - ' + d.reason : d.reason)).join('; ');
  }
  return m;
}

export function fieldErrors(e) {
  const out = {};
  if (e && Array.isArray(e.details)) e.details.forEach((d) => { if (d.field) out[d.field] = d.reason; });
  return out;
}

export function refId(v) {
  return v && typeof v === 'object' ? v.id || '' : v || '';
}

export function refName(v, list) {
  if (!v) return '-';
  if (typeof v === 'object') return v.name || '-';
  const f = (list || []).find((x) => x.id === v);
  return f ? f.name : '-';
}

export function useFetch(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((d) => { if (alive) setState({ data: d, loading: false, error: null }); })
      .catch((e) => { if (alive) setState({ data: null, loading: false, error: e }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || []), tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

// Shows loading / error / empty states, otherwise calls children(data)
export function Async({ state, empty, isEmpty, children }) {
  if (state.error) return <ErrorBox message={errText(state.error)} onRetry={state.reload} />;
  if (state.loading && state.data == null) return <Spinner />;
  const d = state.data;
  if (isEmpty && isEmpty(d)) return <EmptyState message={empty || 'Nothing here yet.'} />;
  return children(d);
}

export function Pager({ meta, page, setPage }) {
  if (!meta) return null;
  const limit = meta.limit || 20;
  const pages = Math.max(1, Math.ceil((meta.total || 0) / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
      <span className="text-gray-600">Page {page} of {pages} ({meta.total} total)</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
  );
}

export function CopyBox({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch (e) {
      const el = document.getElementById('copybox-input');
      if (el) { el.select(); document.execCommand('copy'); }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3">
      <p className="mb-2 text-sm font-medium text-amber-900">{label}</p>
      <div className="flex gap-2">
        <input id="copybox-input" readOnly value={value} className="w-full rounded border border-gray-300 bg-white px-2 py-1 font-mono text-sm" onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
      </div>
      <p className="mt-2 text-xs text-amber-800">Shown only once. Share it securely; the user must change it at first login.</p>
    </div>
  );
}
