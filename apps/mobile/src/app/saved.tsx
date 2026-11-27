import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ScreenHeader } from '../components/Screen';
import { PackageListItem } from '../components/cards';
import { EmptyState, ListSkeleton } from '../components/states';
import { useFavourites } from '../lib/local';
import { useDestinationMap, useOperatorMap, usePackages } from '../lib/queries';
import { colors, spacing } from '../theme/tokens';

export default function Saved() {
  const { favourites } = useFavourites();
  const q = usePackages();
  const destMap = useDestinationMap();
  const opMap = useOperatorMap();
  const list = (q.data ?? []).filter((p) => favourites.includes(p.id));
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title="Saved trips" subtitle="Stored on this device" />
      {q.isLoading ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, flexGrow: 1 }}
          renderItem={({ item }) => <PackageListItem pkg={item} destination={destMap.get(item.destinationId)} operator={opMap.get(item.operatorId)} />}
          ListEmptyComponent={<EmptyState icon={<Heart size={26} color={colors.emerald} />} title="Nothing saved yet" message="Tap the heart on any trip to save it for later." action={{ label: 'Browse trips', onPress: () => router.push('/packages') }} />}
        />
      )}
    </View>
  );
}
