import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, MapPin, Users, Wallet } from 'lucide-react-native';
import { BOOKING_STATUS_LABELS, formatDate, formatDateTime, formatINR, PAYMENT_METHOD_LABELS, type BookingStatus } from '@travo/core';
import { ScreenHeader } from '../../components/Screen';
import { OperatorCard } from '../../components/OperatorCard';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Badge, Card, InfoRow, type BadgeTone } from '../../components/ui';
import { useBookingLookup, useOperator, usePackage } from '../../lib/queries';
import { useSavedBookings } from '../../lib/local';
import { colors, spacing } from '../../theme/tokens';

const TONE: Record<BookingStatus, BadgeTone> = { pending: 'gold', confirmed: 'green', rejected: 'red', cancelled: 'grey', completed: 'blue' };
const STEPS: BookingStatus[] = ['pending', 'confirmed', 'completed'];

export default function BookingDetail() {
  const { ref, phone } = useLocalSearchParams<{ ref: string; phone: string }>();
  const q = useBookingLookup(ref, phone);
  const b = q.data;
  const pkg = usePackage(b?.packageId ?? undefined);
  const op = useOperator(b?.operatorId);
  const saved = useSavedBookings();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title={ref ?? 'Booking'} subtitle="Booking request" />
      {q.isLoading ? (
        <ListSkeleton rows={3} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !b ? (
        <EmptyState
          title="Booking not found"
          message="Check the reference and the mobile number used for the request."
          action={{ label: saved.bookings.some((x) => x.reference === ref) ? 'Remove from this device' : 'Back', onPress: () => { if (ref) saved.remove(ref); router.back(); } }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge }}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="caption" color={colors.muted}>STATUS</AppText>
              <Badge label={BOOKING_STATUS_LABELS[b.status]} tone={TONE[b.status]} />
            </View>
            <AppText variant="heading" style={{ marginTop: spacing.md }}>{pkg.data?.title ?? 'Trip request'}</AppText>
            {['pending', 'confirmed', 'completed'].includes(b.status) && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.lg }}>
                {STEPS.map((s, i) => {
                  const reached = STEPS.indexOf(b.status) >= i;
                  return (
                    <View key={s} style={{ flex: 1 }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: reached ? colors.emerald : colors.lineSoft }} />
                      <AppText variant="caption" color={reached ? colors.forest : colors.faint} style={{ marginTop: 6 }}>{BOOKING_STATUS_LABELS[s].toUpperCase()}</AppText>
                    </View>
                  );
                })}
              </View>
            )}
            <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.md }}>
              {b.status === 'pending' && 'Waiting for the operator to confirm availability.'}
              {b.status === 'confirmed' && 'Confirmed! The operator will share pickup details and payment instructions.'}
              {b.status === 'rejected' && 'The operator could not accept this request. Try another date or package.'}
              {b.status === 'cancelled' && 'This booking was cancelled.'}
              {b.status === 'completed' && 'Hope you had a wonderful trip!'}
            </AppText>
          </Card>
          <Card>
            <InfoRow icon={<CalendarDays size={16} color={colors.forest} />} label="Travel date" value={formatDate(b.travelDate)} />
            <InfoRow icon={<Users size={16} color={colors.forest} />} label="Travellers" value={`${b.adults} adults${b.children ? `, ${b.children} children` : ''}`} />
            <InfoRow icon={<MapPin size={16} color={colors.forest} />} label="Pickup" value={b.pickupLocation} />
            <InfoRow icon={<Wallet size={16} color={colors.forest} />} label="Estimated total" value={`${formatINR(b.estimatedTotal)} · preferred: ${PAYMENT_METHOD_LABELS[b.preferredPaymentMethod]}`} />
            <AppText variant="small" color={colors.faint} style={{ marginTop: spacing.sm }}>Requested {formatDateTime(b.createdAt)}. No payment has been taken.</AppText>
          </Card>
          {op.data && <OperatorCard operator={op.data} message={`Hi, I'm following up on my Travo booking ${b.reference}.`} />}
        </ScrollView>
      )}
    </View>
  );
}
