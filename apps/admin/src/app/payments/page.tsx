'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { formatDateTime, formatINR, PAYMENT_METHOD_LABELS, type PaymentRecord } from '@travo/core';
import { downloadCsv } from '@/lib/csv';
import { useBookings, usePayments } from '@/lib/queries';
import { Button, Card, EmptyState, ErrorState, PageHeader, TableSkeleton } from '@/components/ui';
import { PaymentBadge } from '@/components/StatusBadge';
import { PaymentModal } from '@/components/PaymentForm';

export default function Payments() {
  const q = usePayments();
  const bookings = useBookings();
  const [modal, setModal] = useState<{ open: boolean; payment: PaymentRecord | null }>({ open: false, payment: null });
  const byId = useMemo(() => new Map((bookings.data ?? []).map((b) => [b.id, b])), [bookings.data]);
  const list = q.data ?? [];
  const paid = list.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = list.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const due = (bookings.data ?? []).filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.estimatedTotal, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Offline and manual payments recorded against bookings"
        actions={
          <>
            <Button kind="outline" icon={<Download className="h-4 w-4" />} disabled={!list.length} onClick={() => downloadCsv('travo-payments.csv', list.map((p) => ({ Booking: byId.get(p.bookingId)?.reference ?? p.bookingId, Traveller: byId.get(p.bookingId)?.contactName ?? '', Amount: p.amount, Method: PAYMENT_METHOD_LABELS[p.method], Status: p.status, Reference: p.providerReference ?? '', Notes: p.notes ?? '', Date: p.createdAt })))}>
              Export CSV
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, payment: null })}>Record payment</Button>
          </>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-muted">Collected</p><p className="mt-1 text-2xl font-bold text-forest">{formatINR(paid)}</p></Card>
        <Card><p className="text-xs text-muted">Pending</p><p className="mt-1 text-2xl font-bold text-gold">{formatINR(pending)}</p></Card>
        <Card><p className="text-xs text-muted">Confirmed booking value</p><p className="mt-1 text-2xl font-bold">{formatINR(due)}</p></Card>
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !list.length ? (
          <EmptyState title="No payments recorded" message="Record advances or full payments collected by operators." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Booking</th>
                  <th className="th">Amount</th>
                  <th className="th">Method</th>
                  <th className="th">Reference</th>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((p) => {
                  const b = byId.get(p.bookingId);
                  return (
                    <tr key={p.id} className="cursor-pointer hover:bg-cream/60" onClick={() => setModal({ open: true, payment: p })}>
                      <td className="td">
                        {b ? (
                          <Link href={`/bookings/view/?id=${b.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs font-semibold hover:text-emerald">{b.reference}</Link>
                        ) : (
                          '—'
                        )}
                        <span className="block text-xs text-muted">{b?.contactName}</span>
                      </td>
                      <td className="td font-semibold">{formatINR(p.amount)}</td>
                      <td className="td">{PAYMENT_METHOD_LABELS[p.method]}</td>
                      <td className="td text-ink-soft">{p.providerReference ?? '—'}<span className="block text-xs text-muted">{p.notes}</span></td>
                      <td className="td whitespace-nowrap text-ink-soft">{formatDateTime(p.createdAt)}</td>
                      <td className="td"><PaymentBadge s={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PaymentModal open={modal.open} onClose={() => setModal({ open: false, payment: null })} payment={modal.payment} bookings={bookings.data ?? []} />
    </>
  );
}
