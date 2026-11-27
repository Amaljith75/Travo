'use client';

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert, Inbox, Loader2, X } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Kind = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
const kinds: Record<Kind, string> = {
  primary: 'bg-forest text-white hover:bg-forest-deep border-forest',
  secondary: 'bg-emerald-soft text-forest hover:bg-emerald-soft/70 border-emerald-soft',
  outline: 'bg-white text-ink border-line hover:bg-sand-soft',
  ghost: 'bg-transparent text-emerald border-transparent hover:bg-emerald-soft/60',
  danger: 'bg-white text-danger border-danger/30 hover:bg-danger/5',
};

export function Button({ kind = 'primary', loading, icon, children, className, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: Kind; loading?: boolean; icon?: ReactNode; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        kinds[kind],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

const tones = {
  green: 'bg-emerald-soft text-forest',
  gold: 'bg-[#FBF1DD] text-[#8A5A0B]',
  red: 'bg-danger/10 text-danger',
  blue: 'bg-[#E4EDF6] text-[#2F5F8A]',
  grey: 'bg-[#EEF0F1] text-muted',
  sand: 'bg-sand-soft text-[#7A5B23]',
} as const;
export type Tone = keyof typeof tones;

export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: Tone }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', tones[tone])}>{children}</span>;
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cx('card', className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={title ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-white px-3 py-2.5 text-left">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-emerald' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-deep/40 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()} className={cx('max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-sand-soft">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-cream px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-line/60', className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-soft">
        <Inbox className="h-5 w-5 text-emerald" />
      </div>
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
        <CircleAlert className="h-5 w-5 text-danger" />
      </div>
      <p className="font-semibold">Couldn’t load data</p>
      <p className="mt-1 max-w-md text-sm text-muted">{error instanceof Error ? error.message : 'Unknown error'}</p>
      {onRetry && (
        <Button kind="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-sand-soft p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition', value === t.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-xs text-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
