'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { DISTRICTS } from '@travo/core';
import { useDestinations, usePackages } from '@/lib/queries';
import { Badge, Button, EmptyState, ErrorState, PageHeader, TableSkeleton } from '@/components/ui';

export default function Destinations() {
  const q = useDestinations();
  const pk = usePackages();
  const [text, setText] = useState('');
  const [district, setDistrict] = useState('');
  const list = (q.data ?? []).filter((d) => (!district || d.district === district) && (!text || d.name.toLowerCase().includes(text.toLowerCase())));
  const count = (id: string) => (pk.data ?? []).filter((p) => p.destinationId === id || p.additionalDestinationIds.includes(id)).length;

  return (
    <>
      <PageHeader
        title="Destinations"
        subtitle={`${q.data?.length ?? 0} places across Kerala’s 14 districts`}
        actions={
          <Link href="/destinations/edit/">
            <Button icon={<Plus className="h-4 w-4" />}>New destination</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search destinations" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <select className="input w-full sm:w-56" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District">
          <option value="">All districts</option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      {q.isLoading ? (
        <TableSkeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No destinations" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((d) => (
            <Link key={d.id} href={`/destinations/edit/?id=${d.id}`} className="card group overflow-hidden transition hover:border-emerald">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.coverImage} alt={d.name} className="aspect-[4/3] w-full bg-sand-soft object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold group-hover:text-emerald">{d.name}</p>
                  <div className="flex gap-1">
                    {d.isFeatured && <Badge tone="gold">Featured</Badge>}
                    {!d.isActive && <Badge tone="grey">Hidden</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {d.district} · {count(d.id)} packages · {d.gallery.length + 1} photos
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
