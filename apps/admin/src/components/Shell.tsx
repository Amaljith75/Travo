'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Building2,
  Bus,
  CalendarRange,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Package,
  Radio,
  Settings,
  Star,
  Ticket,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { ROLE_LABELS } from '@travo/core';
import { useAuth } from '@/lib/auth';
import { isDemo } from '@/lib/data';
import { cx } from './ui';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/packages/', label: 'Packages', icon: Package },
  { href: '/trips/', label: 'Scheduled Trips', icon: CalendarRange },
  { href: '/vehicles/', label: 'Vehicles', icon: Bus },
  { href: '/destinations/', label: 'Destinations', icon: MapPinned },
  { href: '/operators/', label: 'Operators', icon: Building2 },
  { href: '/bookings/', label: 'Bookings', icon: Ticket },
  { href: '/payments/', label: 'Payments', icon: Wallet },
  { href: '/travellers/', label: 'Travellers', icon: Users },
  { href: '/reviews/', label: 'Reviews', icon: Star },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, forbidden, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isLogin = pathname?.startsWith('/login');

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!loading && !user && !isLogin) router.replace('/login/');
  }, [loading, user, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted" aria-busy="true">
        Loading…
      </div>
    );
  if (forbidden)
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold">No admin access</h1>
          <p className="mt-2 text-sm text-muted">
            {user.email} is signed in but does not have an admin or staff role. Ask a Super Admin to grant access in Settings → Team.
          </p>
          <button className="mt-6 text-sm font-semibold text-emerald" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href.replace(/\/$/, '')));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M3 17 9 8l3.5 4.5L15 9l6 8z" fill="#fff" />
            <rect x="5" y="19" width="14" height="1.6" rx=".8" fill="#E9DFCC" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-bold leading-tight">Travo</p>
          <p className="text-[11px] text-muted">Marketplace admin</p>
        </div>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active(href) ? 'bg-forest text-white' : 'text-ink-soft hover:bg-sand-soft hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <Radio className={cx('h-3.5 w-3.5', isDemo ? 'text-gold' : 'text-emerald')} />
          <span className="text-muted">{isDemo ? 'Demo data (this browser)' : 'Live · syncing to app'}</span>
        </div>
        <p className="truncate text-sm font-semibold">{user.fullName ?? user.email}</p>
        <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
        {!isDemo && (
          <button onClick={() => void signOut()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-forest-deep/40" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-4 rounded p-1 text-muted" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-sand-soft">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold">Travo admin</span>
      </header>
      {isDemo && (
        <div className="border-b border-[#E4EDF6] bg-[#EEF4FA] px-6 py-2 text-xs text-[#2F5F8A]">
          Demo mode — changes are saved in this browser only and do not reach the mobile app. Connect Supabase to go live (see Settings).
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
