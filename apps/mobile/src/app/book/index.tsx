import { useEffect, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Phone, UserRound } from 'lucide-react-native';
import {
  bookingRequestSchema,
  effectivePrice,
  estimateTotal,
  formatDateRange,
  formatINR,
  seatsLeft,
  type BookingRequestForm,
  type PaymentMethod,
} from '@travo/core';
import { ScreenHeader } from '../../components/Screen';
import { DateField, FormSubmitBar, PickerField, SelectSheet, TextField } from '../../components/forms';
import { PaymentOptions } from '../../components/PaymentOptions';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Card, Divider, Stepper } from '../../components/ui';
import { useCreateBooking, usePackage, useTrip, useTrips } from '../../lib/queries';
import { useSavedBookings } from '../../lib/local';
import { colors, radius, spacing } from '../../theme/tokens';
import { useState } from 'react';

export default function BookScreen() {
  const params = useLocalSearchParams<{ packageId?: string; tripId?: string; date?: string }>();
  const tripQ = useTrip(params.tripId);
  const packageId = params.packageId ?? tripQ.data?.packageId ?? undefined;
  const pkgQ = usePackage(packageId);
  const tripsQ = useTrips({ packageId });
  const create = useCreateBooking();
  const saved = useSavedBookings();
  const [pickupSheet, setPickupSheet] = useState(false);

  const pkg = pkgQ.data;
  const departures = tripsQ.data ?? [];

  const form = useForm<BookingRequestForm>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      packageId: packageId ?? null,
      scheduledTripId: params.tripId ?? null,
      vehicleId: null,
      travelDate: params.date ?? '',
      adults: 2,
      children: 0,
      pickupLocation: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      specialRequirements: '',
      preferredPaymentMethod: 'pay_at_operator',
      source: 'mobile',
    },
  });
  const { control, handleSubmit, watch, setValue, formState } = form;

  useEffect(() => {
    if (pkg) setValue('packageId', pkg.id);
    if (pkg && !form.getValues('pickupLocation') && pkg.pickupPoints[0]) setValue('pickupLocation', pkg.pickupPoints[0]);
  }, [pkg, setValue, form]);

  const tripId = watch('scheduledTripId');
  const trip = departures.find((t) => t.id === tripId) ?? tripQ.data ?? null;
  useEffect(() => {
    if (trip) {
      setValue('travelDate', trip.departureDate, { shouldValidate: formState.isSubmitted });
      if (trip.departureLocation) setValue('pickupLocation', trip.departureLocation);
    }
  }, [trip, setValue, formState.isSubmitted]);

  const adults = watch('adults');
  const children = watch('children');
  const unit = trip?.pricePerPerson ?? (pkg ? effectivePrice(pkg) : 0);
  const total = estimateTotal(unit, adults, children);
  const left = trip ? seatsLeft(trip) : null;
  const maxPeople = left ?? pkg?.maxGroupSize ?? 50;
  const overCapacity = adults + children > maxPeople;

  const submit = handleSubmit(async (values) => {
    if (overCapacity) return;
    const parsed = bookingRequestSchema.parse(values);
    try {
      const receipt = await create.mutateAsync(parsed);
      saved.add({ reference: receipt.reference, phone: parsed.contactPhone, title: pkg?.title ?? trip?.title ?? 'Trip', travelDate: parsed.travelDate, createdAt: receipt.createdAt });
      router.replace({ pathname: '/book/confirmation', params: { ref: receipt.reference, total: String(receipt.estimatedTotal), title: pkg?.title ?? trip?.title ?? '', date: parsed.travelDate, phone: parsed.contactPhone } });
    } catch {
      // Error message rendered from create.error below.
    }
  });

  const openDepartures = useMemo(() => departures.filter((t) => seatsLeft(t) > 0 && t.status !== 'sold_out'), [departures]);

  if (pkgQ.isLoading || tripQ.isLoading) return <View style={{ flex: 1, backgroundColor: colors.cream }}><ScreenHeader title="Request booking" /><ListSkeleton /></View>;
  if (pkgQ.error) return <ErrorState error={pkgQ.error} onRetry={() => pkgQ.refetch()} />;
  if (!pkg) return <View style={{ flex: 1, backgroundColor: colors.cream }}><ScreenHeader title="Request booking" /><EmptyState title="Trip not found" message="Pick a package to book." action={{ label: 'Browse packages', onPress: () => router.replace('/packages') }} /></View>;

  const err = formState.errors;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Request booking" subtitle="No login or payment needed" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.huge }} keyboardShouldPersistTaps="handled">
        <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <SmartImage uri={pkg.images[0]?.url} width={300} rounded={radius.md} style={{ width: 64, height: 64 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={2}>{pkg.title}</AppText>
            <AppText variant="small" color={colors.muted}>{formatINR(unit)} per adult · children 50%</AppText>
          </View>
        </Card>

        <AppText variant="heading" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>Trip details</AppText>
        {openDepartures.length > 0 && (
          <>
            <Controller
              control={control}
              name="scheduledTripId"
              render={({ field }) => (
                <>
                  <PickerField
                    label="Departure"
                    value={trip ? `${formatDateRange(trip.departureDate, trip.returnDate)} · ${seatsLeft(trip)} seats left` : 'Private trip on my own date'}
                    placeholder="Choose departure"
                    onPress={() => setPickupSheet(true)}
                  />
                  <SelectSheet
                    visible={pickupSheet}
                    onClose={() => setPickupSheet(false)}
                    title="Choose departure"
                    value={field.value ?? ''}
                    options={[
                      ...openDepartures.map((t) => ({ value: t.id, label: formatDateRange(t.departureDate, t.returnDate), hint: `${t.departureLocation} · ${formatINR(t.pricePerPerson)} · ${seatsLeft(t)} seats left` })),
                      ...(pkg.tripType === 'private' ? [{ value: '', label: 'Private trip on my own date' }] : []),
                    ]}
                    onSelect={(v) => field.onChange(v || null)}
                  />
                </>
              )}
            />
          </>
        )}
        {!trip && (
          <Controller
            control={control}
            name="travelDate"
            render={({ field }) => <DateField label="Travel date" value={field.value || null} onChange={field.onChange} error={err.travelDate?.message} allowedDates={pkg.availableDates.length ? pkg.availableDates : undefined} />}
          />
        )}
        <Card style={{ marginBottom: spacing.lg }}>
          <Controller control={control} name="adults" render={({ field }) => <Stepper label="Adults" hint="12+ years" value={field.value} onChange={field.onChange} min={1} max={60} />} />
          <Divider style={{ marginVertical: spacing.xs }} />
          <Controller control={control} name="children" render={({ field }) => <Stepper label="Children" hint="2–11 years, 50% fare" value={field.value} onChange={field.onChange} min={0} max={40} />} />
          {overCapacity && (
            <AppText variant="small" color={colors.danger} style={{ marginTop: spacing.sm }}>
              {left != null ? `Only ${left} seats left on this departure.` : `This package allows up to ${pkg.maxGroupSize} travellers. Send a custom trip request for larger groups.`}
            </AppText>
          )}
        </Card>
        <Controller
          control={control}
          name="pickupLocation"
          render={({ field }) => (
            <TextField label="Pickup location" icon={<MapPin size={18} color={colors.emerald} />} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder={pkg.pickupPoints.join(' / ')} error={err.pickupLocation?.message} hint={`Suggested: ${pkg.pickupPoints.join(', ')}`} />
          )}
        />

        <AppText variant="heading" style={{ marginTop: spacing.md, marginBottom: spacing.md }}>Contact details</AppText>
        <Controller control={control} name="contactName" render={({ field }) => <TextField label="Full name" icon={<UserRound size={18} color={colors.emerald} />} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoComplete="name" textContentType="name" placeholder="As on your ID" error={err.contactName?.message} />} />
        <Controller control={control} name="contactPhone" render={({ field }) => <TextField label="Mobile number (WhatsApp)" icon={<Phone size={18} color={colors.emerald} />} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="+91 98xxx xxxxx" error={err.contactPhone?.message} />} />
        <Controller control={control} name="contactEmail" render={({ field }) => <TextField label="Email (optional)" icon={<Mail size={18} color={colors.emerald} />} value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" error={err.contactEmail?.message} />} />
        <Controller control={control} name="specialRequirements" render={({ field }) => <TextField label="Special requirements (optional)" multiline value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="Dietary needs, elders, wheelchair access, celebrations…" />} />

        <AppText variant="heading" style={{ marginTop: spacing.md, marginBottom: spacing.md }}>Payment preference</AppText>
        <Controller control={control} name="preferredPaymentMethod" render={({ field }) => <PaymentOptions value={field.value as PaymentMethod} onChange={field.onChange} />} />

        <Card style={{ marginTop: spacing.xxl, backgroundColor: colors.sandSoft }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="body">{adults} adult{adults > 1 ? 's' : ''} × {formatINR(unit)}</AppText>
            <AppText variant="body">{formatINR(unit * adults)}</AppText>
          </View>
          {children > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <AppText variant="body">{children} child{children > 1 ? 'ren' : ''} × {formatINR(Math.round(unit * 0.5))}</AppText>
              <AppText variant="body">{formatINR(Math.round(unit * 0.5) * children)}</AppText>
            </View>
          )}
          <Divider style={{ marginVertical: spacing.md }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="heading">Estimated total</AppText>
            <AppText variant="heading" color={colors.forest}>{formatINR(total)}</AppText>
          </View>
          <AppText variant="small" color={colors.muted} style={{ marginTop: 4 }}>Final price is confirmed by the operator. Taxes may apply.</AppText>
        </Card>

        {create.error && (
          <Card style={{ marginTop: spacing.lg, backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }}>
            <AppText variant="bodyStrong" color={colors.danger}>Request not sent</AppText>
            <AppText variant="small" color={colors.danger}>{(create.error as Error).message}</AppText>
          </Card>
        )}
      </ScrollView>
      <FormSubmitBar label="Send booking request" loading={create.isPending} onPress={submit} note="Free to request · no payment taken now" />
    </KeyboardAvoidingView>
  );
}
