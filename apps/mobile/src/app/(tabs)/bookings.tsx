import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Phone, Ticket } from 'lucide-react-native';
import { bookingLookupSchema, formatDate, timeAgo } from '@travo/core';
import { TabHeader } from '../../components/Screen';
import { TextField } from '../../components/forms';
import { EmptyState } from '../../components/states';
import { AppText, Button, Card } from '../../components/ui';
import { useSavedBookings } from '../../lib/local';
import { colors, spacing } from '../../theme/tokens';

export default function Bookings() {
  const { bookings } = useSavedBookings();
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ reference?: string; phone?: string }>({});

  const lookup = () => {
    const r = bookingLookupSchema.safeParse({ reference, phone });
    if (!r.success) {
      const e: typeof errors = {};
      for (const i of r.error.issues) e[i.path[0] as 'reference' | 'phone'] = i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    router.push({ pathname: '/bookings/[ref]', params: { ref: r.data.reference.toUpperCase(), phone: r.data.phone } });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: spacing.huge }} keyboardShouldPersistTaps="handled">
      <TabHeader title="My bookings" subtitle="Requests sent from this device" />
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        {bookings.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Ticket size={26} color={colors.emerald} />}
              title="No booking requests yet"
              message="When you request a trip it appears here so you can track its status."
              action={{ label: 'Find a trip', onPress: () => router.push('/packages') }}
            />
          </Card>
        ) : (
          bookings.map((b) => (
            <Pressable key={b.reference} accessibilityRole="button" onPress={() => router.push({ pathname: '/bookings/[ref]', params: { ref: b.reference, phone: b.phone } })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={20} color={colors.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{b.title}</AppText>
                  <AppText variant="small" color={colors.muted}>{b.reference} · {b.travelDate ? formatDate(b.travelDate) : ''}</AppText>
                  <AppText variant="small" color={colors.faint}>Requested {timeAgo(b.createdAt)}</AppText>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))
        )}

        <AppText variant="heading" style={{ marginTop: spacing.xl }}>Find a booking</AppText>
        <AppText variant="small" color={colors.muted} style={{ marginTop: -6 }}>Booked on another device? Enter your reference and the mobile number you used.</AppText>
        <Card>
          <TextField label="Booking reference" value={reference} onChangeText={setReference} autoCapitalize="characters" placeholder="TRV-26XXXXXX" error={errors.reference} />
          <TextField label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Phone size={18} color={colors.emerald} />} placeholder="+91 98xxx xxxxx" error={errors.phone} />
          <Button label="Check status" onPress={lookup} full />
        </Card>
      </View>
    </ScrollView>
  );
}
