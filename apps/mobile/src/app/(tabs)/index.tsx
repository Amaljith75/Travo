import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgePercent, Bus, Car, Flame, Landmark, Mountain, Sun, Tent, Users } from 'lucide-react-native';
import { effectivePrice, HERO_IMAGE, type PackageCategory, type TravelPackage } from '@travo/core';
import { SmartImage } from '../../components/SmartImage';
import { SearchPanel } from '../../components/SearchPanel';
import { DestinationCard, PackageCard, TripCard } from '../../components/cards';
import { CardSkeletonRow, ErrorState } from '../../components/states';
import { AppText, SectionHeader, styles as ui } from '../../components/ui';
import { DemoNotice } from '../../components/Screen';
import { useDestinationMap, useDestinations, useOperatorMap, usePackages, useTrips } from '../../lib/queries';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

const QUICK: { label: string; icon: typeof Sun; params: Record<string, string> }[] = [
  { label: 'One-day', icon: Sun, params: { category: 'one_day' } },
  { label: 'Weekend', icon: Mountain, params: { category: 'weekend' } },
  { label: 'Group', icon: Users, params: { tripType: 'group' } },
  { label: 'Adventure', icon: Tent, params: { category: 'adventure' } },
  { label: 'Pilgrimage', icon: Landmark, params: { category: 'pilgrimage' } },
  { label: 'Vehicles', icon: Car, params: {} },
];

function Carousel({ data, loading, error, onRetry, render, width = 270 }: { data?: TravelPackage[]; loading: boolean; error: unknown; onRetry: () => void; render: (p: TravelPackage) => React.ReactElement; width?: number }) {
  if (loading) return <CardSkeletonRow width={width} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!data?.length) return <AppText variant="small" color={colors.muted} style={{ paddingHorizontal: spacing.xl }}>Nothing here yet — check back soon.</AppText>;
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => render(item)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}
    />
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const all = usePackages({ sort: 'recommended' });
  const destinations = useDestinations();
  const trips = useTrips({});
  const destMap = useDestinationMap();
  const opMap = useOperatorMap();

  const sections = useMemo(() => {
    const list = all.data ?? [];
    const by = (c: PackageCategory) => list.filter((p) => p.categories.includes(c));
    return {
      popular: [...list].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 8),
      trending: list.filter((p) => p.isTrending),
      weekend: by('weekend'),
      oneDay: by('one_day'),
      group: list.filter((p) => p.tripType === 'group'),
      privateVehicle: list.filter((p) => p.tripType === 'private' && ['sedan', 'suv', 'muv', 'premium', 'hatchback'].includes(p.vehicleCategory)),
      recent: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
      offers: list.filter((p) => p.discountPercent > 0),
      recommended: list.filter((p) => p.rating >= 4.8).slice(0, 6),
    };
  }, [all.data]);

  const fromPrice = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all.data ?? []) {
      for (const id of [p.destinationId, ...p.additionalDestinationIds]) {
        const price = effectivePrice(p);
        m.set(id, Math.min(m.get(id) ?? Infinity, price));
      }
    }
    return m;
  }, [all.data]);

  const card = (p: TravelPackage) => <PackageCard pkg={p} destination={destMap.get(p.destinationId)} operator={opMap.get(p.operatorId)} />;
  const common = { loading: all.isLoading, error: all.error, onRetry: () => all.refetch() };
  const featuredDest = (destinations.data ?? []).filter((d) => d.isFeatured);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: spacing.huge }}>
      <SmartImage uri={HERO_IMAGE} width={1400} style={{ height: 340 }}>
        <LinearGradient colors={['rgba(10,30,20,0.55)', 'rgba(10,30,20,0.05)', 'rgba(10,30,20,0.6)']} style={StyleSheet.absoluteFill} />
        <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl }}>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">TRAVO · KERALA</AppText>
          <AppText variant="display" color={colors.white} style={{ marginTop: spacing.sm, maxWidth: 300 }}>
            Trips, tours and rides across God’s Own Country
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.9)" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
            Compare trusted local agencies, operators and vehicle owners.
          </AppText>
        </View>
      </SmartImage>

      <SearchPanel />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingVertical: spacing.xl }}>
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            accessibilityRole="button"
            onPress={() => (q.label === 'Vehicles' ? router.push('/vehicles') : router.push({ pathname: '/packages', params: q.params }))}
            style={({ pressed }) => [st.quick, pressed && { opacity: 0.8 }]}
          >
            <View style={st.quickIcon}>
              <q.icon size={20} color={colors.forest} />
            </View>
            <AppText variant="smallStrong">{q.label}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      <DemoNotice />

      <SectionHeader title="Featured destinations" subtitle="Hills, backwaters and beaches" action="See all" onAction={() => router.push('/explore')} style={{ marginTop: spacing.lg }} />
      {destinations.isLoading ? (
        <CardSkeletonRow width={160} height={210} />
      ) : destinations.error ? (
        <ErrorState error={destinations.error} onRetry={() => destinations.refetch()} />
      ) : (
        <FlatList
          horizontal
          data={featuredDest}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DestinationCard destination={item} fromPrice={fromPrice.get(item.id)} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
        />
      )}

      <Section title="Popular packages" subtitle="Most booked by travellers" params={{ sort: 'popular' }}>
        <Carousel data={sections.popular} {...common} render={card} />
      </Section>

      <Section title="Trending now" params={{ trending: '1' }}>
        <Carousel data={sections.trending} {...common} render={card} />
      </Section>

      {sections.offers.length > 0 && (
        <Pressable onPress={() => router.push({ pathname: '/packages', params: { offers: '1' } })} style={st.offer} accessibilityRole="button">
          <View style={st.offerIcon}>
            <BadgePercent size={22} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading" color={colors.white}>Special offers</AppText>
            <AppText variant="small" color="rgba(255,255,255,0.85)">
              Up to {Math.max(...sections.offers.map((p) => p.discountPercent))}% off on {sections.offers.length} packages this season
            </AppText>
          </View>
        </Pressable>
      )}

      <Section title="Weekend getaways" subtitle="Leave Friday, back Sunday" params={{ category: 'weekend' }}>
        <Carousel data={sections.weekend} {...common} render={card} />
      </Section>

      <Section title="One-day trips" subtitle="Back home by evening" params={{ category: 'one_day' }}>
        <Carousel data={sections.oneDay} {...common} render={card} />
      </Section>

      <SectionHeader title="Upcoming group departures" subtitle="Join a scheduled trip — pay per seat" action="All trips" onAction={() => router.push('/trips')} style={{ marginTop: spacing.xxl }} />
      {trips.isLoading ? (
        <CardSkeletonRow width={320} height={120} count={2} />
      ) : trips.error ? (
        <ErrorState error={trips.error} onRetry={() => trips.refetch()} />
      ) : (
        <FlatList
          horizontal
          data={(trips.data ?? []).slice(0, 6)}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TripCard trip={item} destination={destMap.get(item.destinationId)} operator={opMap.get(item.operatorId)} width={320} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 4 }}
        />
      )}

      <Section title="Group trips" params={{ tripType: 'group' }}>
        <Carousel data={sections.group} {...common} render={card} />
      </Section>

      <Pressable onPress={() => router.push('/vehicles')} style={st.vehicleBanner} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.emerald}>VEHICLE MARKETPLACE</AppText>
          <AppText variant="heading" style={{ marginTop: 4 }}>Hire a car, tempo traveller or bus</AppText>
          <AppText variant="small" color={colors.muted} style={{ marginTop: 4 }}>
            Direct from local owners and fleet operators, driver included.
          </AppText>
        </View>
        <View style={st.vehicleIcon}>
          <Bus size={26} color={colors.forest} />
        </View>
      </Pressable>

      <Section title="Private vehicle trips" subtitle="Your own car and driver" params={{ tripType: 'private' }}>
        <Carousel data={sections.privateVehicle} {...common} render={card} />
      </Section>

      <Section title="Recommended experiences" subtitle="Rated 4.8 and above">
        <Carousel data={sections.recommended} {...common} render={card} />
      </Section>

      <Section title="Recently added" params={{ sort: 'recent' }}>
        <Carousel data={sections.recent} {...common} render={card} />
      </Section>

      <Pressable onPress={() => router.push('/custom-trip')} style={st.custom} accessibilityRole="button">
        <Flame size={20} color={colors.forest} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">Can’t find the right trip?</AppText>
          <AppText variant="small" color={colors.muted}>Tell us your route and dates — operators will send quotes.</AppText>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, subtitle, params, children }: { title: string; subtitle?: string; params?: Record<string, string>; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <SectionHeader title={title} subtitle={subtitle} action={params ? 'See all' : undefined} onAction={params ? () => router.push({ pathname: '/packages', params }) : undefined} />
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  quick: { alignItems: 'center', gap: 6, width: 72 },
  quickIcon: { width: 56, height: 56, borderRadius: radius.xl, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineSoft, ...shadow.card },
  offer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.forest },
  offerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  vehicleBanner: { ...ui.row, gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.sandSoft, borderWidth: 1, borderColor: colors.sand },
  vehicleIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  custom: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
});
