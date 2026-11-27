import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, Sparkles } from 'lucide-react-native';
import { effectivePrice, formatINR } from '@travo/core';
import { Gallery } from '../../components/Gallery';
import { PackageListItem, TripCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Badge, Button, Card, Chip, Divider } from '../../components/ui';
import { useDestination, useOperatorMap, usePackages, useTrips } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';

export default function DestinationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useDestination(slug);
  const d = q.data;
  const packages = usePackages(d ? { destinationId: d.id } : { destinationId: '__none__' });
  const trips = useTrips(d ? { destinationId: d.id } : { destinationId: '__none__' });
  const opMap = useOperatorMap();
  const from = useMemo(() => Math.min(...(packages.data ?? []).map(effectivePrice)), [packages.data]);

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: 80 }}><ListSkeleton /></View>;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!d) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}><EmptyState title="Destination not found" action={{ label: 'Explore Kerala', onPress: () => router.replace('/explore') }} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: spacing.huge }}>
      <Gallery images={[d.coverImage, ...d.gallery]} label={d.name} height={300} shareText={`${d.name}, Kerala — ${d.tagline}`} />
      <View style={st.body}>
        <Badge label={d.district} />
        <AppText variant="display" style={{ marginTop: spacing.sm }}>{d.name}</AppText>
        <AppText variant="body" color={colors.muted}>{d.tagline}</AppText>
        {Number.isFinite(from) && (
          <AppText variant="bodyStrong" color={colors.forest} style={{ marginTop: spacing.sm }}>
            Trips from {formatINR(from)} per person
          </AppText>
        )}
        <AppText variant="body" color={colors.ink} style={{ marginTop: spacing.lg }}>{d.description}</AppText>
        <View style={st.inline}>
          <Calendar size={15} color={colors.emerald} />
          <AppText variant="small" color={colors.ink}>Best time to visit: {d.bestTimeToVisit}</AppText>
        </View>

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Best experiences</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {d.bestExperiences.map((e) => <Chip key={e} label={e} icon={<Sparkles size={13} color={colors.ink} />} />)}
        </View>

        <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>Top attractions</AppText>
        {d.attractions.map((a) => (
          <Card key={a.name} style={{ marginBottom: spacing.sm, flexDirection: 'row', gap: spacing.md }}>
            <MapPin size={18} color={colors.emerald} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{a.name}</AppText>
              <AppText variant="small" color={colors.muted}>{a.description}</AppText>
            </View>
          </Card>
        ))}

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Popular packages</AppText>
        {packages.isLoading ? (
          <ListSkeleton rows={2} />
        ) : (packages.data ?? []).length === 0 ? (
          <EmptyState title="No packages yet" message="Ask operators for a custom trip here." action={{ label: 'Request custom trip', onPress: () => router.push({ pathname: '/custom-trip', params: { destination: d.name } }) }} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {(packages.data ?? []).map((p) => <PackageListItem key={p.id} pkg={p} destination={d} operator={opMap.get(p.operatorId)} />)}
          </View>
        )}

        {(trips.data ?? []).length > 0 && (
          <>
            <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>Available trips</AppText>
            <View style={{ gap: spacing.md }}>
              {(trips.data ?? []).map((t) => <TripCard key={t.id} trip={t} destination={d} operator={opMap.get(t.operatorId)} />)}
            </View>
          </>
        )}
        <Button label={`Plan a private trip to ${d.name}`} kind="secondary" full style={{ marginTop: spacing.xl }} onPress={() => router.push({ pathname: '/custom-trip', params: { destination: d.name } })} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  body: { backgroundColor: colors.cream, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, marginTop: -20, padding: spacing.xl },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
});
