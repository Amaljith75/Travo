'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { ArrowLeft, MessageCircle, Phone, Plus, Trash2 } from 'lucide-react';
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  formatDateTime,
  formatINR,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  uuid,
  whatsAppLink,
  type Booking,
  type BookingStatus,
  type BookingUpdate,
  type PaymentRecord,
} from '@travo/core';
import { api } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { useBooking, useOperator, usePackage, usePayments, useSave, useTrip } from '@/lib/queries';
import { Button, Card, ErrorState, Field, PageHeader, TableSkeleton } from '@/components/ui';
import { Grid, numberValue, SaveBar, Section } from '@/components/FormBits';
import { BookingBadge, PaymentBadge } from '@/components/StatusBadge';
import { PaymentModal } from '@/components/PaymentForm';
import { DeleteButton } from '@/components/RowActions';
import { errorMessage, useToast } from '@/components/toast';

type Form = Required<Omit<BookingUpdate, 'operatorId'>>;

function View() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const q = useBooking(id);
  const b = q.data;
  const pkg = usePackage(b?.packageId);
  const trip = useTrip(b?.scheduledTripId);
  const op = useOperator(b?.operatorId);
  const payments = usePayments(id ?? undefined);
  const [note, setNote] = useState('');
  const [payModal, setPayModal] = useState<{ open: boolean; payment: PaymentRecord | null }>({ open: false, payment: null });

  const update = useSave((patch: BookingUpdate) => api.updateBooking(id!, patch), ['bookings', 'booking', 'stats']);
  const setStatus = useSave((s: BookingStatus) => api.updateBookingStatus(id!, s), ['bookings', 'booking', 'stats', 'trips', 'trip']);
  const addNote = useSave((body: string) => api.addBookingNote(id!, body, user?.fullName ?? user?.email ?? 'Admin'), ['booking']);
  const delPayment = useSave((pid: string) => api.deletePayment(pid), ['payments']);
  const del = useSave(() => api.deleteBooking(id!), ['bookings', 'stats']);

  const { register, control, handleSubmit, reset, formState } = useForm<Form>();
  const pax = useFieldArray({ control, name: 'passengers' });
  useEffect(() => {
    if (b) reset(toForm(b));
  }, [b, reset]);

  const save = handleSubmit(async (v) => {
    if (!v.contactName?.trim() || !v.contactPhone?.trim()) return toast('error', 'Name and phone are required');
    if (v.adults < 1) return toast('error', 'At least one adult');
    try {
      await update.mutateAsync({ ...v, contactEmail: v.contactEmail || null, specialRequirements: v.specialRequirements || null, passengers: v.passengers.map((p) => ({ ...p, age: p.age ? Number(p.age) : null })) });
      toast('success', 'Booking updated');
    } catch (e) {
      toast('error', errorMessage(e));
    }
  });

  if (q.isLoading) return <TableSkeleton rows={8} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!b) return <ErrorState error={new Error('Booking not found')} />;

  const paid = (payments.data ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const changeStatus = async (s: BookingStatus) => {
    try {
      await setStatus.mutateAsync(s);
      toast('success', `Booking ${BOOKING_STATUS_LABELS[s].toLowerCase()}`);
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), void save())}>
      <Link href="/bookings/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Bookings
      </Link>
      <PageHeader
        title={b.reference}
        subtitle={`${pkg.data?.title ?? trip.data?.title ?? 'Custom trip'} · requested ${formatDateTime(b.createdAt)} via ${b.source}`}
        actions={<BookingBadge s={b.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Traveller & contact">
            <Grid>
              <Field label="Full name"><input className="input" {...register('contactName')} /></Field>
              <Field label="Phone"><input className="input" {...register('contactPhone')} /></Field>
              <Field label="Email"><input className="input" type="email" {...register('contactEmail')} /></Field>
              <Field label="Pickup location"><input className="input" {...register('pickupLocation')} /></Field>
            </Grid>
            <div className="flex flex-wrap gap-2">
              <a href={whatsAppLink(b.contactPhone, `Hi ${b.contactName}, this is Travo about your booking ${b.reference}.`)} target="_blank" rel="noreferrer">
                <Button kind="outline" size="sm" icon={<MessageCircle className="h-3.5 w-3.5" />}>WhatsApp traveller</Button>
              </a>
              <a href={`tel:${b.contactPhone.replace(/\s/g, '')}`}>
                <Button kind="outline" size="sm" icon={<Phone className="h-3.5 w-3.5" />}>Call</Button>
              </a>
            </div>
          </Section>
          <Section title="Trip details">
            <Grid cols={3}>
              <Field label="Travel date"><input className="input" type="date" {...register('travelDate')} /></Field>
              <Field label="Adults"><input className="input" type="number" min={1} {...register('adults', numberValue)} /></Field>
              <Field label="Children"><input className="input" type="number" min={0} {...register('children', numberValue)} /></Field>
              <Field label="Estimated total (₹)"><input className="input" type="number" min={0} {...register('estimatedTotal', numberValue)} /></Field>
              <Field label="Payment preference">
                <select className="input" {...register('preferredPaymentMethod')}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
                </select>
              </Field>
            </Grid>
            <Field label="Special requirements"><textarea className="input" {...register('specialRequirements')} /></Field>
          </Section>
          <Section title={`Passengers · ${pax.fields.length}`}>
            {pax.fields.map((p, i) => (
              <div key={p.id} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <input className="input" placeholder="Full name" {...register(`passengers.${i}.fullName`)} />
                <input className="input" type="number" placeholder="Age" {...register(`passengers.${i}.age`)} />
                <select className="input" {...register(`passengers.${i}.type`)}>
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
                <Button kind="ghost" aria-label="Remove passenger" icon={<Trash2 className="h-4 w-4" />} onClick={() => pax.remove(i)} />
              </div>
            ))}
            <Button kind="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => pax.append({ id: uuid(), fullName: '', age: null, type: 'adult' })}>Add passenger</Button>
          </Section>
          <Card title="Internal notes" className="">
            <ul className="mb-4 space-y-3">
              {b.internalNotes.length === 0 && <li className="text-sm text-muted">No notes yet. Notes are never shown to travellers.</li>}
              {b.internalNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-cream p-3 text-sm">
                  {n.body}
                  <span className="mt-1 block text-xs text-muted">{n.author} · {formatDateTime(n.createdAt)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note" />
              <Button
                kind="outline"
                loading={addNote.isPending}
                onClick={async () => {
                  if (!note.trim()) return;
                  try {
                    await addNote.mutateAsync(note.trim());
                    setNote('');
                  } catch (e) {
                    toast('error', errorMessage(e));
                  }
                }}
              >
                Add
              </Button>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Status">
            <div className="grid grid-cols-2 gap-2">
              {BOOKING_STATUSES.map((s) => (
                <Button key={s} kind={b.status === s ? 'primary' : 'outline'} size="sm" disabled={b.status === s} loading={setStatus.isPending && setStatus.variables === s} onClick={() => changeStatus(s)}>
                  {BOOKING_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            {trip.data && <p className="mt-3 text-xs text-muted">Confirming holds {b.adults + b.children} seats on “{trip.data.title}”.</p>}
          </Card>
          <Card title="Payments" action={<Button size="sm" kind="secondary" onClick={() => setPayModal({ open: true, payment: null })}>Record</Button>}>
            <p className="text-sm">
              <strong>{formatINR(paid)}</strong> paid of {formatINR(b.estimatedTotal)}
              <span className="ml-1 text-muted">· balance {formatINR(Math.max(0, b.estimatedTotal - paid))}</span>
            </p>
            <ul className="mt-3 divide-y divide-line/70">
              {(payments.data ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <button type="button" className="text-left hover:text-emerald" onClick={() => setPayModal({ open: true, payment: p })}>
                    {formatINR(p.amount)} · {PAYMENT_METHOD_LABELS[p.method]}
                    <span className="block text-xs text-muted">{p.providerReference ?? '—'} · {formatDateTime(p.createdAt)}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <PaymentBadge s={p.status} />
                    <button type="button" aria-label="Delete payment" className="rounded p-1 text-muted hover:text-danger" onClick={async () => { try { await delPayment.mutateAsync(p.id); toast('success', 'Payment removed'); } catch (e) { toast('error', errorMessage(e)); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Operator">
            {op.data ? (
              <Link href={`/operators/edit/?id=${op.data.id}`} className="text-sm hover:text-emerald">
                <strong>{op.data.businessName}</strong>
                <span className="block text-xs text-muted">{op.data.phone} · {op.data.email}</span>
              </Link>
            ) : (
              <p className="text-sm text-muted">—</p>
            )}
          </Card>
        </div>
      </div>
      <SaveBar dirty={formState.isDirty}>
        <DeleteButton size="md" what="booking" onConfirm={async () => { await del.mutateAsync(undefined); router.replace('/bookings/'); }} />
        <Button loading={update.isPending} onClick={() => void save()}>Save changes</Button>
      </SaveBar>
      <PaymentModal open={payModal.open} onClose={() => setPayModal({ open: false, payment: null })} booking={b} payment={payModal.payment} />
    </form>
  );
}

function toForm(b: Booking): Form {
  return {
    travelDate: b.travelDate,
    adults: b.adults,
    children: b.children,
    pickupLocation: b.pickupLocation,
    contactName: b.contactName,
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail ?? '',
    specialRequirements: b.specialRequirements ?? '',
    preferredPaymentMethod: b.preferredPaymentMethod,
    estimatedTotal: b.estimatedTotal,
    passengers: b.passengers,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <View />
    </Suspense>
  );
}
