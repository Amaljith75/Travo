import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BedDouble, Bus, CalendarDays, Check, Clock, MapPin, ShieldCheck, Users, Utensils, X } from 'lucide-react-native';
import {
  effectivePrice,
  formatDate,
  formatDateRange,
  formatDuration,
  formatINR,
  PACKAGE_CATEGORY_LABELS,
  seatsLeft,
  TRIP_TYPE_LABELS,
  VEHICLE_CATEGORY_LABELS,
} from '@travo/core';
import { Gallery } from '../../components/Gallery';
import { BookingBar } from '../../components/BookingBar';
import { OperatorCard } from '../../components/OperatorCard';
import { ReviewList } from '../../components/Reviews';
import { TripCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Badge, Card, Chip, Divider, InfoRow, Rating } from '../../components/ui';
import { usePackage, useDestination, useOperator, useReviews, useTrips } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';

export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = usePackage(id);
  const pkg = q.data;
  const destination = useDestination(pkg?.destinationId);
  const operator = useOperator(pkg?.operatorId);
  const reviews = useReviews({ packageId: pkg?.id });
  const trips = useTrips({ packageId: pkg?.id });
  const [openDay, setOpenDay] = useState(1);

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: 80 }}><ListSkeleton rows={5} /></View>;
  if (q.error) return <View style={{ flex: 1, justifyContent: 'center' }}><ErrorState error={q.error} onRetry={() => q.refetch()} /></View>;
  if (!pkg || pkg.status !== 'published')
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}>
        <EmptyState title="Package unavailable" message="This package is no longer listed." action={{ label: 'Browse packages', onPress: () => router.replace('/packages') }} />
      </View>
    );

  const price = effectivePrice(pkg);
  const upcoming = trips.data ?? [];
  const msg = `Hi, I'm interested in "${pkg.title}" on Travo. Could you share availability?`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Gallery images={pkg.images.map((i) => i.url)} label={destination.data?.name} favouriteId={pkg.id} shareText={`${pkg.title} — from ${formatINR(price)}/person on Travo`} />
        <View style={st.body}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {pkg.isFeatured && <Badge label="Featured" />}
            {pkg.isTrending && <Badge label="Trending" tone="sand" />}
            {pkg.discountPercent > 0 && <Badge label={`${pkg.discountPercent}% off`} tone="gold" />}
            <Badge label={TRIP_TYPE_LABELS[pkg.tripType]} tone="blue" />
          </View>
          <AppText variant="title" style={{ marginTop: spacing.md }}>{pkg.title}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <MapPin size={14} color={colors.muted} />
            <AppText variant="body" color={colors.muted}>
              {destination.data ? `${destination.data.name}, ${destination.data.district}` : 'Kerala'}
            </AppText>
            <AppText color={colors.faint}>·</AppText>
            <Rating value={pkg.rating} count={pkg.reviewCount} />
          </View>
          <AppText variant="body" color={colors.ink} style={{ marginTop: spacing.md }}>{pkg.description}</AppText>

          <View style={st.facts}>
            <Fact icon={<Clock size={18} color={colors.forest} />} label="Duration" value={formatDuration(pkg.durationDays, pkg.durationNights)} />
            <Fact icon={<Users size={18} color={colors.forest} />} label="Group size" value={`${pkg.minGroupSize}–${pkg.maxGroupSize}`} />
            <Fact icon={<Bus size={18} color={colors.forest} />} label="Transport" value={VEHICLE_CATEGORY_LABELS[pkg.vehicleCategory]} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
            {pkg.categories.map((c) => <Chip key={c} label={PACKAGE_CATEGORY_LABELS[c]} />)}
          </View>

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Day-wise itinerary</AppText>
          {pkg.itinerary.map((d) => {
            const open = openDay === d.dayNumber;
            return (
              <Card key={d.id} style={{ marginBottom: spacing.sm, padding: 0 }} padded={false}>
                <Pressable style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg }} onPress={() => setOpenDay(open ? 0 : d.dayNumber)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                  <View style={st.dayNum}>
                    <AppText variant="caption" color={colors.white}>DAY</AppText>
                    <AppText variant="bodyStrong" color={colors.white}>{d.dayNumber}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{d.title}</AppText>
                    {open && (
                      <>
                        <AppText variant="body" color={colors.ink} style={{ marginTop: 6 }}>{d.description}</AppText>
                        {d.meals.length > 0 && (
                          <View style={st.inline}>
                            <Utensils size={13} color={colors.emerald} />
                            <AppText variant="small" color={colors.muted}>{d.meals.join(', ')}</AppText>
                          </View>
                        )}
                        {d.stay && (
                          <View style={st.inline}>
                            <BedDouble size={13} color={colors.emerald} />
                            <AppText variant="small" color={colors.muted}>{d.stay}</AppText>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </Pressable>
              </Card>
            );
          })}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.sm }}>Pickup & drop-off</AppText>
          <InfoRow icon={<MapPin size={16} color={colors.forest} />} label="Pickup points" value={pkg.pickupPoints.join(' · ')} />
          <InfoRow icon={<MapPin size={16} color={colors.forest} />} label="Drop-off points" value={pkg.dropPoints.join(' · ')} />
          <InfoRow icon={<Bus size={16} color={colors.forest} />} label="Transport" value={pkg.transportDetails} />
          <InfoRow icon={<BedDouble size={16} color={colors.forest} />} label="Accommodation" value={pkg.accommodation} />

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>What’s included</AppText>
          {pkg.inclusions.map((i) => (
            <View key={i} style={st.listRow}>
              <Check size={16} color={colors.emerald} />
              <AppText variant="body" style={{ flex: 1 }}>{i}</AppText>
            </View>
          ))}
          <AppText variant="heading" style={{ marginBottom: spacing.md, marginTop: spacing.lg }}>Not included</AppText>
          {pkg.exclusions.map((i) => (
            <View key={i} style={st.listRow}>
              <X size={16} color={colors.danger} />
              <AppText variant="body" color={colors.ink} style={{ flex: 1 }}>{i}</AppText>
            </View>
          ))}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Available dates</AppText>
          {upcoming.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              <AppText variant="small" color={colors.muted}>Scheduled group departures — book a seat:</AppText>
              {upcoming.map((t) => <TripCard key={t.id} trip={t} destination={destination.data ?? undefined} />)}
            </View>
          ) : pkg.availableDates.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {pkg.availableDates.map((d) => (
                <Chip key={d} label={formatDate(d)} icon={<CalendarDays size={13} color={colors.ink} />} onPress={() => router.push({ pathname: '/book', params: { packageId: pkg.id, date: d } })} />
              ))}
            </View>
          ) : (
            <View style={st.inline}>
              <CalendarDays size={16} color={colors.emerald} />
              <AppText variant="body">Runs on request — any date you choose, subject to operator confirmation.</AppText>
            </View>
          )}

          <Divider />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <ShieldCheck size={20} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">Cancellation policy</AppText>
              <AppText variant="body" color={colors.ink} style={{ marginTop: 4 }}>{pkg.cancellationPolicy}</AppText>
            </View>
          </View>

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Your operator</AppText>
          {operator.data && <OperatorCard operator={operator.data} message={msg} />}

          <Divider />
          <AppText variant="heading" style={{ marginBottom: spacing.md }}>Ratings & reviews</AppText>
          <ReviewList reviews={reviews.data ?? []} rating={pkg.rating} count={pkg.reviewCount} />
        </View>
      </ScrollView>
      <BookingBar
        price={formatINR(upcoming[0] && seatsLeft(upcoming[0]) > 0 ? Math.min(price, upcoming[0].pricePerPerson) : price)}
        strike={pkg.discountPercent > 0 ? formatINR(pkg.basePrice) : undefined}
        caption={upcoming[0] ? `Next departure ${formatDateRange(upcoming[0].departureDate, upcoming[0].returnDate)}` : 'Pay later · free to request'}
        label="Book this trip"
        onPress={() => router.push({ pathname: '/book', params: { packageId: pkg.id } })}
      />
    </View>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={st.fact}>
      {icon}
      <AppText variant="small" color={colors.muted} style={{ marginTop: 6 }}>{label}</AppText>
      <AppText variant="smallStrong" numberOfLines={2}>{value}</AppText>
    </View>
  );
}

const st = StyleSheet.create({
  body: { backgroundColor: colors.cream, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, marginTop: -20, padding: spacing.xl },
  facts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  fact: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.lineSoft },
  dayNum: { width: 44, height: 50, borderRadius: radius.md, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  listRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.sm },
});
