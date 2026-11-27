import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { DISTRICTS, type District } from '@travo/core';
import { TabHeader } from '../../components/Screen';
import { TripCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { Chip } from '../../components/ui';
import { useDestinationMap, useOperatorMap, useTrips } from '../../lib/queries';
import { colors, spacing } from '../../theme/tokens';

export default function Trips() {
  const [from, setFrom] = useState<District | null>(null);
  const trips = useTrips({ departureDistrict: from ?? undefined });
  const all = useTrips({});
  const destMap = useDestinationMap();
  const opMap = useOperatorMap();
  const districts = DISTRICTS.filter((d) => (all.data ?? []).some((t) => t.departureDistrict === d));

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TabHeader title="Scheduled trips" subtitle="Fixed-date group departures — book by the seat" />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md }}>
          <Chip label="Departing anywhere" selected={!from} onPress={() => setFrom(null)} />
          {districts.map((d) => <Chip key={d} label={`From ${d}`} selected={from === d} onPress={() => setFrom(from === d ? null : d)} />)}
        </ScrollView>
      </View>
      {trips.isLoading ? (
        <ListSkeleton />
      ) : trips.error ? (
        <ErrorState error={trips.error} onRetry={() => trips.refetch()} />
      ) : (
        <FlatList
          data={trips.data}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xs, gap: spacing.md, flexGrow: 1 }}
          renderItem={({ item }) => <TripCard trip={item} destination={destMap.get(item.destinationId)} operator={opMap.get(item.operatorId)} />}
          ListEmptyComponent={<EmptyState title="No upcoming departures" message="Try another pickup district or check back soon — operators add trips every week." />}
          refreshing={trips.isRefetching}
          onRefresh={() => trips.refetch()}
        />
      )}
    </View>
  );
}
