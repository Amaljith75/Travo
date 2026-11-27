import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OPERATOR_TYPE_LABELS } from '@travo/core';
import { ScreenHeader } from '../../components/Screen';
import { OperatorCard } from '../../components/OperatorCard';
import { PackageListItem, VehicleCard } from '../../components/cards';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText } from '../../components/ui';
import { useDestinationMap, useOperator, usePackages, useVehicles } from '../../lib/queries';
import { colors, spacing } from '../../theme/tokens';

export default function OperatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useOperator(id);
  const packages = usePackages({ operatorId: id });
  const vehicles = useVehicles({ operatorId: id });
  const destMap = useDestinationMap();
  const o = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title={o?.businessName ?? 'Operator'} subtitle={o ? OPERATOR_TYPE_LABELS[o.type] : undefined} />
      {q.isLoading ? (
        <ListSkeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !o ? (
        <EmptyState title="Operator not found" action={{ label: 'Back', onPress: () => router.back() }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.huge }}>
          <OperatorCard operator={o} message={`Hi ${o.businessName}, I found you on Travo.`} />
          <AppText variant="body" color={colors.ink}>{o.description}</AppText>
          <AppText variant="small" color={colors.muted}>{o.yearsInBusiness} years in business · {o.address}</AppText>
          {(packages.data ?? []).length > 0 && <AppText variant="heading" style={{ marginTop: spacing.lg }}>Packages</AppText>}
          {(packages.data ?? []).map((p) => <PackageListItem key={p.id} pkg={p} destination={destMap.get(p.destinationId)} operator={o} />)}
          {(vehicles.data ?? []).length > 0 && <AppText variant="heading" style={{ marginTop: spacing.lg }}>Vehicles</AppText>}
          {(vehicles.data ?? []).map((v) => <VehicleCard key={v.id} vehicle={v} operator={o} />)}
        </ScrollView>
      )}
    </View>
  );
}
