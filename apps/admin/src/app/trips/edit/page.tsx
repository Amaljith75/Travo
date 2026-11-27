'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import {
  addDays,
  DISTRICTS,
  effectivePrice,
  formatDate,
  formatINR,
  todayISO,
  TRIP_STATUSES,
  TRIP_STATUS_LABELS,
  tripSchema,
  VEHICLE_CATEGORY_LABELS,
  type ScheduledTripInput,
} from '@travo/core';
import { api } from '@/lib/data';
import { useBookings, useDestinations, useOperators, usePackages, useSave, useTrip, useVehicles } from '@/lib/queries';
import { Button, Card, ErrorState, Field, PageHeader, TableSkeleton } from '@/components/ui';
import { Grid, numberValue, SaveBar, Section } from '@/components/FormBits';
import { BookingBadge } from '@/components/StatusBadge';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = z.input<typeof tripSchema>;

function Editor() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const trip = useTrip(id);
  const packages = usePackages();
  const dest = useDestinations();
  const ops = useOperators();
  const vehicles = useVehicles();
  const passengers = useBookings(id ? { scheduledTripId: id } : { scheduledTripId: '__none__' });
  const save = useSave((v: ScheduledTripInput) => api.saveTrip(v, id ?? undefined), ['trips', 'trip', 'stats']);
  const del = useSave(() => api.deleteTrip(id!), ['trips', 'stats']);

  const start = addDays(todayISO(), 7);
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<Form>({
    resolver: zodResolver(tripSchema),
    defaultValues: { packageId: null, title: '', operatorId: '', vehicleId: null, destinationId: '', departureDate: start, returnDate: addDays(start, 1), departureTime: '06:00', departureLocation: '', departureDistrict: 'Ernakulam', totalSeats: 12, seatsBooked: 0, pricePerPerson: 0, status: 'open', notes: '' },
  });
  const err = formState.errors;
  useEffect(() => {
    if (trip.data) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = trip.data;
      reset(rest);
    }
  }, [trip.data, reset]);

  /** Use an existing package as a template for a new departure. */
  const applyTemplate = (pid: string) => {
    const p = packages.data?.find((x) => x.id === pid);
    setValue('packageId', pid || null, { shouldDirty: true });
    if (!p) return;
    setValue('title', p.title, { shouldDirty: true });
    setValue('destinationId', p.destinationId);
    setValue('operatorId', p.operatorId);
    setValue('pricePerPerson', effectivePrice(p));
    setValue('totalSeats', p.maxGroupSize);
    setValue('departureLocation', p.pickupPoints[0] ?? '');
    if (p.pickupDistricts[0]) setValue('departureDistrict', p.pickupDistricts[0]);
    setValue('returnDate', addDays(watch('departureDate'), Math.max(0, p.durationDays - 1)));
  };

  const operatorId = watch('operatorId');
  const fleet = (vehicles.data ?? []).filter((v) => !operatorId || v.operatorId === operatorId);

  const submit = handleSubmit(
    async (values) => {
      try {
        const saved = await save.mutateAsync(tripSchema.parse(values) as ScheduledTripInput);
        toast('success', 'Trip saved — app updated');
        if (!id) router.replace(`/trips/edit/?id=${saved.id}`);
        else reset(values);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    },
    () => toast('error', 'Please fix the highlighted fields'),
  );

  if (id && trip.isLoading) return <TableSkeleton rows={8} />;
  if (trip.error) return <ErrorState error={trip.error} />;
  if (id && !trip.data) return <ErrorState error={new Error('Trip not found')} />;

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Link href="/trips/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Scheduled trips
      </Link>
      <PageHeader title={id ? trip.data!.title : 'New scheduled trip'} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Trip">
            <Field label="Package template" hint="Prefills title, destination, operator, price and seats">
              <select className="input" value={watch('packageId') ?? ''} onChange={(e) => applyTemplate(e.target.value)}>
                <option value="">No package (custom departure)</option>
                {(packages.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title" error={err.title?.message}>
              <input className="input" {...register('title')} />
            </Field>
            <Grid>
              <Field label="Destination" error={err.destinationId?.message}>
                <select className="input" {...register('destinationId')}>
                  <option value="">Select…</option>
                  {(dest.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Operator" error={err.operatorId?.message}>
                <select className="input" {...register('operatorId')}>
                  <option value="">Select…</option>
                  {(ops.data ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.businessName}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid>
            <Field label="Assigned vehicle">
              <select className="input" {...register('vehicleId', { setValueAs: (v) => v || null })}>
                <option value="">Not assigned yet</option>
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {VEHICLE_CATEGORY_LABELS[v.category]} · {v.seatingCapacity} seats
                  </option>
                ))}
              </select>
            </Field>
          </Section>
          <Section title="Departure">
            <Grid cols={3}>
              <Field label="Departure date" error={err.departureDate?.message}>
                <input className="input" type="date" {...register('departureDate')} />
              </Field>
              <Field label="Return date" error={err.returnDate?.message}>
                <input className="input" type="date" {...register('returnDate')} />
              </Field>
              <Field label="Time" error={err.departureTime?.message}>
                <input className="input" type="time" {...register('departureTime')} />
              </Field>
            </Grid>
            <Grid>
              <Field label="Departure point" error={err.departureLocation?.message}>
                <input className="input" {...register('departureLocation')} placeholder="e.g. Kochi — Vyttila Hub" />
              </Field>
              <Field label="Departure district">
                <select className="input" {...register('departureDistrict')}>
                  {DISTRICTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
            </Grid>
            <Field label="Notes for travellers">
              <textarea className="input" {...register('notes')} />
            </Field>
          </Section>
          {id && (
            <Card title={`Passenger enquiries · ${passengers.data?.length ?? 0}`}>
              {(passengers.data ?? []).length === 0 ? (
                <p className="text-sm text-muted">No booking requests for this departure yet.</p>
              ) : (
                <ul className="divide-y divide-line/70">
                  {passengers.data!.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <Link href={`/bookings/view/?id=${b.id}`} className="hover:text-emerald">
                        <span className="font-semibold">{b.contactName}</span> · {b.adults + b.children} pax · {b.contactPhone}
                        <span className="block text-xs text-muted">
                          {b.reference} · {formatDate(b.createdAt.slice(0, 10))}
                        </span>
                      </Link>
                      <BookingBadge s={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Section title="Seats & price">
            <Grid>
              <Field label="Total seats" error={err.totalSeats?.message}>
                <input className="input" type="number" min={1} {...register('totalSeats', numberValue)} />
              </Field>
              <Field label="Seats booked" error={err.seatsBooked?.message} hint="Updates automatically on confirm">
                <input className="input" type="number" min={0} {...register('seatsBooked', numberValue)} />
              </Field>
            </Grid>
            <Field label="Price per person (₹)" error={err.pricePerPerson?.message}>
              <input className="input" type="number" min={0} {...register('pricePerPerson', numberValue)} />
            </Field>
            <p className="text-sm text-muted">
              Available: <strong className="text-ink">{Math.max(0, Number(watch('totalSeats')) - Number(watch('seatsBooked')))}</strong> seats · {formatINR(Number(watch('pricePerPerson')) || 0)}/person
            </p>
          </Section>
          <Section title="Status">
            <select className="input" {...register('status')}>
              {TRIP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TRIP_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Section>
        </div>
      </div>
      <SaveBar dirty={formState.isDirty}>
        {id && <DeleteButton size="md" what="trip" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/trips/'); }} />}
        <Button loading={save.isPending} onClick={() => void submit()}>
          Save trip
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
