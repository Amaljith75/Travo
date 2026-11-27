import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Info } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { isDemoMode } from '../lib/data';
import { AppText, IconButton } from './ui';

export function ScreenHeader({ title, subtitle, right, back = true }: { title: string; subtitle?: string; right?: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
      {back && (
        <IconButton label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={18} color={colors.charcoal} />
        </IconButton>
      )}
      <View style={{ flex: 1 }}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1 }}>
        <AppText variant="display">{title}</AppText>
        {subtitle && (
          <AppText variant="body" color={colors.muted} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

export function DemoNotice({ text }: { text?: string }) {
  if (!isDemoMode) return null;
  return (
    <View style={s.demo} accessibilityRole="text">
      <Info size={15} color={colors.info} />
      <AppText variant="small" color={colors.info} style={{ flex: 1 }}>
        {text ?? 'Demo mode: operators and bookings are sample data, saved only on this device.'}
      </AppText>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.cream, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  demo: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.infoSoft, padding: spacing.md, borderRadius: radius.lg, marginHorizontal: spacing.xl, marginVertical: spacing.sm },
});
