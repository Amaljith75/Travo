import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { CircleCheckBig, MapPin, Navigation, Phone, Plus, UserRound, X } from 'lucide-react-native';
import { customTripSchema, formatINR, PRICING_UNIT_LABELS } from '@travo/core';
import { DemoNotice, ScreenHeader } from '../components/Screen';
import { DateField, FormSubmitBar, TextField } from '../components/forms';
import { SmartImage } from '../components/SmartImage';
import { AppText, Button, Card, Stepper } from '../components/ui';
import { useCreateEnquiry, useVehicle } from '../lib/queries';
import { colors, radius, spacing } from '../theme/tokens';

type Form = z.input<typeof customTripSchema>;

export default function CustomTrip() {
  const params = useLocalSearchParams<{ vehicleId?: string; destination?: string }>();
  const vehicle = useVehicle(params.vehicleId);
  const create = useCreateEnquiry();
  const [stop, setStop] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState } = useForm<Form>({
    resolver: zodResolver(customTripSchema),
    defaultValues: {
      type: params.vehicleId ? 'vehicle' : 'custom_trip',
      vehicleId: params.vehicleId ?? null,
      packageId: null,
      pickupLocation: '',
      destination: params.destination ?? '',
      stops: [],
      travelDate: '',
      returnDate: null,
      passengers: 2,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      message: '',
    },
  });
  const stops = watch('stops');
  const travelDate = watch('travelDate');
  const err = formState.errors;

  const submit = handleSubmit(async (values) => {
    try {
      const r = await create.mutateAsync(customTripSchema.parse(values));
      setDone(r.reference);
    } catch {
      // shown below
    }
  });

  if (done)
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <ScreenHeader title="Request sent" />
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <CircleCheckBig size={56} color={colors.emerald} />
          <AppText variant="title" style={{ marginTop: spacing.lg, textAlign: 'center' }}>We’ve shared your trip request</AppText>
          <AppText variant="body" color={colors.muted} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
            Matching operators will contact you with quotes. Your reference is
          </AppText>
          <AppText variant="title" color={colors.forest} selectable style={{ marginTop: spacing.sm }}>{done}</AppText>
          <DemoNotice text="Demo mode: the request is stored on this device only." />
          <Button label="Back to home" full style={{ marginTop: spacing.xl }} onPress={() => router.replace('/')} />
        </View>
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={vehicle.data ? 'Request this vehicle' : 'Plan a custom trip'} subtitle="Get quotes from local operators" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.huge }} keyboardShouldPersistTaps="handled">
        {vehicle.data && (
          <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.xl }}>
            <SmartImage uri={vehicle.data.images[0]?.url} width={300} rounded={radius.md} style={{ width: 64, height: 64 }} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{vehicle.data.make} {vehicle.data.model}</AppText>
              <AppText variant="small" color={colors.muted}>
                {vehicle.data.seatingCapacity} seats · {formatINR(vehicle.data.price)}{PRICING_UNIT_LABELS[vehicle.data.pricingUnit]}
              </AppText>
            </View>
          </Card>
        )}
        <Controller control={control} name="pickupLocation" render={({ field }) => <TextField label="Pickup" icon={<Navigation size={18} color={colors.emerald} />} placeholder="e.g. Kochi airport" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={err.pickupLocation?.message} />} />
        <Controller control={control} name="destination" render={({ field }) => <TextField label="Destination" icon={<MapPin size={18} color={colors.emerald} />} placeholder="e.g. Munnar" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={err.destination?.message} />} />

        <AppText variant="smallStrong" color={colors.ink} style={{ marginBottom: 6 }}>Stops on the way (optional)</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
          {stops.map((s) => (
            <Pressable key={s} onPress={() => setValue('stops', stops.filter((x) => x !== s))} accessibilityLabel={`Remove stop ${s}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.emeraldSoft }}>
              <AppText variant="smallStrong" color={colors.forest}>{s}</AppText>
              <X size={13} color={colors.forest} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <TextField label="Add a stop" value={stop} onChangeText={setStop} placeholder="e.g. Cheeyappara falls" onSubmitEditing={() => { if (stop.trim() && stops.length < 8) { setValue('stops', [...stops, stop.trim()]); setStop(''); } }} />
          </View>
          <Button label="Add" kind="secondary" icon={<Plus size={15} color={colors.forest} />} style={{ marginTop: 24 }} onPress={() => { if (stop.trim() && stops.length < 8) { setValue('stops', [...stops, stop.trim()]); setStop(''); } }} />
        </View>

        <Controller control={control} name="travelDate" render={({ field }) => <DateField label="Travel date" value={field.value || null} onChange={field.onChange} error={err.travelDate?.message} />} />
        <Controller control={control} name="returnDate" render={({ field }) => <DateField label="Return date (optional)" value={field.value} onChange={field.onChange} minDate={travelDate || undefined} error={err.returnDate?.message} />} />
        <Card style={{ marginBottom: spacing.lg }}>
          <Controller control={control} name="passengers" render={({ field }) => <Stepper label="Passengers" value={field.value} onChange={field.onChange} min={1} max={vehicle.data?.seatingCapacity ?? 60} hint={vehicle.data ? `Up to ${vehicle.data.seatingCapacity} in this vehicle` : undefined} />} />
        </Card>

        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Contact details</AppText>
        <Controller control={control} name="contactName" render={({ field }) => <TextField label="Full name" icon={<UserRound size={18} color={colors.emerald} />} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={err.contactName?.message} />} />
        <Controller control={control} name="contactPhone" render={({ field }) => <TextField label="Mobile number (WhatsApp)" icon={<Phone size={18} color={colors.emerald} />} keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={err.contactPhone?.message} />} />
        <Controller control={control} name="contactEmail" render={({ field }) => <TextField label="Email (optional)" keyboardType="email-address" autoCapitalize="none" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={err.contactEmail?.message} />} />
        <Controller control={control} name="message" render={({ field }) => <TextField label="Anything else? (optional)" multiline value={field.value ?? ''} onChangeText={field.onChange} placeholder="Budget, preferred language, hotel needs…" />} />

        {create.error && <AppText variant="small" color={colors.danger}>{(create.error as Error).message}</AppText>}
      </ScrollView>
      <FormSubmitBar label="Send request" loading={create.isPending} onPress={submit} note="Free · operators reply with quotes" />
    </KeyboardAvoidingView>
  );
}
