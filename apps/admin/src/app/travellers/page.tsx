'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { formatDate, formatINR } from '@travo/core';
import { downloadCsv } from '@/lib/csv';
import { useBookings } from '@/lib/queries';
import { EmptyState, ErrorState, PageHeader, TableSkeleton, Button } from '@/components/ui';

/** People directory built from booking contacts (travellers book as guests today). */
export default function Travellers() {
  const q = useBookings();
  const [text, setText] = useState('');
  const people = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; email: string | null; bookings: number; confirmed: number; value: number; last: string; lastId: string }>();
    for (const b of q.data ?? []) {
      const key = b.contactPhone.replace(/\D/g, '').slice(-10);
      const cur = m.get(key) ?? { name: b.contactName, phone: b.contactPhone, email: b.contactEmail, bookings: 0, confirmed: 0, value: 0, last: '', lastId: b.id };
      cur.bookings++;
      if (b.status === 'confirmed' || b.status === 'completed') {
        cur.confirmed++;
        cur.value += b.estimatedTotal;
      }
      if (b.createdAt > cur.last) Object.assign(cur, { last: b.createdAt, lastId: b.id, name: b.contactName, email: b.contactEmail ?? cur.email });
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [q.data]);
  const list = people.filter((p) => !text || `${p.name} ${p.phone} ${p.email ?? ''}`.toLowerCase().includes(text.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Travellers"
        subtitle={`${people.length} people who have sent booking requests`}
        actions={<Button kind="outline" icon={<Download className="h-4 w-4" />} disabled={!list.length} onClick={() => downloadCsv('travo-travellers.csv', list.map((p) => ({ Name: p.name, Phone: p.phone, Email: p.email ?? '', Bookings: p.bookings, Confirmed: p.confirmed, 'Confirmed value (INR)': p.value, 'Last request': p.last })))}>Export CSV</Button>}
      />
      <div className="relative mb-4 w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Search name, phone or email" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !list.length ? (
          <EmptyState title="No travellers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Traveller</th>
                  <th className="th">Contact</th>
                  <th className="th">Requests</th>
                  <th className="th">Confirmed value</th>
                  <th className="th">Last request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((p) => (
                  <tr key={p.phone} className="hover:bg-cream/60">
                    <td className="td font-semibold">
                      <Link href={`/bookings/?q=${encodeURIComponent(p.phone)}`} className="hover:text-emerald">{p.name}</Link>
                    </td>
                    <td className="td text-ink-soft">{p.phone}<span className="block text-xs text-muted">{p.email ?? '—'}</span></td>
                    <td className="td">{p.bookings} <span className="text-xs text-muted">({p.confirmed} confirmed)</span></td>
                    <td className="td font-semibold">{formatINR(p.value)}</td>
                    <td className="td"><Link href={`/bookings/view/?id=${p.lastId}`} className="text-emerald hover:underline">{formatDate(p.last.slice(0, 10))}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">Edit a traveller’s name, phone, email and passengers from their booking.</p>
    </>
  );
}
