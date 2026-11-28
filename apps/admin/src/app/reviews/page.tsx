'use client';

import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { REVIEW_STATUSES, REVIEW_STATUS_LABELS, timeAgo, type ReviewStatus } from '@travo/core';
import { api } from '@/lib/data';
import { useOperators, usePackages, useReviews, useSave } from '@/lib/queries';
import { Button, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs } from '@/components/ui';
import { ReviewBadge } from '@/components/StatusBadge';
import { errorMessage, useToast } from '@/components/toast';

export default function Reviews() {
  const q = useReviews();
  const pk = usePackages();
  const ops = useOperators();
  const toast = useToast();
  const [tab, setTab] = useState<ReviewStatus | 'all'>('all');
  const set = useSave(({ id, s }: { id: string; s: ReviewStatus }) => api.updateReviewStatus(id, s), ['reviews']);
  const pkgName = useMemo(() => new Map((pk.data ?? []).map((p) => [p.id, p.title])), [pk.data]);
  const opName = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o.businessName])), [ops.data]);
  const all = q.data ?? [];
  const list = all.filter((r) => tab === 'all' || r.status === tab);
  const change = async (id: string, s: ReviewStatus) => {
    try {
      await set.mutateAsync({ id, s });
      toast('success', s === 'published' ? 'Review published' : 'Review hidden from the app');
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };
  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate what travellers see in the app" />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: all.length }, ...REVIEW_STATUSES.map((s) => ({ value: s, label: REVIEW_STATUS_LABELS[s], count: all.filter((r) => r.status === s).length }))]} />
      </div>
      {q.isLoading ? (
        <TableSkeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState title="No reviews here" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-0.5" aria-label={`${r.rating} stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-gold text-gold' : 'text-line'}`} />
                    ))}
                  </div>
                  <h3 className="mt-1 font-semibold">{r.title}</h3>
                </div>
                <ReviewBadge s={r.status} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">{r.body}</p>
              <p className="mt-3 text-xs text-muted">
                {r.authorName}, {r.authorCity} · {pkgName.get(r.packageId ?? '') ?? 'Vehicle'} · {opName.get(r.operatorId)} · {timeAgo(r.createdAt)}
              </p>
              <div className="mt-4 flex gap-2">
                {r.status !== 'published' && <Button size="sm" kind="secondary" onClick={() => change(r.id, 'published')}>Publish</Button>}
                {r.status !== 'hidden' && <Button size="sm" kind="outline" onClick={() => change(r.id, 'hidden')}>Hide</Button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
