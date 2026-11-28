'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Search } from 'lucide-react';
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_TYPE_LABELS,
  formatDate,
  formatINR,
  PAYMENT_METHOD_LABELS,
  timeAgo,
  type BookingStatus,
  type EnquiryStatus,
} from '@travo/core';
import { api } from '@/lib/data';
import { downloadCsv } from '@/lib/csv';
import { useBookings, useEnquiries, useOperators, usePackages, useSave } from '@/lib/queries';
import { Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { BookingBadge, EnquiryBadge } from '@/components/StatusBadge';
import { errorMessage, useToast } from '@/components/toast';

function Bookings() {
  const params = useSearchParams();
  const [tab, setTab] = useState<'bookings' | 'enquiries'>('bookings');
  const [status, setStatus] = useState<BookingStatus | ''>((params.get('status') as BookingStatus) ?? '');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [packageId, setPackageId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const toast = useToast();

  const q = useBookings({ status: status || undefined, query: query || undefined, packageId: packageId || undefined, operatorId: operatorId || undefined, fromDate: from || undefined, toDate: to || undefined });
  const enquiries = useEnquiries();
  const pk = usePackages();
  const ops = useOperators();
  const setStatusM = useSave(({ id, s }: { id: string; s: BookingStatus }) => api.updateBookingStatus(id, s), ['bookings', 'booking', 'stats', 'trips']);
  const setEnq = useSave(({ id, s }: { id: string; s: EnquiryStatus }) => api.updateEnquiryStatus(id, s), ['enquiries', 'stats']);
  const pkgName = useMemo(() => new Map((pk.data ?? []).map((p) => [p.id, p.title])), [pk.data]);
  const opName = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o.businessName])), [ops.data]);
  const list = q.data ?? [];

  const exportCsv = () =>
    downloadCsv(
      `travo-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((b) => ({
        Reference: b.reference,
        Status: BOOKING_STATUS_LABELS[b.status],
        Package: pkgName.get(b.packageId ?? '') ?? '',
        Operator: opName.get(b.operatorId) ?? '',
        'Travel date': b.travelDate,
        Adults: b.adults,
        Children: b.children,
        'Pickup location': b.pickupLocation,
        'Contact name': b.contactName,
        Phone: b.contactPhone,
        Email: b.contactEmail ?? '',
        'Payment preference': PAYMENT_METHOD_LABELS[b.preferredPaymentMethod],
        'Estimated total (INR)': b.estimatedTotal,
        'Special requirements': b.specialRequirements ?? '',
        Requested: b.createdAt,
      })),
    );

  const change = async (id: string, s: BookingStatus) => {
    try {
      await setStatusM.mutateAsync({ id, s });
      toast('success', `Marked ${BOOKING_STATUS_LABELS[s].toLowerCase()}`);
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Booking requests and custom trip enquiries from the app"
        actions={tab === 'bookings' && <Button kind="outline" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!list.length}>Export CSV</Button>}
      />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'bookings', label: 'Booking requests', count: list.length }, { value: 'enquiries', label: 'Custom enquiries', count: enquiries.data?.length }]} />
      </div>

      {tab === 'bookings' ? (
        <>
          <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input pl-9" placeholder="Reference, name or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | '')} aria-label="Status">
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select className="input" value={packageId} onChange={(e) => setPackageId(e.target.value)} aria-label="Package">
              <option value="">All packages</option>
              {(pk.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <select className="input" value={operatorId} onChange={(e) => setOperatorId(e.target.value)} aria-label="Operator">
              <option value="">All operators</option>
              {(ops.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>{o.businessName}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Travel from" title="Travel from" />
              <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Travel to" title="Travel to" />
            </div>
          </div>
          <div className="card overflow-hidden">
            {q.isLoading ? (
              <TableSkeleton />
            ) : q.error ? (
              <ErrorState error={q.error} onRetry={() => q.refetch()} />
            ) : list.length === 0 ? (
              <EmptyState title="No bookings match" message="Try clearing filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px]">
                  <thead className="border-b border-line bg-cream">
                    <tr>
                      <th className="th">Reference</th>
                      <th className="th">Traveller</th>
                      <th className="th">Trip</th>
                      <th className="th">Travel date</th>
                      <th className="th">Total</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Quick actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {list.map((b) => (
                      <tr key={b.id} className="hover:bg-cream/60">
                        <td className="td">
                          <Link href={`/bookings/view/?id=${b.id}`} className="font-mono text-xs font-semibold hover:text-emerald">{b.reference}</Link>
                          <span className="block text-xs text-muted">{timeAgo(b.createdAt)}</span>
                        </td>
                        <td className="td">
                          {b.contactName}
                          <span className="block text-xs text-muted">{b.contactPhone} · {b.adults + b.children} pax</span>
                        </td>
                        <td className="td max-w-[220px] truncate text-ink-soft">{pkgName.get(b.packageId ?? '') ?? 'Custom'}</td>
                        <td className="td whitespace-nowrap">{formatDate(b.travelDate)}</td>
                        <td className="td font-semibold">{formatINR(b.estimatedTotal)}</td>
                        <td className="td"><BookingBadge s={b.status} /></td>
                        <td className="td">
                          <div className="flex justify-end gap-1.5">
                            {b.status === 'pending' && (
                              <>
                                <Button size="sm" kind="secondary" onClick={() => change(b.id, 'confirmed')}>Confirm</Button>
                                <Button size="sm" kind="danger" onClick={() => change(b.id, 'rejected')}>Reject</Button>
                              </>
                            )}
                            <Link href={`/bookings/view/?id=${b.id}`}>
                              <Button size="sm" kind="outline">Open</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card overflow-hidden">
          {enquiries.isLoading ? (
            <TableSkeleton />
          ) : enquiries.error ? (
            <ErrorState error={enquiries.error} onRetry={() => enquiries.refetch()} />
          ) : !enquiries.data?.length ? (
            <EmptyState title="No enquiries yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-line bg-cream">
                  <tr>
                    <th className="th">Reference</th>
                    <th className="th">Traveller</th>
                    <th className="th">Route</th>
                    <th className="th">Date</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {enquiries.data.map((e) => (
                    <tr key={e.id}>
                      <td className="td">
                        <span className="font-mono text-xs font-semibold">{e.reference}</span>
                        <span className="block text-xs text-muted">{ENQUIRY_TYPE_LABELS[e.type]} · {timeAgo(e.createdAt)}</span>
                      </td>
                      <td className="td">
                        {e.contactName}
                        <span className="block text-xs text-muted">{e.contactPhone}{e.contactEmail ? ` · ${e.contactEmail}` : ''}</span>
                      </td>
                      <td className="td">
                        {e.pickupLocation} → {e.destination}
                        <span className="block text-xs text-muted">
                          {e.passengers} pax{e.stops.length ? ` · via ${e.stops.join(', ')}` : ''}
                          {e.message ? ` · “${e.message}”` : ''}
                        </span>
                      </td>
                      <td className="td whitespace-nowrap">{formatDate(e.travelDate)}{e.returnDate ? ` – ${formatDate(e.returnDate)}` : ''}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <EnquiryBadge s={e.status} />
                          <select
                            className="input h-8 w-32 py-0 text-xs"
                            value={e.status}
                            aria-label="Change status"
                            onChange={async (ev) => {
                              try {
                                await setEnq.mutateAsync({ id: e.id, s: ev.target.value as EnquiryStatus });
                                toast('success', 'Enquiry updated');
                              } catch (err) {
                                toast('error', errorMessage(err));
                              }
                            }}
                          >
                            {ENQUIRY_STATUSES.map((s) => (
                              <option key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Bookings />
    </Suspense>
  );
}
