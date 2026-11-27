import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { VEHICLE_CATEGORIES, VEHICLE_CATEGORY_LABELS, type VehicleCategory } from '@travo/core';
import { ScreenHeader } from '../../components/Screen';
import { VehicleCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { Button, Chip } from '../../components/ui';
import { useOperatorMap, useVehicles } from '../../lib/queries';
import { colors, spacing } from '../../theme/tokens';

const SEATS = [
  { label: 'Any size', min: undefined },
  { label: '5+ seats', min: 5 },
  { label: '10+ seats', min: 10 },
  { label: '20+ seats', min: 20 },
  { label: '40+ seats', min: 40 },
] as const;

export default function Vehicles() {
  const [category, setCategory] = useState<VehicleCategory | null>(null);
  const [minSeats, setMinSeats] = useState<number | undefined>(undefined);
  const [acOnly, setAcOnly] = useState(false);
  const q = useVehicles({ categories: category ? [category] : undefined, minSeats, acOnly });
  const opMap = useOperatorMap();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title="Vehicles with driver" subtitle={q.data ? `${q.data.length} listed by local owners & fleets` : 'Loading…'} />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.md }}>
          <Chip label="All types" selected={!category} onPress={() => setCategory(null)} />
          {VEHICLE_CATEGORIES.map((c) => <Chip key={c} label={VEHICLE_CATEGORY_LABELS[c]} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.md }}>
          {SEATS.map((s) => <Chip key={s.label} label={s.label} selected={minSeats === s.min} onPress={() => setMinSeats(s.min)} />)}
          <Chip label="AC only" selected={acOnly} onPress={() => setAcOnly(!acOnly)} />
        </ScrollView>
      </View>
      {q.isLoading ? (
        <ListSkeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={q.data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, gap: spacing.lg, flexGrow: 1 }}
          renderItem={({ item }) => <VehicleCard vehicle={item} operator={opMap.get(item.operatorId)} />}
          ListEmptyComponent={<EmptyState title="No vehicles match" message="Try a different type or size." action={{ label: 'Request a custom quote', onPress: () => router.push('/custom-trip') }} />}
          ListFooterComponent={<Button label="Can’t find one? Request a custom trip" kind="secondary" full onPress={() => router.push('/custom-trip')} />}
        />
      )}
    </View>
  );
}
