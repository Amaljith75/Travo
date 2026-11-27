import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Car } from 'lucide-react-native';
import { DISTRICTS, effectivePrice, PACKAGE_CATEGORIES, PACKAGE_CATEGORY_LABELS, type District } from '@travo/core';
import { TabHeader } from '../../components/Screen';
import { DestinationCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Chip, SectionHeader } from '../../components/ui';
import { useDestinations, usePackages } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';

export default function Explore() {
  const destinations = useDestinations();
  const packages = usePackages();
  const [district, setDistrict] = useState<District | null>(null);

  const fromPrice = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of packages.data ?? []) for (const id of [p.destinationId, ...p.additionalDestinationIds]) m.set(id, Math.min(m.get(id) ?? Infinity, effectivePrice(p)));
    return m;
  }, [packages.data]);

  const list = (destinations.data ?? []).filter((d) => !district || d.district === district);
  const districtsWithDest = new Set((destinations.data ?? []).map((d) => d.district));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: spacing.huge }}>
      <TabHeader title="Explore Kerala" subtitle="14 districts, endless experiences" />

      <AppText variant="heading" style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, marginBottom: spacing.md }}>Browse by trip type</AppText>
      <View style={st.catGrid}>
        {PACKAGE_CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => router.push({ pathname: '/packages', params: { category: c } })} style={({ pressed }) => [st.cat, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            <AppText variant="smallStrong" color={colors.forest} numberOfLines={1}>{PACKAGE_CATEGORY_LABELS[c]}</AppText>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.push('/vehicles')} style={st.vehicles} accessibilityRole="button">
        <Car size={22} color={colors.white} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" color={colors.white}>Vehicle marketplace</AppText>
          <AppText variant="small" color="rgba(255,255,255,0.85)">Cars, tempo travellers, buses & coaches with drivers</AppText>
        </View>
      </Pressable>

      <SectionHeader title="Destinations" subtitle="Filter by district" style={{ marginTop: spacing.xxl }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.lg }}>
        <Chip label="All districts" selected={!district} onPress={() => setDistrict(null)} />
        {DISTRICTS.filter((d) => districtsWithDest.has(d)).map((d) => (
          <Chip key={d} label={d} selected={district === d} onPress={() => setDistrict(district === d ? null : d)} />
        ))}
      </ScrollView>

      {destinations.isLoading ? (
        <ListSkeleton />
      ) : destinations.error ? (
        <ErrorState error={destinations.error} onRetry={() => destinations.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No destinations yet" message="We’re adding more places in this district soon." />
      ) : (
        <View style={st.grid}>
          {list.map((d) => (
            <View key={d.id} style={{ width: '48%' }}>
              <DestinationCard destination={d} fromPrice={fromPrice.get(d.id)} width="100%" height={200} />
              <AppText variant="small" color={colors.muted} numberOfLines={2} style={{ marginTop: 6, paddingHorizontal: 2 }}>{d.tagline}</AppText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl },
  cat: { width: '31.5%', paddingVertical: 14, paddingHorizontal: 8, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center' },
  vehicles: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.emerald },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.xl, paddingHorizontal: spacing.xl },
});
