'use client';

import type { ReactNode } from 'react';

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const c = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols];
  return <div className={`grid gap-4 ${c}`}>{children}</div>;
}

/** Sticky save bar at the bottom of edit pages. */
export function SaveBar({ children, dirty }: { children: ReactNode; dirty?: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2">
        {dirty && <span className="mr-auto text-xs text-gold">Unsaved changes</span>}
        {children}
      </div>
    </div>
  );
}

export const numberValue = { setValueAs: (v: unknown) => (v === '' || v == null ? 0 : Number(v)) };
