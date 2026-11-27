'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Copy, Eye, EyeOff, Plus, Search, Star } from 'lucide-react';
import {
  effectivePrice,
  formatDuration,
  formatINR,
  PACKAGE_STATUSES,
  PACKAGE_STATUS_LABELS,
  type PackageStatus,
  type TravelPackage,
} from '@travo/core';
import { api } from '@/lib/data';
import { useDestinations, useOperators, usePackages, useSave } from '@/lib/queries';
import { Badge, Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { PackageBadge } from '@/components/StatusBadge';
import { errorMessage, useToast } from '@/components/toast';

const toInput = ({ id: _i, createdAt: _c, updatedAt: _u, rating: _r, reviewCount: _rc, bookingCount: _b, ...rest }: TravelPackage) => rest;

export default function Packages() {
  const q = usePackages();
  const dest = useDestinations();
  const ops = useOperators();
  const [status, setStatus] = useState<PackageStatus | 'all'>('all');
  const [text, setText] = useState('');
  const toast = useToast();
  const save = useSave(({ p, patch }: { p: TravelPackage; patch: Partial<TravelPackage> }) => api.savePackage({ ...toInput(p), ...patch }, p.id), ['packages', 'package', 'stats']);
  const duplicate = useSave((p: TravelPackage) => api.savePackage({ ...toInput(p), title: `${p.title} (copy)`, slug: `${p.slug}-copy-${Date.now().toString(36)}`, status: 'draft', isFeatured: false }), ['packages']);

  const destName = useMemo(() => new Map((dest.data ?? []).map((d) => [d.id, d.name])), [dest.data]);
  const opName = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o.businessName])), [ops.data]);
  const all = q.data ?? [];
  const list = all.filter(
    (p) => (status === 'all' || p.status === status) && (!text || `${p.title} ${destName.get(p.destinationId) ?? ''} ${opName.get(p.operatorId) ?? ''}`.toLowerCase().includes(text.toLowerCase())),
  );

  const patch = async (p: TravelPackage, change: Partial<TravelPackage>, msg: string) => {
    try {
      await save.mutateAsync({ p, patch: change });
      toast('success', msg);
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle={`${all.filter((p) => p.status === 'published').length} published of ${all.length}`}
        actions={
          <Link href="/packages/edit/">
            <Button icon={<Plus className="h-4 w-4" />}>New package</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[{ value: 'all', label: 'All', count: all.length }, ...PACKAGE_STATUSES.map((s) => ({ value: s, label: PACKAGE_STATUS_LABELS[s], count: all.filter((p) => p.status === s).length }))]}
        />
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search packages" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <div className="card overflow-hidden">
        {q.isLoading ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="No packages" message="Create your first package to list it in the app." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="th">Package</th>
                  <th className="th">Operator</th>
                  <th className="th">Price / person</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-cream/60">
                    <td className="td">
                      <Link href={`/packages/edit/?id=${p.id}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0]?.url} alt="" className="h-12 w-16 shrink-0 rounded-lg bg-sand-soft object-cover" />
                        <span>
                          <span className="block font-semibold text-ink hover:text-emerald">{p.title}</span>
                          <span className="block text-xs text-muted">
                            {destName.get(p.destinationId) ?? '—'} · {formatDuration(p.durationDays, p.durationNights)} · {p.bookingCount} bookings
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="td text-ink-soft">{opName.get(p.operatorId) ?? '—'}</td>
                    <td className="td">
                      <span className="font-semibold">{formatINR(effectivePrice(p))}</span>
                      {p.discountPercent > 0 && <span className="ml-1.5 text-xs text-gold">−{p.discountPercent}%</span>}
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        <PackageBadge s={p.status} />
                        {p.isFeatured && <Badge tone="gold">Featured</Badge>}
                        {p.isTrending && <Badge tone="sand">Trending</Badge>}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" kind="outline" title={p.isFeatured ? 'Unfeature' : 'Feature'} icon={<Star className={`h-3.5 w-3.5 ${p.isFeatured ? 'fill-gold text-gold' : ''}`} />} onClick={() => patch(p, { isFeatured: !p.isFeatured }, p.isFeatured ? 'Removed from featured' : 'Marked as featured')} />
                        {p.status === 'published' ? (
                          <Button size="sm" kind="outline" icon={<EyeOff className="h-3.5 w-3.5" />} onClick={() => patch(p, { status: 'unpublished' }, 'Unpublished — hidden from the app')}>
                            Unpublish
                          </Button>
                        ) : (
                          <Button size="sm" kind="secondary" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => patch(p, { status: 'published' }, 'Published — now live in the app')}>
                            Publish
                          </Button>
                        )}
                        <Button size="sm" kind="ghost" title="Duplicate" icon={<Copy className="h-3.5 w-3.5" />} onClick={async () => { try { await duplicate.mutateAsync(p); toast('success', 'Duplicated as draft'); } catch (e) { toast('error', errorMessage(e)); } }} />
                        <Link href={`/packages/edit/?id=${p.id}`}>
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
