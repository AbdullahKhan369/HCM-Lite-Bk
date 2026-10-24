'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { Btn, AiBadge, PageHeader, Spinner, inputCls } from '@/features/common-b/ui';

const CHIPS = {
  employee: ['How many sick leaves do I have left?', 'What are the leave rules?', 'How many times was I late this month?', 'What is my attendance this month?'],
  hr: ['Who came late most this month?', 'How many people are on leave today?', 'What are the leave rules?', 'Show the attendance summary for this month'],
  admin: ['What is our current headcount?', 'Summarize payroll for last month', 'Who came late most this month?', 'What are the leave rules?'],
};

export default function AiPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  if (loading || !user) return <Spinner />;
  const chips = CHIPS[user.role] || CHIPS.employee;

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setSending(true);
    try {
      const res = await api.post('/api/ai/chat', { message: q });
      setMessages((m) => [
        ...m,
        { role: 'ai', text: res?.answer || 'I could not find an answer to that.', toolsUsed: Array.isArray(res?.toolsUsed) ? res.toolsUsed : [] },
      ]);
    } catch (e) {
      const msg =
        e.status === 429
          ? 'You have reached the hourly limit of 20 AI questions. Please try again a little later.'
          : e.status === 401
          ? 'Your session has expired. Please sign in again.'
          : e.message || 'The assistant is unavailable right now. Please try again.';
      setMessages((m) => [...m, { role: 'error', text: msg, retry: q }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[420px] flex-col">
      <PageHeader title="AI assistant" subtitle="Ask about attendance, leave and payroll. Answers only use data you are allowed to see." />
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3" aria-live="polite">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <p className="mb-3 text-sm text-slate-500">Try one of these questions:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {chips.map((c) => (
                <button key={c} type="button" onClick={() => send(c)} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">{m.text}</div>
            </div>
          ) : m.role === 'ai' ? (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                <div className="mb-1">
                  <AiBadge />
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.toolsUsed.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <span>Tools used:</span>
                    {m.toolsUsed.map((t, j) => (
                      <span key={j} className="rounded bg-white px-1.5 py-0.5 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {m.text}
                {i === messages.length - 1 && m.retry && (
                  <button type="button" disabled={sending} onClick={() => send(m.retry)} className="mt-1 block underline">
                    Try again
                  </button>
                )}
              </div>
            </div>
          )
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">Thinking...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {chips.map((c) => (
            <button key={c} type="button" disabled={sending} onClick={() => send(c)} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              {c}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input className={inputCls} placeholder="Ask a question..." value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} aria-label="Your question" />
        <Btn type="submit" disabled={sending || !input.trim()}>
          Send
        </Btn>
      </form>
    </div>
  );
}
