'use client';

import { useEffect, useState } from 'react';
import { formatINR, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_STATUSES, type Booking, type PaymentMethod, type PaymentRecord, type PaymentStatus } from '@travo/core';
import { api } from '@/lib/data';
import { useSave } from '@/lib/queries';
import { Button, Field, Modal } from './ui';
import { errorMessage, useToast } from './toast';

/** Record or edit an offline / manual payment against a booking. */
export function PaymentModal({ open, onClose, booking, payment, bookings }: { open: boolean; onClose: () => void; booking?: Booking | null; payment?: PaymentRecord | null; bookings?: Booking[] }) {
  const toast = useToast();
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const save = useSave(() => api.savePayment({ bookingId, amount: Math.round(Number(amount)), method, status, provider: payment?.provider ?? 'offline', providerReference: reference || null, notes: notes || null }, payment?.id), ['payments', 'booking', 'bookings']);

  useEffect(() => {
    if (!open) return;
    setBookingId(payment?.bookingId ?? booking?.id ?? '');
    setAmount(payment ? String(payment.amount) : booking ? String(booking.estimatedTotal) : '');
    setMethod(payment?.method ?? booking?.preferredPaymentMethod ?? 'upi');
    setStatus(payment?.status ?? 'paid');
    setReference(payment?.providerReference ?? '');
    setNotes(payment?.notes ?? '');
  }, [open, payment, booking]);

  const submit = async () => {
    if (!bookingId) return toast('error', 'Choose a booking');
    if (!(Number(amount) > 0)) return toast('error', 'Enter an amount greater than zero');
    try {
      await save.mutateAsync(undefined);
      toast('success', payment ? 'Payment updated' : `Payment of ${formatINR(Number(amount))} recorded`);
      onClose();
    } catch (e) {
      toast('error', errorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={payment ? 'Edit payment' : 'Record payment'}
      footer={
        <>
          <Button kind="outline" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={submit}>Save payment</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!booking && (
          <Field label="Booking">
            <select className="input" value={bookingId} onChange={(e) => setBookingId(e.target.value)} disabled={!!payment}>
              <option value="">Select booking…</option>
              {(bookings ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.reference} · {b.contactName} · {formatINR(b.estimatedTotal)}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)">
            <input className="input" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Method">
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Transaction / receipt no.">
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UPI ref, cheque no…" />
          </Field>
        </div>
        <Field label="Notes">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 30% advance collected by operator" />
        </Field>
        <p className="text-xs text-muted">This records a payment taken offline. No money is charged from this dashboard — online gateways (e.g. Razorpay) plug in later.</p>
      </div>
    </Modal>
  );
}
