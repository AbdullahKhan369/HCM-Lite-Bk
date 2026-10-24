'use client';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { Btn, Panel, AiBadge, ErrorBox } from '@/features/common-b/ui';
import { cleanFilters } from './Filters';

export default function AiSummary({ kind, filters }) {
  const [state, setState] = useState({ loading: false, error: null, bullets: null });

  async function run() {
    setState({ loading: true, error: null, bullets: null });
    try {
      const res = await api.post('/api/ai/summary', { kind, filters: cleanFilters(filters) });
      setState({ loading: false, error: null, bullets: Array.isArray(res?.bullets) ? res.bullets : [] });
    } catch (e) {
      const err = e.status === 429 ? new Error('Too many AI requests right now. Please wait a bit and try again.') : e;
      setState({ loading: false, error: err, bullets: null });
    }
  }

  return (
    <Panel
      title="AI summary"
      action={
        <Btn onClick={run} disabled={state.loading}>
          {state.loading ? 'Summarizing...' : 'Summarize with AI'}
        </Btn>
      }
      className="mb-4"
    >
      {!state.loading && !state.error && state.bullets === null && (
        <p className="text-sm text-slate-500">Get a short summary of the numbers on this page.</p>
      )}
      {state.loading && <p className="text-sm text-slate-500">Writing summary...</p>}
      {state.error && <ErrorBox error={state.error} onRetry={run} />}
      {state.bullets && state.bullets.length === 0 && <p className="text-sm text-slate-500">The AI returned no summary points.</p>}
      {state.bullets && state.bullets.length > 0 && (
        <div>
          <div className="mb-2">
            <AiBadge />
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
            {state.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
