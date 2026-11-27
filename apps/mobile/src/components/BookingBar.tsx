import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, spacing } from '../theme/tokens';
import { AppText, Button } from './ui';

/** Sticky bottom bar with price and primary action. */
export function BookingBar({ price, unit = '/person', strike, caption, label, onPress, disabled }: { price: string; unit?: string; strike?: string; caption?: string; label: string; onPress: () => void; disabled?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={{ flex: 1 }}>
        {strike && (
          <AppText variant="small" color={colors.faint} style={{ textDecorationLine: 'line-through' }}>
            {strike}
          </AppText>
        )}
        <AppText variant="title" color={colors.forest}>
          {price}
          <AppText variant="small" color={colors.muted}> {unit}</AppText>
        </AppText>
        {caption && <AppText variant="small" color={colors.muted} numberOfLines={1}>{caption}</AppText>}
      </View>
      <Button label={label} size="lg" onPress={onPress} disabled={disabled} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, ...shadow.floating },
});
