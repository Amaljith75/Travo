'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { OPERATOR_TYPES, OPERATOR_TYPE_LABELS, type OperatorTypeCode } from '@travo/core';
import { useBookings, useOperators, usePackages, useVehicles } from '@/lib/queries';
import { Badge, Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { VerificationBadge } from '@/components/StatusBadge';

export default function Operators() {
  const q = useOperators();
  const pk = usePackages();
  const vh = useVehicles();
  const bk = useBookings();
  const [type, setType] = useState<OperatorTypeCode | 'all'>('all');
  const [text, setText] = useState('');
  const all = q.data ?? [];
  const list = all.filter((o) => (type === 'all' || o.type === type) && (!text || `${o.businessName} ${o.district} ${o.contactName}`.toLowerCase().includes(text.toLowerCase())));
  const n = (arr: { operatorId: string }[] | undefined, id: string) => (arr ?? []).filter((x) => x.operatorId === id).length;

  return (
    <>
      <PageHeader
        title="Operators"
        subtitle="Travel agencies, tour operators, vehicle owners and fleet operators"
        actions={
          <Link href="/operators/edit/">
            <Button icon={<Plus className="h-4 w-4" />}>Add operator</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={type} onChange={setType} tabs={[{ value: 'all', label: 'All', count: all.length }, ...OPERATOR_TYPES.map((t) => ({ value: t, label: OPERATOR_TYPE_LABELS[t], count: all.filter((o) => o.type === t).length }))]} />
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search operators" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="No operators" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Business</th>
                  <th className="th">Contact</th>
                  <th className="th">Listings</th>
                  <th className="th">Bookings</th>
                  <th className="th">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/60">
                    <td className="td">
                      <Link href={`/operators/edit/?id=${o.id}`} className="flex items-center gap-3">
                        {o.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-sm font-bold text-white">{o.businessName.slice(0, 2).toUpperCase()}</span>
                        )}
                        <span>
                          <span className="block font-semibold hover:text-emerald">{o.businessName}</span>
                          <span className="block text-xs text-muted">
                            {OPERATOR_TYPE_LABELS[o.type]} · {o.district}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="td text-ink-soft">
                      {o.contactName}
                      <span className="block text-xs text-muted">{o.phone}</span>
                    </td>
                    <td className="td">
                      {n(pk.data, o.id)} packages · {n(vh.data, o.id)} vehicles
                    </td>
                    <td className="td">{n(bk.data, o.id)}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        <VerificationBadge s={o.verificationStatus} />
                        {o.isDemo && <Badge tone="blue">Demo</Badge>}
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
  );
}
