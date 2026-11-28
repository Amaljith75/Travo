'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { formatDateRange, formatINR, seatsLeft, todayISO } from '@travo/core';
import { useDestinations, useOperators, useTrips } from '@/lib/queries';
import { Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { TripBadge } from '@/components/StatusBadge';

export default function Trips() {
  const q = useTrips();
  const dest = useDestinations();
  const ops = useOperators();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const destName = useMemo(() => new Map((dest.data ?? []).map((d) => [d.id, d.name])), [dest.data]);
  const opName = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o.businessName])), [ops.data]);
  const today = todayISO();
  const all = q.data ?? [];
  const list = all.filter((t) => tab === 'all' || (tab === 'upcoming' ? t.returnDate >= today && t.status !== 'completed' : t.returnDate < today || t.status === 'completed'));

  return (
    <>
      <PageHeader
        title="Scheduled trips"
        subtitle="Fixed-date departures that travellers book by the seat"
        actions={
          <Link href="/trips/edit/">
            <Button icon={<Plus className="h-4 w-4" />}>New trip</Button>
          </Link>
        }
      />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All', count: all.length }]} />
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="No trips here" message="Schedule a departure from an existing package." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Trip</th>
                  <th className="th">Dates</th>
                  <th className="th">Departs from</th>
                  <th className="th">Seats</th>
                  <th className="th">Price</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((t) => {
                  const left = seatsLeft(t);
                  return (
                    <tr key={t.id} className="hover:bg-cream/60">
                      <td className="td">
                        <Link href={`/trips/edit/?id=${t.id}`} className="font-semibold hover:text-emerald">
                          {t.title}
                        </Link>
                        <span className="block text-xs text-muted">
                          {destName.get(t.destinationId)} · {opName.get(t.operatorId)}
                        </span>
                      </td>
                      <td className="td whitespace-nowrap">
                        {formatDateRange(t.departureDate, t.returnDate)}
                        <span className="block text-xs text-muted">{t.departureTime}</span>
                      </td>
                      <td className="td text-ink-soft">{t.departureLocation}</td>
                      <td className="td">
                        <span className="font-semibold">{left}</span>
                        <span className="text-muted"> / {t.totalSeats} left</span>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded bg-line/70">
                          <div className="h-full bg-emerald" style={{ width: `${(t.seatsBooked / t.totalSeats) * 100}%` }} />
                        </div>
                      </td>
                      <td className="td font-semibold">{formatINR(t.pricePerPerson)}</td>
                      <td className="td">
                        <TripBadge s={t.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
