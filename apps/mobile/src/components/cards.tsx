import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bus, CalendarDays, Clock, Heart, MapPin, Snowflake, Users } from 'lucide-react-native';
import {
  effectivePrice,
  formatDateRange,
  formatDuration,
  formatINR,
  PRICING_UNIT_LABELS,
  seatsLeft,
  TRIP_STATUS_LABELS,
  TRIP_TYPE_LABELS,
  VEHICLE_CATEGORY_LABELS,
  type Destination,
  type Operator,
  type ScheduledTrip,
  type TravelPackage,
  type Vehicle,
} from '@travo/core';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { useFavourites } from '../lib/local';
import { SmartImage } from './SmartImage';
import { AppText, Badge, Rating, styles as ui } from './ui';

export function FavouriteButton({ id, size = 18 }: { id: string; size?: number }) {
  const { isFavourite, toggle } = useFavourites();
  const on = isFavourite(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save'}
      accessibilityState={{ selected: on }}
      hitSlop={10}
      onPress={() => toggle(id)}
      style={({ pressed }) => [s.fav, pressed && { transform: [{ scale: 0.92 }] }]}
    >
      <Heart size={size} color={on ? colors.danger : colors.forest} fill={on ? colors.danger : 'transparent'} />
    </Pressable>
  );
}

function PriceLine({ pkg, light }: { pkg: TravelPackage; light?: boolean }) {
  const price = effectivePrice(pkg);
  return (
    <View style={[ui.row, { gap: 6, flexWrap: 'wrap' }]}>
      {pkg.discountPercent > 0 && (
        <AppText variant="small" color={light ? 'rgba(255,255,255,0.7)' : colors.faint} style={{ textDecorationLine: 'line-through' }}>
          {formatINR(pkg.basePrice)}
        </AppText>
      )}
      <AppText variant="heading" color={light ? colors.white : colors.forest}>
        {formatINR(price)}
      </AppText>
      <AppText variant="small" color={light ? 'rgba(255,255,255,0.8)' : colors.muted}>
        /person
      </AppText>
    </View>
  );
}

/** Vertical card for carousels and grids. */
export function PackageCard({ pkg, destination, operator, width = 270 }: { pkg: TravelPackage; destination?: Destination; operator?: Operator; width?: number | `${number}%` }) {
  const cover = pkg.images[0]?.url;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pkg.title}, ${formatDuration(pkg.durationDays, pkg.durationNights)}, from ${formatINR(effectivePrice(pkg))} per person`}
      onPress={() => router.push(`/packages/${pkg.id}`)}
      style={({ pressed }) => [{ width }, pressed && { opacity: 0.92 }]}
    >
      <SmartImage uri={cover} width={700} label={destination?.name} rounded={radius.xl} style={{ height: 180 }}>
        <View style={s.topRow}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {pkg.isFeatured && <Badge label="Featured" tone="light" />}
            {pkg.isTrending && !pkg.isFeatured && <Badge label="Trending" tone="light" />}
            {pkg.discountPercent > 0 && <Badge label={`${pkg.discountPercent}% off`} tone="gold" />}
          </View>
          <FavouriteButton id={pkg.id} />
        </View>
        <View style={s.durationPill}>
          <Clock size={12} color={colors.white} />
          <AppText variant="caption" color={colors.white}>
            {formatDuration(pkg.durationDays, pkg.durationNights).toUpperCase()}
          </AppText>
        </View>
      </SmartImage>
      <View style={{ paddingTop: spacing.md, paddingHorizontal: 2, gap: 4 }}>
        <View style={[ui.row, { justifyContent: 'space-between' }]}>
          <View style={[ui.row, { gap: 4, flex: 1 }]}>
            <MapPin size={13} color={colors.muted} />
            <AppText variant="small" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
              {destination?.name ?? 'Kerala'} · {TRIP_TYPE_LABELS[pkg.tripType]}
            </AppText>
          </View>
          <Rating value={pkg.rating} count={pkg.reviewCount} />
        </View>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {pkg.title}
        </AppText>
        <AppText variant="small" color={colors.muted} numberOfLines={1}>
          {VEHICLE_CATEGORY_LABELS[pkg.vehicleCategory]} · {pkg.minGroupSize}–{pkg.maxGroupSize} people{operator ? ` · ${operator.businessName}` : ''}
        </AppText>
        <PriceLine pkg={pkg} />
      </View>
    </Pressable>
  );
}

/** Horizontal row card for result lists. */
export function PackageListItem({ pkg, destination, operator }: { pkg: TravelPackage; destination?: Destination; operator?: Operator }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pkg.title}, from ${formatINR(effectivePrice(pkg))} per person`}
      onPress={() => router.push(`/packages/${pkg.id}`)}
      style={({ pressed }) => [s.listCard, pressed && { opacity: 0.92 }]}
    >
      <SmartImage uri={pkg.images[0]?.url} width={500} label={destination?.name} rounded={radius.lg} style={{ width: 112, height: 132 }}>
        <View style={{ position: 'absolute', top: 6, right: 6 }}>
          <FavouriteButton id={pkg.id} size={15} />
        </View>
      </SmartImage>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={[ui.row, { gap: 6 }]}>
          {pkg.isFeatured && <Badge label="Featured" />}
          {pkg.isTrending && <Badge label="Trending" tone="sand" />}
          {pkg.discountPercent > 0 && <Badge label={`${pkg.discountPercent}% off`} tone="gold" />}
        </View>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {pkg.title}
        </AppText>
        <AppText variant="small" color={colors.muted} numberOfLines={1}>
          {destination?.name ?? 'Kerala'} · {formatDuration(pkg.durationDays, pkg.durationNights)}
        </AppText>
        <AppText variant="small" color={colors.muted} numberOfLines={1}>
          {VEHICLE_CATEGORY_LABELS[pkg.vehicleCategory]} · up to {pkg.maxGroupSize} · {operator?.businessName ?? ''}
        </AppText>
        <View style={[ui.row, { justifyContent: 'space-between', marginTop: 2 }]}>
          <PriceLine pkg={pkg} />
        </View>
        <Rating value={pkg.rating} count={pkg.reviewCount} />
      </View>
    </Pressable>
  );
}

export function DestinationCard({ destination, fromPrice, width = 160, height = 210 }: { destination: Destination; fromPrice?: number; width?: number | `${number}%`; height?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${destination.name}, ${destination.district}`}
      onPress={() => router.push(`/destinations/${destination.slug}`)}
      style={({ pressed }) => [{ width }, pressed && { opacity: 0.92 }]}
    >
      <SmartImage uri={destination.coverImage} width={500} label={destination.name} rounded={radius.xl} style={{ height }}>
        <View style={s.scrim} />
        <View style={s.destText}>
          <AppText variant="heading" color={colors.white}>
            {destination.name}
          </AppText>
          <AppText variant="small" color="rgba(255,255,255,0.85)" numberOfLines={1}>
            {fromPrice ? `From ${formatINR(fromPrice)}` : destination.district}
          </AppText>
        </View>
      </SmartImage>
    </Pressable>
  );
}

export function VehicleCard({ vehicle, operator }: { vehicle: Vehicle; operator?: Operator }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${vehicle.title}, ${vehicle.seatingCapacity} seats`}
      onPress={() => router.push(`/vehicles/${vehicle.id}`)}
      style={({ pressed }) => [s.vehicleCard, pressed && { opacity: 0.92 }]}
    >
      <SmartImage uri={vehicle.images[0]?.url} width={700} label={VEHICLE_CATEGORY_LABELS[vehicle.category]} style={{ height: 150 }}>
        <View style={s.topRow}>
          <Badge label={VEHICLE_CATEGORY_LABELS[vehicle.category]} tone="light" />
          {!vehicle.isAvailable && <Badge label="Unavailable" tone="dark" />}
        </View>
      </SmartImage>
      <View style={{ padding: spacing.lg, gap: 6 }}>
        <View style={[ui.row, { justifyContent: 'space-between' }]}>
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {vehicle.make} {vehicle.model}
          </AppText>
          <Rating value={vehicle.rating} count={vehicle.reviewCount} />
        </View>
        <View style={[ui.row, { gap: spacing.md, flexWrap: 'wrap' }]}>
          <Meta icon={<Users size={13} color={colors.muted} />} text={`${vehicle.seatingCapacity} seats`} />
          <Meta icon={<Snowflake size={13} color={colors.muted} />} text={vehicle.isAc ? 'AC' : 'Non-AC'} />
          <Meta icon={<MapPin size={13} color={colors.muted} />} text={vehicle.baseDistrict} />
        </View>
        <AppText variant="small" color={colors.muted} numberOfLines={1}>
          {vehicle.driverIncluded ? 'Driver included' : 'Self-drive'} · {operator?.businessName ?? ''}
        </AppText>
        <View style={[ui.row, { gap: 4 }]}>
          <AppText variant="heading" color={colors.forest}>
            {formatINR(vehicle.price)}
          </AppText>
          <AppText variant="small" color={colors.muted}>
            {PRICING_UNIT_LABELS[vehicle.pricingUnit]}
            {vehicle.pricingUnit === 'per_km' ? ` · min ${formatINR(vehicle.minimumCharge)}` : ''}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={[ui.row, { gap: 4 }]}>
      {icon}
      <AppText variant="small" color={colors.ink}>
        {text}
      </AppText>
    </View>
  );
}

export function TripCard({ trip, destination, operator, width }: { trip: ScheduledTrip; destination?: Destination; operator?: Operator; width?: number }) {
  const left = seatsLeft(trip);
  const soldOut = left === 0 || trip.status === 'sold_out';
  const fill = Math.min(1, trip.seatsBooked / Math.max(1, trip.totalSeats));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${formatDateRange(trip.departureDate, trip.returnDate)}, ${soldOut ? 'sold out' : `${left} seats left`}`}
      onPress={() => router.push(`/trips/${trip.id}`)}
      style={({ pressed }) => [s.tripCard, width ? { width } : null, pressed && { opacity: 0.92 }]}
    >
      <SmartImage uri={destination?.coverImage} width={400} label={destination?.name} rounded={radius.lg} style={{ width: 76, height: 92 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[ui.row, { gap: 6 }]}>
          <Badge label={soldOut ? 'Sold out' : TRIP_STATUS_LABELS[trip.status]} tone={soldOut ? 'grey' : trip.status === 'filling_fast' ? 'gold' : 'green'} />
        </View>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {trip.title}
        </AppText>
        <View style={[ui.row, { gap: 4 }]}>
          <CalendarDays size={13} color={colors.muted} />
          <AppText variant="small" color={colors.muted}>
            {formatDateRange(trip.departureDate, trip.returnDate)} · {trip.departureTime}
          </AppText>
        </View>
        <View style={[ui.row, { gap: 4 }]}>
          <Bus size={13} color={colors.muted} />
          <AppText variant="small" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
            From {trip.departureLocation}
            {operator ? ` · ${operator.businessName}` : ''}
          </AppText>
        </View>
        <View style={[ui.row, { justifyContent: 'space-between', marginTop: 2 }]}>
          <AppText variant="bodyStrong" color={colors.forest}>
            {formatINR(trip.pricePerPerson)}
            <AppText variant="small" color={colors.muted}> /person</AppText>
          </AppText>
          <AppText variant="smallStrong" color={soldOut ? colors.muted : left <= 5 ? colors.warning : colors.emerald}>
            {soldOut ? 'Full' : `${left} of ${trip.totalSeats} left`}
          </AppText>
        </View>
        <View style={s.seatBar}>
          <View style={[s.seatFill, { width: `${fill * 100}%`, backgroundColor: soldOut ? colors.faint : fill > 0.7 ? colors.gold : colors.emerald }]} />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fav: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  topRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  durationPill: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,42,30,0.72)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,30,20,0.28)' },
  destText: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  listCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.sm, borderWidth: 1, borderColor: colors.lineSoft, ...shadow.card },
  vehicleCard: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft, ...shadow.card },
  tripCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.lineSoft, ...shadow.card },
  seatBar: { height: 4, borderRadius: 2, backgroundColor: colors.lineSoft, overflow: 'hidden', marginTop: 4 },
  seatFill: { height: 4, borderRadius: 2 },
});
