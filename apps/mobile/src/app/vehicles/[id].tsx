import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Luggage, MapPin, ShieldCheck, Snowflake, UserRound, Users } from 'lucide-react-native';
import { formatINR, PRICING_UNIT_LABELS, VEHICLE_CATEGORY_LABELS } from '@travo/core';
import { Gallery } from '../../components/Gallery';
import { BookingBar } from '../../components/BookingBar';
import { OperatorCard } from '../../components/OperatorCard';
import { ReviewList } from '../../components/Reviews';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Badge, Card, Divider, InfoRow, Rating } from '../../components/ui';
import { useOperator, useReviews, useVehicle } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';

export default function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useVehicle(id);
  const v = q.data;
  const op = useOperator(v?.operatorId);
  const reviews = useReviews({ vehicleId: v?.id });

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: 80 }}><ListSkeleton /></View>;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!v || v.listingStatus !== 'approved') return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}><EmptyState title="Vehicle not available" action={{ label: 'All vehicles', onPress: () => router.replace('/vehicles') }} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Gallery images={v.images.map((i) => i.url)} label={VEHICLE_CATEGORY_LABELS[v.category]} height={280} favouriteId={v.id} />
        <View style={st.body}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Badge label={VEHICLE_CATEGORY_LABELS[v.category]} />
            {v.registrationVerified && <Badge label="Documents verified" tone="blue" icon={<ShieldCheck size={11} color={colors.info} />} />}
            {!v.isAvailable && <Badge label="Currently unavailable" tone="red" />}
          </View>
          <AppText variant="title" style={{ marginTop: spacing.sm }}>{v.title}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: 4 }}>
            <AppText variant="body" color={colors.muted}>{v.make} {v.model} · {v.year}</AppText>
            <Rating value={v.rating} count={v.reviewCount} />
          </View>
          <AppText variant="body" color={colors.ink} style={{ marginTop: spacing.md }}>{v.description}</AppText>

          <Card style={{ marginTop: spacing.lg }}>
            <InfoRow icon={<Users size={16} color={colors.forest} />} label="Seating" value={`${v.seatingCapacity} passengers`} />
            <InfoRow icon={<Snowflake size={16} color={colors.forest} />} label="Climate" value={v.isAc ? 'Air-conditioned' : 'Non-AC'} />
            <InfoRow icon={<Luggage size={16} color={colors.forest} />} label="Luggage" value={v.luggageCapacity} />
            <InfoRow icon={<UserRound size={16} color={colors.forest} />} label="Driver" value={v.driverIncluded ? 'Included — fuel, driver bata and tolls quoted by owner' : 'Self-drive'} />
            <InfoRow icon={<MapPin size={16} color={colors.forest} />} label="Pickup" value={`${v.pickupLocation} (${v.baseDistrict})`} />
          </Card>

          <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>Amenities</AppText>
          {v.amenities.map((a) => (
            <View key={a} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Check size={16} color={colors.emerald} />
              <AppText variant="body">{a}</AppText>
            </View>
          ))}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Owner / operator</AppText>
          {op.data && <OperatorCard operator={op.data} message={`Hi, I'd like to hire your ${v.make} ${v.model} listed on Travo.`} />}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Reviews</AppText>
          <ReviewList reviews={reviews.data ?? []} rating={v.rating} count={v.reviewCount} />
        </View>
      </ScrollView>
      <BookingBar
        price={formatINR(v.price)}
        unit={PRICING_UNIT_LABELS[v.pricingUnit]}
        caption={v.pricingUnit === 'per_km' ? `Minimum ${formatINR(v.minimumCharge)} per day` : 'Driver included'}
        label={v.isAvailable ? 'Request trip' : 'Unavailable'}
        disabled={!v.isAvailable}
        onPress={() => router.push({ pathname: '/custom-trip', params: { vehicleId: v.id } })}
      />
    </View>
  );
}

const st = StyleSheet.create({
  body: { backgroundColor: colors.cream, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, marginTop: -20, padding: spacing.xl },
});
