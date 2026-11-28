'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  DISTRICTS,
  discountedPrice,
  formatINR,
  packageSchema,
  PACKAGE_CATEGORIES,
  PACKAGE_CATEGORY_LABELS,
  PACKAGE_STATUSES,
  PACKAGE_STATUS_LABELS,
  slugify,
  uuid,
  VEHICLE_CATEGORIES,
  VEHICLE_CATEGORY_LABELS,
  type District,
  type PackageInput,
} from '@travo/core';
import { api } from '@/lib/data';
import { useDestinations, useOperators, usePackage, useSave } from '@/lib/queries';
import { Button, ErrorState, Field, PageHeader, TableSkeleton, Toggle } from '@/components/ui';
import { Grid, numberValue, SaveBar, Section } from '@/components/FormBits';
import { ImageManager } from '@/components/ImageManager';
import { ChipSelect, ListEditor } from '@/components/ListEditor';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = z.input<typeof packageSchema>;

const EMPTY: Form = {
  slug: '',
  title: '',
  summary: '',
  description: '',
  destinationId: '',
  additionalDestinationIds: [],
  operatorId: '',
  categories: [],
  tripType: 'private',
  durationDays: 1,
  durationNights: 0,
  basePrice: 0,
  discountPercent: 0,
  minGroupSize: 1,
  maxGroupSize: 10,
  vehicleCategory: 'muv',
  transportDetails: '',
  accommodation: '',
  pickupPoints: [],
  dropPoints: [],
  pickupDistricts: [],
  inclusions: [],
  exclusions: [],
  cancellationPolicy: 'Free cancellation up to 7 days before travel. 50% refund between 7 and 3 days. No refund within 72 hours of departure.',
  images: [],
  itinerary: [{ id: uuid(), dayNumber: 1, title: '', description: '', meals: [], stay: null }],
  availableDates: [],
  status: 'draft',
  isFeatured: false,
  isTrending: false,
};

function Editor() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const existing = usePackage(id);
  const dest = useDestinations();
  const ops = useOperators();
  const save = useSave((v: PackageInput) => api.savePackage(v, id ?? undefined), ['packages', 'package', 'stats']);
  const del = useSave(() => api.deletePackage(id!), ['packages', 'stats']);

  const form = useForm<Form>({ resolver: zodResolver(packageSchema), defaultValues: EMPTY });
  const { register, control, handleSubmit, watch, setValue, reset, formState } = form;
  const days = useFieldArray({ control, name: 'itinerary' });
  const err = formState.errors;

  useEffect(() => {
    if (existing.data) {
      const { id: _i, createdAt: _c, updatedAt: _u, rating: _r, reviewCount: _rc, bookingCount: _b, ...rest } = existing.data;
      reset(rest);
    }
  }, [existing.data, reset]);

  const title = watch('title');
  const slugTouched = formState.dirtyFields.slug;
  useEffect(() => {
    if (!id && !slugTouched) setValue('slug', slugify(title));
  }, [title, id, slugTouched, setValue]);

  const price = watch('basePrice');
  const discount = watch('discountPercent');
  const final = useMemo(() => discountedPrice(Number(price) || 0, Number(discount) || 0), [price, discount]);

  const submit = (status?: Form['status']) =>
    handleSubmit(async (values) => {
      try {
        const parsed = packageSchema.parse({ ...values, status: status ?? values.status, itinerary: values.itinerary.map((d, i) => ({ ...d, dayNumber: i + 1 })) }) as PackageInput;
        const saved = await save.mutateAsync(parsed);
        toast('success', parsed.status === 'published' ? 'Saved — live in the app' : 'Saved');
        if (!id) router.replace(`/packages/edit/?id=${saved.id}`);
        else reset(values);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    }, () => toast('error', 'Please fix the highlighted fields'))();

  if (id && existing.isLoading) return <TableSkeleton rows={10} />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={() => existing.refetch()} />;
  if (id && !existing.data) return <ErrorState error={new Error('Package not found')} />;

  const destinations = dest.data ?? [];
  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Link href="/packages/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Packages
      </Link>
      <PageHeader title={id ? existing.data!.title : 'New package'} subtitle={id ? `${existing.data!.bookingCount} bookings · rating ${existing.data!.rating || '—'}` : 'Draft until you publish'} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basics">
            <Field label="Package title" error={err.title?.message}>
              <input className="input" {...register('title')} placeholder="e.g. Munnar Weekend Escape" />
            </Field>
            <Field label="URL slug" error={err.slug?.message} hint="Used in links; lowercase and dashes">
              <input className="input font-mono text-xs" {...register('slug')} />
            </Field>
            <Field label="Summary" error={err.summary?.message} hint="One line shown on cards">
              <input className="input" {...register('summary')} />
            </Field>
            <Field label="Description" error={err.description?.message}>
              <textarea className="input min-h-[120px]" {...register('description')} />
            </Field>
          </Section>

          <Section title="Photos" description="The first photo is the cover. Upload JPG/PNG/WebP or paste a link.">
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageManager
                  folder="packages"
                  value={field.value.map((i) => i.url)}
                  onChange={(urls) => field.onChange(urls.map((url, i) => ({ id: field.value.find((x) => x.url === url)?.id ?? uuid(), url, caption: null, sortOrder: i })))}
                />
              )}
            />
            {err.images && <p className="text-xs text-danger">{err.images.message}</p>}
          </Section>

          <Section title="Day-wise itinerary">
            {days.fields.map((d, i) => (
              <div key={d.id} className="rounded-xl border border-line p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-forest">Day {i + 1}</span>
                  {days.fields.length > 1 && (
                    <Button size="sm" kind="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => days.remove(i)}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <Field label="Title" error={err.itinerary?.[i]?.title?.message}>
                    <input className="input" {...register(`itinerary.${i}.title`)} />
                  </Field>
                  <Field label="Plan for the day" error={err.itinerary?.[i]?.description?.message}>
                    <textarea className="input min-h-[80px]" {...register(`itinerary.${i}.description`)} />
                  </Field>
                  <Grid>
                    <Field label="Meals">
                      <Controller control={control} name={`itinerary.${i}.meals`} render={({ field }) => <ChipSelect options={['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const} labels={{ Breakfast: 'Breakfast', Lunch: 'Lunch', Snacks: 'Snacks', Dinner: 'Dinner' }} value={field.value as ('Breakfast' | 'Lunch' | 'Snacks' | 'Dinner')[]} onChange={field.onChange} />} />
                    </Field>
                    <Field label="Overnight stay">
                      <input className="input" {...register(`itinerary.${i}.stay`, { setValueAs: (v) => (v ? v : null) })} placeholder="e.g. Valley-view resort" />
                    </Field>
                  </Grid>
                </div>
              </div>
            ))}
            <Button kind="outline" icon={<Plus className="h-4 w-4" />} onClick={() => days.append({ id: uuid(), dayNumber: days.fields.length + 1, title: '', description: '', meals: [], stay: null })}>
              Add day
            </Button>
          </Section>

          <Section title="Inclusions & exclusions">
            <Field label="Included">
              <Controller control={control} name="inclusions" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Breakfast and dinner" />} />
            </Field>
            <Field label="Not included">
              <Controller control={control} name="exclusions" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Entry tickets" />} />
            </Field>
            <Field label="Cancellation policy" error={err.cancellationPolicy?.message}>
              <textarea className="input min-h-[80px]" {...register('cancellationPolicy')} />
            </Field>
          </Section>

          <Section title="Pickup, transport & stay">
            <Field label="Pickup points" error={err.pickupPoints?.message}>
              <Controller control={control} name="pickupPoints" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Kochi — Vyttila Hub" />} />
            </Field>
            <Field label="Drop-off points">
              <Controller control={control} name="dropPoints" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Kochi airport" />} />
            </Field>
            <Field label="Pickup districts (for search filters)">
              <Controller control={control} name="pickupDistricts" render={({ field }) => <ChipSelect options={DISTRICTS} labels={Object.fromEntries(DISTRICTS.map((d) => [d, d])) as Record<District, string>} value={field.value} onChange={field.onChange} />} />
            </Field>
            <Grid>
              <Field label="Transport details">
                <input className="input" {...register('transportDetails')} />
              </Field>
              <Field label="Accommodation">
                <input className="input" {...register('accommodation')} />
              </Field>
            </Grid>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Publishing">
            <Field label="Status">
              <select className="input" {...register('status')}>
                {PACKAGE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PACKAGE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Controller control={control} name="isFeatured" render={({ field }) => <Toggle label="Featured" hint="Shown first on the home screen" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="isTrending" render={({ field }) => <Toggle label="Trending" checked={field.value} onChange={field.onChange} />} />
          </Section>

          <Section title="Pricing">
            <Grid>
              <Field label="Base price (₹ / person)" error={err.basePrice?.message}>
                <input className="input" type="number" min={0} step={1} {...register('basePrice', numberValue)} />
              </Field>
              <Field label="Discount %" error={err.discountPercent?.message}>
                <input className="input" type="number" min={0} max={90} {...register('discountPercent', numberValue)} />
              </Field>
            </Grid>
            <p className="rounded-lg bg-emerald-soft px-3 py-2 text-sm text-forest">
              Travellers see <strong>{formatINR(final)}</strong> per person{Number(discount) > 0 ? ` (was ${formatINR(Number(price) || 0)})` : ''}.
            </p>
          </Section>

          <Section title="Destination & operator">
            <Field label="Main destination" error={err.destinationId?.message}>
              <select className="input" {...register('destinationId')}>
                <option value="">Select…</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Also visits">
              <Controller
                control={control}
                name="additionalDestinationIds"
                render={({ field }) => (
                  <select multiple className="input h-28" value={field.value} onChange={(e) => field.onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>
            <Field label="Operator / agency" error={err.operatorId?.message}>
              <select className="input" {...register('operatorId')}>
                <option value="">Select…</option>
                {(ops.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.businessName}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="Trip setup">
            <Field label="Categories" error={err.categories?.message}>
              <Controller control={control} name="categories" render={({ field }) => <ChipSelect options={PACKAGE_CATEGORIES} labels={PACKAGE_CATEGORY_LABELS} value={field.value} onChange={field.onChange} />} />
            </Field>
            <Grid>
              <Field label="Trip type">
                <select className="input" {...register('tripType')}>
                  <option value="private">Private</option>
                  <option value="group">Group</option>
                </select>
              </Field>
              <Field label="Vehicle">
                <select className="input" {...register('vehicleCategory')}>
                  {VEHICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {VEHICLE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Days" error={err.durationDays?.message}>
                <input className="input" type="number" min={1} {...register('durationDays', numberValue)} />
              </Field>
              <Field label="Nights" error={err.durationNights?.message}>
                <input className="input" type="number" min={0} {...register('durationNights', numberValue)} />
              </Field>
              <Field label="Min group" error={err.minGroupSize?.message}>
                <input className="input" type="number" min={1} {...register('minGroupSize', numberValue)} />
              </Field>
              <Field label="Max group size" error={err.maxGroupSize?.message}>
                <input className="input" type="number" min={1} {...register('maxGroupSize', numberValue)} />
              </Field>
            </Grid>
            <Field label="Fixed available dates" hint="Leave empty if it runs on request any day">
              <Controller
                control={control}
                name="availableDates"
                render={({ field }) => (
                  <div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {field.value.map((d) => (
                        <button key={d} type="button" onClick={() => field.onChange(field.value.filter((x) => x !== d))} className="rounded-md bg-emerald-soft px-2 py-0.5 text-xs text-forest" title="Remove">
                          {d} ×
                        </button>
                      ))}
                    </div>
                    <input className="input" type="date" onChange={(e) => e.target.value && !field.value.includes(e.target.value) && field.onChange([...field.value, e.target.value].sort())} />
                  </div>
                )}
              />
            </Field>
          </Section>
        </div>
      </div>

      <SaveBar dirty={formState.isDirty}>
        {id && <DeleteButton size="md" what="package" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/packages/'); }} />}
        {id && existing.data?.status !== 'archived' && (
          <Button kind="outline" onClick={() => void submit('archived')}>
            Archive
          </Button>
        )}
        <Button kind="outline" loading={save.isPending} onClick={() => void submit()}>
          Save
        </Button>
        <Button loading={save.isPending} onClick={() => void submit('published')}>
          Save & publish
        </Button>
      </SaveBar>
    </form>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Editor />
    </Suspense>
  );
}
