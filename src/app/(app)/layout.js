'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { NAV } from '@/lib/nav';
import { asList } from '@/lib/helpers';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export default function AppLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.mustChangePassword) router.replace('/change-password');
  }, [loading, user, router]);

  const loadCount = useCallback(async () => {
    try {
      const d = await api.get('/notifications');
      setUnread(asList(d).filter((n) => !n.read).length);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined;
    loadCount();
    const t = setInterval(loadCount, 60000);
    window.addEventListener('hcm:notifications', loadCount);
    return () => { clearInterval(t); window.removeEventListener('hcm:notifications', loadCount); };
  }, [user, loadCount]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (loading || !user || user.mustChangePassword) return <Spinner full />;

  const items = NAV.filter((n) => n.roles.includes(user.role));
  let active = '';
  items.forEach((n) => {
    if ((pathname === n.href || pathname.startsWith(n.href + '/')) && n.href.length > active.length) active = n.href;
  });

  const sidebar = (
    <nav className="space-y-1 p-3">
      {items.map((n) => (
        <Link key={n.href} href={n.href} className={`flex items-center justify-between rounded px-3 py-2 text-sm ${active === n.href ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
          <span>{n.label}</span>
          {n.href === '/notifications' && unread > 0 && <span className="rounded-full bg-red-500 px-2 text-xs text-white">{unread}</span>}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="border-b border-gray-200 p-4 text-lg font-bold text-indigo-700">HCM Lite</div>
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-white shadow-xl">
            <div className="border-b border-gray-200 p-4 text-lg font-bold text-indigo-700">HCM Lite</div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded border border-gray-300 px-2 py-1 text-lg md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">&#9776;</button>
            <span className="text-sm text-gray-600">{user.name} <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">{user.role}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100" aria-label="Notifications">
              Alerts{unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 text-xs text-white">{unread}</span>}
            </Link>
            <Button variant="secondary" onClick={logout}>Logout</Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl space-y-4 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
