'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { destinationSchema, DISTRICTS, slugify, type DestinationInput } from '@travo/core';
import { api } from '@/lib/data';
import { useDestination, usePackages, useSave } from '@/lib/queries';
import { Button, ErrorState, Field, PageHeader, TableSkeleton, Toggle } from '@/components/ui';
import { Grid, SaveBar, Section } from '@/components/FormBits';
import { ImageManager } from '@/components/ImageManager';
import { ListEditor } from '@/components/ListEditor';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = z.input<typeof destinationSchema>;
const coord = { setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)) };

function Editor() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const d = useDestination(id);
  const packages = usePackages(id ? { destinationId: id } : { destinationId: '__none__' });
  const save = useSave((v: DestinationInput) => api.saveDestination(v, id ?? undefined), ['destinations', 'destination', 'stats']);
  const del = useSave(() => api.deleteDestination(id!), ['destinations', 'stats']);
  const { register, control, handleSubmit, reset, watch, setValue, formState } = useForm<Form>({
    resolver: zodResolver(destinationSchema),
    defaultValues: { slug: '', name: '', district: 'Idukki', tagline: '', description: '', coverImage: '', gallery: [], attractions: [], bestExperiences: [], bestTimeToVisit: '', isFeatured: false, isActive: true, latitude: null, longitude: null },
  });
  const attractions = useFieldArray({ control, name: 'attractions' });
  const err = formState.errors;
  useEffect(() => {
    if (d.data) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = d.data;
      reset(rest);
    }
  }, [d.data, reset]);
  const name = watch('name');
  useEffect(() => {
    if (!id && !formState.dirtyFields.slug) setValue('slug', slugify(name));
  }, [name, id, formState.dirtyFields.slug, setValue]);

  const submit = handleSubmit(
    async (values) => {
      try {
        const saved = await save.mutateAsync(destinationSchema.parse(values) as DestinationInput);
        toast('success', 'Destination saved — app updated');
        if (!id) router.replace(`/destinations/edit/?id=${saved.id}`);
        else reset(values);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    },
    () => toast('error', 'Please fix the highlighted fields'),
  );

  if (id && d.isLoading) return <TableSkeleton rows={8} />;
  if (d.error) return <ErrorState error={d.error} />;
  if (id && !d.data) return <ErrorState error={new Error('Destination not found')} />;

  return (
    <form onSubmit={(e) => (e.preventDefault(), void submit())}>
      <Link href="/destinations/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Destinations
      </Link>
      <PageHeader title={id ? d.data!.name : 'New destination'} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="About">
            <Grid>
              <Field label="Name" error={err.name?.message}>
                <input className="input" {...register('name')} />
              </Field>
              <Field label="District">
                <select className="input" {...register('district')}>
                  {DISTRICTS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            </Grid>
            <Field label="URL slug" error={err.slug?.message}>
              <input className="input font-mono text-xs" {...register('slug')} />
            </Field>
            <Field label="Tagline" error={err.tagline?.message}>
              <input className="input" {...register('tagline')} />
            </Field>
            <Field label="Description" error={err.description?.message}>
              <textarea className="input min-h-[120px]" {...register('description')} />
            </Field>
            <Field label="Best time to visit">
              <input className="input" {...register('bestTimeToVisit')} placeholder="e.g. September to March" />
            </Field>
          </Section>
          <Section title="Cover photo">
            <Controller control={control} name="coverImage" render={({ field }) => <ImageManager single folder="destinations" value={field.value ? [field.value] : []} onChange={(u) => field.onChange(u[0] ?? '')} />} />
            {err.coverImage && <p className="text-xs text-danger">{err.coverImage.message}</p>}
          </Section>
          <Section title="Gallery">
            <Controller control={control} name="gallery" render={({ field }) => <ImageManager folder="destinations" value={field.value} onChange={field.onChange} />} />
          </Section>
          <Section title="Attractions">
            {attractions.fields.map((a, i) => (
              <div key={a.id} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_2fr_auto]">
                <input className="input" placeholder="Name" {...register(`attractions.${i}.name`)} />
                <input className="input" placeholder="Short description" {...register(`attractions.${i}.description`)} />
                <Button kind="ghost" aria-label="Remove attraction" icon={<Trash2 className="h-4 w-4" />} onClick={() => attractions.remove(i)} />
              </div>
            ))}
            <Button kind="outline" icon={<Plus className="h-4 w-4" />} onClick={() => attractions.append({ name: '', description: '' })}>
              Add attraction
            </Button>
            <Field label="Best experiences">
              <Controller control={control} name="bestExperiences" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="e.g. Sunrise trek" />} />
            </Field>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Visibility">
            <Controller control={control} name="isActive" render={({ field }) => <Toggle label="Visible in app" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="isFeatured" render={({ field }) => <Toggle label="Featured on home screen" checked={field.value} onChange={field.onChange} />} />
          </Section>
          <Section title="Map location" description="Used for future Google Maps integration">
            <Grid>
              <Field label="Latitude">
                <input className="input" type="number" step="any" {...register('latitude', coord)} />
              </Field>
              <Field label="Longitude">
                <input className="input" type="number" step="any" {...register('longitude', coord)} />
              </Field>
            </Grid>
          </Section>
          {id && (
            <Section title={`Packages here · ${packages.data?.length ?? 0}`}>
              <ul className="space-y-1 text-sm">
                {(packages.data ?? []).map((p) => (
                  <li key={p.id}>
                    <Link href={`/packages/edit/?id=${p.id}`} className="text-emerald hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
      <SaveBar dirty={formState.isDirty}>
        {id && <DeleteButton size="md" what="destination" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/destinations/'); }} />}
        <Button loading={save.isPending} onClick={() => void submit()}>
          Save destination
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
