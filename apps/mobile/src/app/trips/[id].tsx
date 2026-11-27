import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bus, CalendarDays, Clock, MapPin, Users } from 'lucide-react-native';
import { formatDateRange, formatINR, seatsLeft, TRIP_STATUS_LABELS, VEHICLE_CATEGORY_LABELS } from '@travo/core';
import { Gallery } from '../../components/Gallery';
import { BookingBar } from '../../components/BookingBar';
import { OperatorCard } from '../../components/OperatorCard';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Badge, Button, Card, Divider, InfoRow } from '../../components/ui';
import { useDestination, useOperator, usePackage, useTrip, useVehicle } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useTrip(id);
  const t = q.data;
  const pkg = usePackage(t?.packageId ?? undefined);
  const dest = useDestination(t?.destinationId);
  const op = useOperator(t?.operatorId);
  const vehicle = useVehicle(t?.vehicleId ?? undefined);

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: 80 }}><ListSkeleton /></View>;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!t) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}><EmptyState title="Trip not found" action={{ label: 'All trips', onPress: () => router.replace('/trips') }} /></View>;

  const left = seatsLeft(t);
  const closed = left === 0 || ['sold_out', 'cancelled', 'departed', 'completed'].includes(t.status);
  const images = pkg.data?.images.map((i) => i.url) ?? (dest.data ? [dest.data.coverImage] : []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Gallery images={images} label={dest.data?.name} height={280} shareText={`${t.title} · ${formatDateRange(t.departureDate, t.returnDate)} on Travo`} />
        <View style={st.body}>
          <Badge label={left === 0 ? 'Sold out' : TRIP_STATUS_LABELS[t.status]} tone={closed ? 'grey' : t.status === 'filling_fast' ? 'gold' : 'green'} />
          <AppText variant="title" style={{ marginTop: spacing.sm }}>{t.title}</AppText>
          <AppText variant="body" color={colors.muted}>{dest.data ? `${dest.data.name}, ${dest.data.district}` : ''}</AppText>

          <Card style={{ marginTop: spacing.lg }}>
            <InfoRow icon={<CalendarDays size={16} color={colors.forest} />} label="Dates" value={formatDateRange(t.departureDate, t.returnDate)} />
            <InfoRow icon={<Clock size={16} color={colors.forest} />} label="Departure time" value={t.departureTime} />
            <InfoRow icon={<MapPin size={16} color={colors.forest} />} label="Departs from" value={`${t.departureLocation}, ${t.departureDistrict}`} />
            <InfoRow icon={<Bus size={16} color={colors.forest} />} label="Vehicle" value={vehicle.data ? `${vehicle.data.make} ${vehicle.data.model} · ${VEHICLE_CATEGORY_LABELS[vehicle.data.category]}` : pkg.data ? VEHICLE_CATEGORY_LABELS[pkg.data.vehicleCategory] : 'Assigned by operator'} />
            <InfoRow icon={<Users size={16} color={colors.forest} />} label="Seats" value={`${left} of ${t.totalSeats} available`} />
          </Card>
          {!!t.notes && <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.md }}>{t.notes}</AppText>}

          {pkg.data && (
            <>
              <Divider />
              <AppText variant="heading">About this trip</AppText>
              <AppText variant="body" color={colors.ink} style={{ marginTop: spacing.sm }}>{pkg.data.summary}</AppText>
              <Button label="See full itinerary & inclusions" kind="secondary" full style={{ marginTop: spacing.md }} onPress={() => router.push(`/packages/${pkg.data!.id}`)} />
            </>
          )}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Operator</AppText>
          {op.data && <OperatorCard operator={op.data} message={`Hi, I'd like seats on "${t.title}" (${formatDateRange(t.departureDate, t.returnDate)}) via Travo.`} />}
        </View>
      </ScrollView>
      <BookingBar
        price={formatINR(t.pricePerPerson)}
        caption={closed ? 'Not open for booking' : `${left} seats left`}
        label={closed ? 'Sold out' : 'Book seats'}
        disabled={closed}
        onPress={() => router.push({ pathname: '/book', params: { tripId: t.id, ...(t.packageId ? { packageId: t.packageId } : {}) } })}
      />
    </View>
  );
}

const st = StyleSheet.create({
  body: { backgroundColor: colors.cream, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, marginTop: -20, padding: spacing.xl },
});
