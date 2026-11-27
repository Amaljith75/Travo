import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Minus, Plus, Star } from 'lucide-react-native';
import { colors, font, radius, shadow, spacing } from '../theme/tokens';

type Variant = keyof typeof font;

export function AppText({ variant = 'body', color = colors.charcoal, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...rest} style={[font[variant], { color }, style]} />;
}

type ButtonKind = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  kind?: ButtonKind;
  icon?: ReactNode;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}

const btnColors: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.forest, fg: colors.white, border: colors.forest },
  secondary: { bg: colors.emeraldSoft, fg: colors.forest, border: colors.emeraldSoft },
  outline: { bg: 'transparent', fg: colors.forest, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.emerald, border: 'transparent' },
  whatsapp: { bg: '#1F7A4D', fg: colors.white, border: '#1F7A4D' },
};

export function Button({ label, kind = 'primary', icon, loading, size = 'md', style, full, disabled, ...rest }: ButtonProps) {
  const c = btnColors[kind];
  const h = size === 'lg' ? 54 : size === 'sm' ? 36 : 46;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || loading, busy: loading }}
      disabled={disabled || loading}
      {...rest}
      style={({ pressed }) => [
        styles.btn,
        { height: h, backgroundColor: c.bg, borderColor: c.border, paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl },
        full && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={c.fg} /> : icon}
      <AppText variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} color={c.fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconButton({ children, onPress, label, style, tone = 'light' }: { children: ReactNode; onPress?: () => void; label: string; style?: StyleProp<ViewStyle>; tone?: 'light' | 'glass' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, tone === 'glass' && styles.iconBtnGlass, pressed && { opacity: 0.7 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, style }: { label: string; selected?: boolean; onPress?: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && { opacity: 0.8 }, style]}
    >
      {icon}
      <AppText variant="smallStrong" color={selected ? colors.white : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

const badgeTones = {
  green: { bg: colors.emeraldSoft, fg: colors.forest },
  sand: { bg: colors.sandSoft, fg: '#7A5B23' },
  gold: { bg: '#FBF1DD', fg: '#8A5A0B' },
  red: { bg: colors.dangerSoft, fg: colors.danger },
  blue: { bg: colors.infoSoft, fg: colors.info },
  grey: { bg: '#EEF0F1', fg: colors.muted },
  dark: { bg: 'rgba(15,42,30,0.78)', fg: colors.white },
  light: { bg: 'rgba(255,255,255,0.92)', fg: colors.forest },
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ label, tone = 'green', icon, style }: { label: string; tone?: BadgeTone; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon}
      <AppText variant="caption" color={t.fg} style={{ textTransform: 'uppercase' }}>
        {label}
      </AppText>
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: spacing.lg }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.lg }, style]} />;
}

export function Rating({ value, count, size = 'sm', color = colors.charcoal }: { value: number; count?: number; size?: 'sm' | 'md'; color?: string }) {
  if (!value) return <AppText variant="small" color={colors.muted}>New</AppText>;
  return (
    <View style={styles.row} accessibilityLabel={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <Star size={size === 'md' ? 16 : 13} color={colors.gold} fill={colors.gold} />
      <AppText variant={size === 'md' ? 'bodyStrong' : 'smallStrong'} color={color} style={{ marginLeft: 4 }}>
        {value.toFixed(1)}
      </AppText>
      {count != null && (
        <AppText variant="small" color={color === colors.charcoal ? colors.muted : color} style={{ marginLeft: 4 }}>
          ({count})
        </AppText>
      )}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 50, label, hint }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; hint?: string }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: spacing.sm }]}>
      <View>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint && <AppText variant="small" color={colors.muted}>{hint}</AppText>}
      </View>
      <View style={[styles.row, { gap: spacing.md }]}>
        <IconButton label={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - 1))} style={[styles.stepBtn, value <= min && { opacity: 0.35 }]}>
          <Minus size={16} color={colors.forest} />
        </IconButton>
        <AppText variant="heading" style={{ minWidth: 22, textAlign: 'center' }} accessibilityLiveRegion="polite">
          {value}
        </AppText>
        <IconButton label={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]}>
          <Plus size={16} color={colors.forest} />
        </IconButton>
      </View>
    </View>
  );
}

export function SectionHeader({ title, subtitle, action, onAction, style }: { title: string; subtitle?: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: spacing.xl, marginBottom: spacing.md }, style]}>
      <View style={{ flex: 1 }}>
        <AppText variant="heading">{title}</AppText>
        {subtitle && (
          <AppText variant="small" color={colors.muted} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <AppText variant="smallStrong" color={colors.emerald}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

export function InfoRow({ icon, label, value, style }: { icon: ReactNode; label: string; value: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={[styles.row, { alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm }]}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <AppText variant="small" color={colors.muted}>{label}</AppText>
        <AppText variant="body" style={style}>{value}</AppText>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  iconBtnGlass: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'transparent' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, alignSelf: 'flex-start' },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, ...shadow.card },
  stepBtn: { width: 34, height: 34 },
  infoIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
});
