import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, MapPin, Navigation, Search, Users } from 'lucide-react-native';
import { DISTRICTS, formatDateShort, type District } from '@travo/core';
import { colors, font, radius, shadow, spacing } from '../theme/tokens';
import { BottomSheet, CalendarSheet, SelectSheet } from './forms';
import { AppText, Button, Stepper, styles as ui } from './ui';

/** Home search: destination, pickup, date and travellers → package results. */
export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [pickup, setPickup] = useState<District | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [travellers, setTravellers] = useState(2);
  const [sheet, setSheet] = useState<'pickup' | 'date' | 'people' | null>(null);

  const submit = () => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (pickup) params.pickup = pickup;
    if (date) params.date = date;
    params.travellers = String(travellers);
    router.push({ pathname: '/packages', params });
  };

  return (
    <View style={s.panel}>
      <View style={s.searchRow}>
        <Search size={18} color={colors.emerald} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Where do you want to go?"
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          onSubmitEditing={submit}
          accessibilityLabel="Destination"
          style={s.input}
        />
      </View>
      <View style={s.grid}>
        <Field icon={<Navigation size={15} color={colors.emerald} />} label="Pickup" value={pickup ?? 'Any district'} onPress={() => setSheet('pickup')} />
        <View style={s.vline} />
        <Field icon={<CalendarDays size={15} color={colors.emerald} />} label="Date" value={date ? formatDateShort(date) : 'Flexible'} onPress={() => setSheet('date')} />
        <View style={s.vline} />
        <Field icon={<Users size={15} color={colors.emerald} />} label="Travellers" value={`${travellers}`} onPress={() => setSheet('people')} />
      </View>
      <Button label="Search trips" icon={<Search size={17} color={colors.white} />} onPress={submit} full style={{ marginTop: spacing.md }} />

      <SelectSheet
        visible={sheet === 'pickup'}
        onClose={() => setSheet(null)}
        title="Pickup district"
        allowClear
        value={pickup}
        options={DISTRICTS.map((d) => ({ value: d, label: d }))}
        onSelect={(v) => setPickup(v)}
      />
      <CalendarSheet visible={sheet === 'date'} onClose={() => setSheet(null)} value={date} onSelect={setDate} />
      <BottomSheet
        visible={sheet === 'people'}
        onClose={() => setSheet(null)}
        title="Travellers"
        footer={<Button label="Done" full onPress={() => setSheet(null)} />}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Stepper label="Travellers" hint="Adults and children" value={travellers} onChange={setTravellers} min={1} max={60} />
        </View>
      </BottomSheet>
    </View>
  );
}

function Field({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={({ pressed }) => [s.field, pressed && { opacity: 0.7 }]}>
      <View style={[ui.row, { gap: 4 }]}>
        {icon}
        <AppText variant="caption" color={colors.muted}>
          {label.toUpperCase()}
        </AppText>
      </View>
      <AppText variant="smallStrong" numberOfLines={1} style={{ marginTop: 3 }}>
        {value}
      </AppText>
    </Pressable>
  );
}

export function PickupHint() {
  return (
    <View style={[ui.row, { gap: 4 }]}>
      <MapPin size={12} color={colors.muted} />
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: colors.white, borderRadius: radius.xxl, padding: spacing.lg, marginHorizontal: spacing.xl, marginTop: -64, ...shadow.card, borderWidth: 1, borderColor: colors.lineSoft },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 50, borderRadius: radius.lg, backgroundColor: colors.sandSoft, paddingHorizontal: spacing.md },
  input: { flex: 1, ...font.body, color: colors.charcoal, paddingVertical: 0, height: '100%' },
  grid: { flexDirection: 'row', marginTop: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg },
  field: { flex: 1, paddingVertical: 10, paddingHorizontal: 10 },
  vline: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line },
});
