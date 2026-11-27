import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react-native';
import {
  DISTRICTS,
  PACKAGE_CATEGORIES,
  PACKAGE_CATEGORY_LABELS,
  PACKAGE_SORT_LABELS,
  PACKAGE_SORTS,
  type District,
  type PackageCategory,
  type PackageFilters,
  type PackageSort,
} from '@travo/core';
import { ScreenHeader } from '../../components/Screen';
import { PackageListItem } from '../../components/cards';
import { countActiveFilters, FilterSheet } from '../../components/FilterSheet';
import { SelectSheet } from '../../components/forms';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/states';
import { AppText, Chip, styles as ui } from '../../components/ui';
import { useDebounced } from '../../lib/local';
import { useDestinationMap, useDestinations, useOperatorMap, usePackages } from '../../lib/queries';
import { colors, font, radius, spacing } from '../../theme/tokens';

type Params = { q?: string; pickup?: string; date?: string; travellers?: string; category?: string; tripType?: string; sort?: string; trending?: string; featured?: string; destinationId?: string; offers?: string };

function fromParams(p: Params): PackageFilters {
  return {
    query: p.q || undefined,
    pickupDistrict: DISTRICTS.includes(p.pickup as District) ? (p.pickup as District) : undefined,
    travelDate: p.date || undefined,
    travellers: p.travellers ? Number(p.travellers) : undefined,
    categories: PACKAGE_CATEGORIES.includes(p.category as PackageCategory) ? [p.category as PackageCategory] : undefined,
    tripType: p.tripType === 'group' || p.tripType === 'private' ? p.tripType : undefined,
    sort: PACKAGE_SORTS.includes(p.sort as PackageSort) ? (p.sort as PackageSort) : 'recommended',
    trendingOnly: p.trending === '1' || undefined,
    featuredOnly: p.featured === '1' || undefined,
    destinationId: p.destinationId || undefined,
  };
}

export default function PackagesScreen() {
  const params = useLocalSearchParams<Params>();
  const [filters, setFilters] = useState<PackageFilters>(() => fromParams(params));
  const [offersOnly, setOffersOnly] = useState(params.offers === '1');
  const [text, setText] = useState(filters.query ?? '');
  const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);
  const query = useDebounced(text, 300);
  const effective = useMemo(() => ({ ...filters, query: query.trim() || undefined }), [filters, query]);

  const result = usePackages(effective);
  const destinations = useDestinations();
  const destMap = useDestinationMap();
  const opMap = useOperatorMap();
  const data = useMemo(() => (offersOnly ? (result.data ?? []).filter((p) => p.discountPercent > 0) : result.data ?? []), [result.data, offersOnly]);
  const active = countActiveFilters(filters) + (offersOnly ? 1 : 0);

  const quickCats: PackageCategory[] = ['one_day', 'weekend', 'family', 'honeymoon', 'adventure', 'group', 'luxury', 'budget'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title="Find your trip" subtitle={result.data ? `${data.length} packages` : 'Searching…'} />
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <View style={st.search}>
          <Search size={18} color={colors.emerald} />
          <TextInput value={text} onChangeText={setText} placeholder="Destination, package or district" placeholderTextColor={colors.faint} style={st.input} returnKeyType="search" accessibilityLabel="Search packages" />
          {text.length > 0 && (
            <Pressable onPress={() => setText('')} hitSlop={10} accessibilityLabel="Clear search">
              <X size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.md }}>
        <Chip label={active ? `Filters · ${active}` : 'Filters'} selected={active > 0} icon={<SlidersHorizontal size={14} color={active ? colors.white : colors.ink} />} onPress={() => setSheet('filters')} />
        <Chip label={PACKAGE_SORT_LABELS[filters.sort ?? 'recommended']} icon={<ArrowUpDown size={14} color={colors.ink} />} onPress={() => setSheet('sort')} />
        {offersOnly && <Chip label="Offers" selected onPress={() => setOffersOnly(false)} icon={<X size={12} color={colors.white} />} />}
        {quickCats.map((c) => {
          const on = filters.categories?.includes(c) ?? false;
          return (
            <Chip
              key={c}
              label={PACKAGE_CATEGORY_LABELS[c]}
              selected={on}
              onPress={() => setFilters((f) => {
                const list = f.categories ?? [];
                const next = on ? list.filter((x) => x !== c) : [...list, c];
                return { ...f, categories: next.length ? next : undefined };
              })}
            />
          );
        })}
      </ScrollView>

      {result.isLoading ? (
        <ListSkeleton />
      ) : result.error ? (
        <ErrorState error={result.error} onRetry={() => result.refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xs, gap: spacing.md, flexGrow: 1 }}
          renderItem={({ item }) => <PackageListItem pkg={item} destination={destMap.get(item.destinationId)} operator={opMap.get(item.operatorId)} />}
          ListEmptyComponent={
            <EmptyState
              title="No trips match"
              message="Try a different destination, widen your budget or clear some filters."
              action={{ label: 'Clear filters', onPress: () => { setFilters({ sort: filters.sort }); setText(''); setOffersOnly(false); } }}
            />
          }
          ListFooterComponent={data.length ? <AppText variant="small" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.md }}>Prices are per person and indicative until the operator confirms.</AppText> : undefined}
        />
      )}

      <FilterSheet visible={sheet === 'filters'} onClose={() => setSheet(null)} value={filters} onApply={setFilters} destinations={destinations.data ?? []} resultCount={data.length} />
      <SelectSheet
        visible={sheet === 'sort'}
        onClose={() => setSheet(null)}
        title="Sort by"
        value={filters.sort ?? 'recommended'}
        options={PACKAGE_SORTS.map((s) => ({ value: s, label: PACKAGE_SORT_LABELS[s] }))}
        onSelect={(v) => setFilters((f) => ({ ...f, sort: v ?? 'recommended' }))}
      />
    </View>
  );
}

const st = StyleSheet.create({
  search: { ...ui.row, gap: spacing.sm, height: 48, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md },
  input: { flex: 1, ...font.body, color: colors.charcoal, paddingVertical: 0, height: '100%' },
});
