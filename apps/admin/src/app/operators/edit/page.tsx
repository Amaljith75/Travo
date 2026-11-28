'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { DISTRICTS, formatDate, formatINR, OPERATOR_TYPES, OPERATOR_TYPE_LABELS, operatorSchema, slugify, VERIFICATION_LABELS, VERIFICATION_STATUSES, type OperatorInput } from '@travo/core';
import { api } from '@/lib/data';
import { useBookings, useOperator, usePackages, useSave, useVehicles } from '@/lib/queries';
import { Button, Card, ErrorState, Field, PageHeader, TableSkeleton, Toggle } from '@/components/ui';
import { Grid, numberValue, SaveBar, Section } from '@/components/FormBits';
import { ImageManager } from '@/components/ImageManager';
import { BookingBadge, ListingBadge, PackageBadge } from '@/components/StatusBadge';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = z.input<typeof operatorSchema>;

function Editor() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const op = useOperator(id);
  const packages = usePackages(id ? { operatorId: id } : { operatorId: '__none__' });
  const vehicles = useVehicles(id ? { operatorId: id } : { operatorId: '__none__' });
  const bookings = useBookings(id ? { operatorId: id } : { operatorId: '__none__' });
  const save = useSave((v: OperatorInput) => api.saveOperator(v, id ?? undefined), ['operators', 'operator', 'stats']);
  const del = useSave(() => api.deleteOperator(id!), ['operators', 'stats']);
  const { register, control, handleSubmit, reset, watch, setValue, formState } = useForm<Form>({
    resolver: zodResolver(operatorSchema),
    defaultValues: { slug: '', businessName: '', type: 'travel_agency', contactName: '', phone: '', whatsapp: '', email: '', district: 'Ernakulam', address: '', description: '', logo: null, verificationStatus: 'pending', yearsInBusiness: 0, isDemo: false },
  });
  const err = formState.errors;
  useEffect(() => {
    if (op.data) {
      const { id: _i, createdAt: _c, updatedAt: _u, rating: _r, reviewCount: _rc, ...rest } = op.data;
      reset(rest);
    }
  }, [op.data, reset]);
  const name = watch('businessName');
  useEffect(() => {
    if (!id && !formState.dirtyFields.slug) setValue('slug', slugify(name));
  }, [name, id, formState.dirtyFields.slug, setValue]);

  const submit = handleSubmit(
    async (values) => {
      try {
        const saved = await save.mutateAsync(operatorSchema.parse(values) as OperatorInput);
        toast('success', 'Operator saved');
        if (!id) router.replace(`/operators/edit/?id=${saved.id}`);
        else reset(values);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    },
    () => toast('error', 'Please fix the highlighted fields'),
  );

  if (id && op.isLoading) return <TableSkeleton rows={8} />;
  if (op.error) return <ErrorState error={op.error} />;
  if (id && !op.data) return <ErrorState error={new Error('Operator not found')} />;
  const revenue = (bookings.data ?? []).filter((b) => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + b.estimatedTotal, 0);

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Link href="/operators/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Operators
      </Link>
      <PageHeader title={id ? op.data!.businessName : 'Add operator'} subtitle={id ? `Rating ${op.data!.rating || '—'} · ${op.data!.reviewCount} reviews · ${formatINR(revenue)} confirmed bookings` : undefined} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Business">
            <Grid>
              <Field label="Business name" error={err.businessName?.message}>
                <input className="input" {...register('businessName')} />
              </Field>
              <Field label="Operator type">
                <select className="input" {...register('type')}>
                  {OPERATOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {OPERATOR_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid>
            <Field label="URL slug" error={err.slug?.message}>
              <input className="input font-mono text-xs" {...register('slug')} />
            </Field>
            <Field label="Description">
              <textarea className="input min-h-[90px]" {...register('description')} />
            </Field>
            <Grid>
              <Field label="District">
                <select className="input" {...register('district')}>
                  {DISTRICTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Years in business">
                <input className="input" type="number" min={0} {...register('yearsInBusiness', numberValue)} />
              </Field>
            </Grid>
            <Field label="Address">
              <input className="input" {...register('address')} />
            </Field>
          </Section>
          <Section title="Contact">
            <Grid>
              <Field label="Contact person" error={err.contactName?.message}>
                <input className="input" {...register('contactName')} />
              </Field>
              <Field label="Email" error={err.email?.message}>
                <input className="input" type="email" {...register('email')} />
              </Field>
              <Field label="Phone" error={err.phone?.message}>
                <input className="input" {...register('phone')} />
              </Field>
              <Field label="WhatsApp" error={err.whatsapp?.message} hint="Travellers tap to message this number">
                <input className="input" {...register('whatsapp')} />
              </Field>
            </Grid>
          </Section>
          {id && (
            <>
              <Card title={`Packages · ${packages.data?.length ?? 0}`}>
                <ul className="divide-y divide-line/70 text-sm">
                  {(packages.data ?? []).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2">
                      <Link href={`/packages/edit/?id=${p.id}`} className="hover:text-emerald">{p.title}</Link>
                      <PackageBadge s={p.status} />
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={`Vehicles · ${vehicles.data?.length ?? 0}`}>
                <ul className="divide-y divide-line/70 text-sm">
                  {(vehicles.data ?? []).map((v) => (
                    <li key={v.id} className="flex items-center justify-between py-2">
                      <Link href={`/vehicles/edit/?id=${v.id}`} className="hover:text-emerald">{v.make} {v.model} · {v.seatingCapacity} seats</Link>
                      <ListingBadge s={v.listingStatus} />
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={`Booking history · ${bookings.data?.length ?? 0}`}>
                <ul className="divide-y divide-line/70 text-sm">
                  {(bookings.data ?? []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                      <Link href={`/bookings/view/?id=${b.id}`} className="hover:text-emerald">
                        {b.reference} · {b.contactName} · {formatDate(b.travelDate)}
                      </Link>
                      <BookingBadge s={b.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
        <div className="space-y-6">
          <Section title="Logo">
            <Controller control={control} name="logo" render={({ field }) => <ImageManager single folder="operators" value={field.value ? [field.value] : []} onChange={(u) => field.onChange(u[0] ?? null)} />} />
          </Section>
          <Section title="Verification">
            <select className="input" {...register('verificationStatus')}>
              {VERIFICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VERIFICATION_LABELS[s]}
                </option>
              ))}
            </select>
            <Controller control={control} name="isDemo" render={({ field }) => <Toggle label="Demo / sample operator" hint="App blocks WhatsApp & calls to demo numbers" checked={field.value} onChange={field.onChange} />} />
          </Section>
        </div>
      </div>
      <SaveBar dirty={formState.isDirty}>
        {id && <DeleteButton size="md" what="operator" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/operators/'); }} />}
        <Button loading={save.isPending} onClick={() => void submit()}>
          Save operator
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
