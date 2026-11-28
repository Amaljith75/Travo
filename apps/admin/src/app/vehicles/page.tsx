'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { formatINR, PRICING_UNIT_LABELS, VEHICLE_CATEGORY_LABELS, type Vehicle, type VehicleListingStatus } from '@travo/core';
import { api } from '@/lib/data';
import { useOperators, useSave, useVehicles } from '@/lib/queries';
import { Badge, Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { ListingBadge } from '@/components/StatusBadge';
import { errorMessage, useToast } from '@/components/toast';

const strip = ({ id: _i, createdAt: _c, updatedAt: _u, rating: _r, reviewCount: _rc, ...rest }: Vehicle) => rest;

export default function Vehicles() {
  const q = useVehicles();
  const ops = useOperators();
  const toast = useToast();
  const [tab, setTab] = useState<VehicleListingStatus | 'all'>('all');
  const save = useSave(({ v, patch }: { v: Vehicle; patch: Partial<Vehicle> }) => api.saveVehicle({ ...strip(v), ...patch }, v.id), ['vehicles', 'vehicle', 'stats']);
  const opName = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o.businessName])), [ops.data]);
  const all = q.data ?? [];
  const list = all.filter((v) => tab === 'all' || v.listingStatus === tab);
  const patch = async (v: Vehicle, p: Partial<Vehicle>, msg: string) => {
    try {
      await save.mutateAsync({ v, patch: p });
      toast('success', msg);
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle="Cars, tempo travellers, buses and coaches listed by owners and fleets"
        actions={
          <Link href="/vehicles/edit/">
            <Button icon={<Plus className="h-4 w-4" />}>Add vehicle</Button>
          </Link>
        }
      />
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: all.length },
            { value: 'pending', label: 'Awaiting approval', count: all.filter((v) => v.listingStatus === 'pending').length },
            { value: 'approved', label: 'Approved', count: all.filter((v) => v.listingStatus === 'approved').length },
            { value: 'rejected', label: 'Rejected', count: all.filter((v) => v.listingStatus === 'rejected').length },
          ]}
        />
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="No vehicles here" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Vehicle</th>
                  <th className="th">Owner</th>
                  <th className="th">Seats</th>
                  <th className="th">Price</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((v) => (
                  <tr key={v.id} className="hover:bg-cream/60">
                    <td className="td">
                      <Link href={`/vehicles/edit/?id=${v.id}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.images[0]?.url} alt="" className="h-12 w-16 rounded-lg bg-sand-soft object-cover" />
                        <span>
                          <span className="block font-semibold hover:text-emerald">{v.make} {v.model}</span>
                          <span className="block text-xs text-muted">
                            {VEHICLE_CATEGORY_LABELS[v.category]} · {v.baseDistrict} · {v.isAc ? 'AC' : 'Non-AC'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="td text-ink-soft">{opName.get(v.operatorId)}</td>
                    <td className="td">{v.seatingCapacity}</td>
                    <td className="td font-semibold">
                      {formatINR(v.price)}
                      <span className="text-xs font-normal text-muted">{PRICING_UNIT_LABELS[v.pricingUnit]}</span>
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        <ListingBadge s={v.listingStatus} />
                        {!v.isAvailable && <Badge tone="grey">Unavailable</Badge>}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        {v.listingStatus !== 'approved' && (
                          <Button size="sm" kind="secondary" icon={<Check className="h-3.5 w-3.5" />} onClick={() => patch(v, { listingStatus: 'approved' }, 'Approved — now visible in the app')}>
                            Approve
                          </Button>
                        )}
                        {v.listingStatus === 'pending' && (
                          <Button size="sm" kind="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => patch(v, { listingStatus: 'rejected' }, 'Listing rejected')}>
                            Reject
                          </Button>
                        )}
                        <Button size="sm" kind="outline" onClick={() => patch(v, { isAvailable: !v.isAvailable }, v.isAvailable ? 'Marked unavailable' : 'Marked available')}>
                          {v.isAvailable ? 'Set unavailable' : 'Set available'}
                        </Button>
                        <Link href={`/vehicles/edit/?id=${v.id}`}>
                          <Button size="sm" kind="outline">Edit</Button>
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
  );
}
