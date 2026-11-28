'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import {
  DISTRICTS,
  LISTING_STATUS_LABELS,
  PRICING_UNITS,
  PRICING_UNIT_LABELS,
  uuid,
  vehicleSchema,
  VEHICLE_CATEGORIES,
  VEHICLE_CATEGORY_LABELS,
  VEHICLE_LISTING_STATUSES,
  type VehicleInput,
} from '@travo/core';
import { api } from '@/lib/data';
import { useOperators, useSave, useVehicle } from '@/lib/queries';
import { Button, ErrorState, Field, PageHeader, TableSkeleton, Toggle } from '@/components/ui';
import { Grid, numberValue, SaveBar, Section } from '@/components/FormBits';
import { ImageManager } from '@/components/ImageManager';
import { ListEditor } from '@/components/ListEditor';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = z.input<typeof vehicleSchema>;

function Editor() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const v = useVehicle(id);
  const ops = useOperators();
  const save = useSave((input: VehicleInput) => api.saveVehicle(input, id ?? undefined), ['vehicles', 'vehicle', 'stats']);
  const del = useSave(() => api.deleteVehicle(id!), ['vehicles', 'stats']);
  const { register, control, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      operatorId: '', title: '', make: '', model: '', year: new Date().getFullYear(), category: 'sedan', seatingCapacity: 4, luggageCapacity: '',
      isAc: true, driverIncluded: true, pricingUnit: 'per_km', price: 0, minimumCharge: 0, baseDistrict: 'Ernakulam', pickupLocation: '',
      amenities: [], description: '', images: [], isAvailable: true, listingStatus: 'approved', registrationVerified: false,
    },
  });
  const err = formState.errors;
  useEffect(() => {
    if (v.data) {
      const { id: _i, createdAt: _c, updatedAt: _u, rating: _r, reviewCount: _rc, ...rest } = v.data;
      reset(rest);
    }
  }, [v.data, reset]);

  const submit = handleSubmit(
    async (values) => {
      try {
        const saved = await save.mutateAsync(vehicleSchema.parse(values) as VehicleInput);
        toast('success', 'Vehicle saved — app updated');
        if (!id) router.replace(`/vehicles/edit/?id=${saved.id}`);
        else reset(values);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    },
    () => toast('error', 'Please fix the highlighted fields'),
  );

  if (id && v.isLoading) return <TableSkeleton rows={8} />;
  if (v.error) return <ErrorState error={v.error} />;
  if (id && !v.data) return <ErrorState error={new Error('Vehicle not found')} />;

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Link href="/vehicles/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Vehicles
      </Link>
      <PageHeader title={id ? `${v.data!.make} ${v.data!.model}` : 'Add vehicle'} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Vehicle">
            <Field label="Listing title" error={err.title?.message}>
              <input className="input" {...register('title')} placeholder="e.g. Toyota Innova Crysta — family tours" />
            </Field>
            <Grid cols={3}>
              <Field label="Make" error={err.make?.message}>
                <input className="input" {...register('make')} />
              </Field>
              <Field label="Model" error={err.model?.message}>
                <input className="input" {...register('model')} />
              </Field>
              <Field label="Year" error={err.year?.message}>
                <input className="input" type="number" {...register('year', numberValue)} />
              </Field>
            </Grid>
            <Grid cols={3}>
              <Field label="Category">
                <select className="input" {...register('category')}>
                  {VEHICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {VEHICLE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Seating capacity" error={err.seatingCapacity?.message}>
                <input className="input" type="number" min={1} {...register('seatingCapacity', numberValue)} />
              </Field>
              <Field label="Luggage">
                <input className="input" {...register('luggageCapacity')} placeholder="e.g. 4 large bags" />
              </Field>
            </Grid>
            <Field label="Description">
              <textarea className="input min-h-[90px]" {...register('description')} />
            </Field>
            <Field label="Amenities">
              <Controller control={control} name="amenities" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Push-back seats" />} />
            </Field>
          </Section>
          <Section title="Photos">
            <Controller
              control={control}
              name="images"
              render={({ field }) => <ImageManager folder="vehicles" value={field.value.map((i) => i.url)} onChange={(urls) => field.onChange(urls.map((url, i) => ({ id: field.value.find((x) => x.url === url)?.id ?? uuid(), url, sortOrder: i })))} />}
            />
            {err.images && <p className="text-xs text-danger">{err.images.message}</p>}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Owner & location">
            <Field label="Owner / operator" error={err.operatorId?.message}>
              <select className="input" {...register('operatorId')}>
                <option value="">Select…</option>
                {(ops.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.businessName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Base district">
              <select className="input" {...register('baseDistrict')}>
                {DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Pickup location" error={err.pickupLocation?.message}>
              <input className="input" {...register('pickupLocation')} />
            </Field>
          </Section>
          <Section title="Rental price">
            <Grid>
              <Field label="Price (₹)" error={err.price?.message}>
                <input className="input" type="number" min={0} {...register('price', numberValue)} />
              </Field>
              <Field label="Charged">
                <select className="input" {...register('pricingUnit')}>
                  {PRICING_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {PRICING_UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid>
            <Field label="Minimum charge (₹)">
              <input className="input" type="number" min={0} {...register('minimumCharge', numberValue)} />
            </Field>
            <Controller control={control} name="isAc" render={({ field }) => <Toggle label="Air-conditioned" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="driverIncluded" render={({ field }) => <Toggle label="Driver included" checked={field.value} onChange={field.onChange} />} />
          </Section>
          <Section title="Listing">
            <Field label="Approval status">
              <select className="input" {...register('listingStatus')}>
                {VEHICLE_LISTING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LISTING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Controller control={control} name="isAvailable" render={({ field }) => <Toggle label="Available for booking" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="registrationVerified" render={({ field }) => <Toggle label="Registration & permits verified" checked={field.value} onChange={field.onChange} />} />
          </Section>
        </div>
      </div>
      <SaveBar dirty={formState.isDirty}>
        {id && <DeleteButton size="md" what="vehicle" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/vehicles/'); }} />}
        <Button loading={save.isPending} onClick={() => void submit()}>
          Save vehicle
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
