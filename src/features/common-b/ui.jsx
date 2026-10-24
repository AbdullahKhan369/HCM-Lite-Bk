'use client';
import { useCallback, useEffect, useState } from 'react';

export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

// Runs an async function on mount and whenever deps change.
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then(
        (data) => alive && setState({ data, loading: false, error: null }),
        (error) => alive && setState({ data: null, loading: false, error })
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  const msg = (error && error.message) || (typeof error === 'string' ? error : 'Something went wrong.');
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
      <p>{msg}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-100">
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ text = 'Nothing to show yet.' }) {
  return <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</div>;
}

const TONES = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Pill({ tone = 'gray', children }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone] || TONES.gray}`}>{children}</span>;
}

export function Btn({ variant = 'primary', className = '', ...props }) {
  const v =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
      : variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}
    />
  );
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-800">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AiBadge() {
  return <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">AI-generated</span>;
}

export const listOf = (v) => (Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : []);
export const pct = (v) => {
  const n = Number(v) || 0;
  return Math.round((n <= 1 ? n * 100 : n) * 10) / 10;
};
