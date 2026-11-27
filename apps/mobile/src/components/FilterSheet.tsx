import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  DISTRICTS,
  PACKAGE_CATEGORIES,
  PACKAGE_CATEGORY_LABELS,
  VEHICLE_CATEGORIES,
  VEHICLE_CATEGORY_LABELS,
  formatDate,
  type Destination,
  type PackageFilters,
} from '@travo/core';
import { colors, spacing } from '../theme/tokens';
import { BottomSheet, CalendarSheet, PickerField, SelectSheet } from './forms';
import { AppText, Button, Chip, Divider, Stepper } from './ui';

const BUDGETS = [
  { label: 'Under ₹2,000', min: undefined, max: 2000 },
  { label: '₹2,000 – ₹7,500', min: 2000, max: 7500 },
  { label: '₹7,500 – ₹20,000', min: 7500, max: 20000 },
  { label: '₹20,000+', min: 20000, max: undefined },
] as const;

const DURATIONS = [
  { label: 'Day trip', min: 1, max: 1 },
  { label: '2–3 days', min: 2, max: 3 },
  { label: '4–5 days', min: 4, max: 5 },
  { label: '6+ days', min: 6, max: undefined },
] as const;

export function countActiveFilters(f: PackageFilters): number {
  return [
    f.destinationId,
    f.pickupDistrict,
    f.categories?.length,
    f.vehicleCategories?.length,
    f.tripType,
    f.minPrice != null || f.maxPrice != null,
    f.minDays != null || f.maxDays != null,
    f.travelDate,
    f.travellers && f.travellers > 1,
  ].filter(Boolean).length;
}

export function FilterSheet({ visible, onClose, value, onApply, destinations, resultCount }: { visible: boolean; onClose: () => void; value: PackageFilters; onApply: (f: PackageFilters) => void; destinations: Destination[]; resultCount?: number }) {
  const [f, setF] = useState<PackageFilters>(value);
  const [picker, setPicker] = useState<'dest' | 'pickup' | 'date' | null>(null);
  useEffect(() => {
    if (visible) setF(value);
  }, [visible, value]);

  const toggle = <K extends 'categories' | 'vehicleCategories'>(key: K, v: NonNullable<PackageFilters[K]>[number]) =>
    setF((cur) => {
      const list = (cur[key] ?? []) as string[];
      const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      return { ...cur, [key]: next.length ? next : undefined };
    });

  const destName = destinations.find((d) => d.id === f.destinationId)?.name ?? null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button label="Clear all" kind="outline" onPress={() => setF({ sort: f.sort, query: f.query })} style={{ flex: 1 }} />
          <Button
            label={resultCount != null ? 'Show results' : 'Apply'}
            onPress={() => {
              onApply(f);
              onClose();
            }}
            style={{ flex: 2 }}
          />
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} style={{ maxHeight: 560 }}>
        <PickerField label="Destination" value={destName} placeholder="Anywhere in Kerala" onPress={() => setPicker('dest')} />
        <PickerField label="Pickup district" value={f.pickupDistrict ?? null} placeholder="Any district" onPress={() => setPicker('pickup')} />
        <PickerField label="Travel date" value={f.travelDate ? formatDate(f.travelDate) : null} placeholder="Flexible" onPress={() => setPicker('date')} />
        <Stepper label="Travellers" value={f.travellers ?? 1} onChange={(v) => setF({ ...f, travellers: v })} min={1} max={60} />

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Trip style</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {([undefined, 'private', 'group'] as const).map((t) => (
            <Chip key={t ?? 'any'} label={t === 'private' ? 'Private' : t === 'group' ? 'Group' : 'Any'} selected={f.tripType === t} onPress={() => setF({ ...f, tripType: t })} />
          ))}
        </View>

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Budget per person</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {BUDGETS.map((b) => {
            const on = f.minPrice === b.min && f.maxPrice === b.max;
            return <Chip key={b.label} label={b.label} selected={on} onPress={() => setF({ ...f, minPrice: on ? undefined : b.min, maxPrice: on ? undefined : b.max })} />;
          })}
        </View>

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Duration</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DURATIONS.map((d) => {
            const on = f.minDays === d.min && f.maxDays === d.max;
            return <Chip key={d.label} label={d.label} selected={on} onPress={() => setF({ ...f, minDays: on ? undefined : d.min, maxDays: on ? undefined : d.max })} />;
          })}
        </View>

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Category</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PACKAGE_CATEGORIES.map((c) => (
            <Chip key={c} label={PACKAGE_CATEGORY_LABELS[c]} selected={f.categories?.includes(c)} onPress={() => toggle('categories', c)} />
          ))}
        </View>

        <Divider />
        <AppText variant="heading" style={{ marginBottom: spacing.md }}>Vehicle type</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VEHICLE_CATEGORIES.map((c) => (
            <Chip key={c} label={VEHICLE_CATEGORY_LABELS[c]} selected={f.vehicleCategories?.includes(c)} onPress={() => toggle('vehicleCategories', c)} />
          ))}
        </View>
        <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.lg }}>
          Packages that run on request any day are shown for all dates.
        </AppText>
      </ScrollView>

      <SelectSheet
        visible={picker === 'dest'}
        onClose={() => setPicker(null)}
        title="Destination"
        allowClear
        value={f.destinationId ?? null}
        options={destinations.map((d) => ({ value: d.id, label: d.name, hint: d.district }))}
        onSelect={(v) => setF({ ...f, destinationId: v ?? undefined })}
      />
      <SelectSheet
        visible={picker === 'pickup'}
        onClose={() => setPicker(null)}
        title="Pickup district"
        allowClear
        value={f.pickupDistrict ?? null}
        options={DISTRICTS.map((d) => ({ value: d, label: d }))}
        onSelect={(v) => setF({ ...f, pickupDistrict: v ?? undefined })}
      />
      <CalendarSheet visible={picker === 'date'} onClose={() => setPicker(null)} value={f.travelDate} onSelect={(d) => setF({ ...f, travelDate: d })} />
    </BottomSheet>
  );
}
