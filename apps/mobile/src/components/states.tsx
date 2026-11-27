import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CircleAlert, SearchX } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText, Button } from './ui';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.lineSoft, borderRadius: radius.md, opacity }, style]} />;
}

export function CardSkeletonRow({ count = 3, width = 260, height = 230 }: { count?: number; width?: number; height?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl }} accessibilityLabel="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width }}>
          <Skeleton style={{ height: height * 0.65, borderRadius: radius.xl }} />
          <Skeleton style={{ height: 14, marginTop: 10, width: '80%' }} />
          <Skeleton style={{ height: 12, marginTop: 8, width: '50%' }} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.lg, padding: spacing.xl }} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
          <Skeleton style={{ width: 96, height: 96, borderRadius: radius.lg }} />
          <View style={{ flex: 1, gap: 8, paddingTop: 6 }}>
            <Skeleton style={{ height: 14, width: '85%' }} />
            <Skeleton style={{ height: 12, width: '60%' }} />
            <Skeleton style={{ height: 12, width: '40%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function EmptyState({ title, message, icon, action }: { title: string; message?: string; icon?: ReactNode; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>{icon ?? <SearchX size={26} color={colors.emerald} />}</View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>{title}</AppText>
      {message && (
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: 6 }}>
          {message}
        </AppText>
      )}
      {action && <Button label={action.label} kind="secondary" onPress={action.onPress} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.dangerSoft }]}>
        <CircleAlert size={26} color={colors.danger} />
      </View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>We couldn’t load this</AppText>
      <AppText variant="small" color={colors.muted} style={{ textAlign: 'center', marginTop: 6 }}>
        {message}
      </AppText>
      {onRetry && <Button label="Try again" kind="outline" onPress={onRetry} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, paddingVertical: spacing.huge },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
});
