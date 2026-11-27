import { Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheckBig, Copy } from 'lucide-react-native';
import { formatDate, formatINR } from '@travo/core';
import { AppText, Button, Card, Divider } from '../../components/ui';
import { DemoNotice } from '../../components/Screen';
import { colors, radius, spacing } from '../../theme/tokens';

export default function Confirmation() {
  const { ref, total, title, date, phone } = useLocalSearchParams<{ ref: string; total?: string; title?: string; date?: string; phone?: string }>();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + spacing.huge, paddingHorizontal: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <View style={s.check}>
          <CircleCheckBig size={40} color={colors.white} />
        </View>
        <AppText variant="title" style={{ marginTop: spacing.xl, textAlign: 'center' }}>Booking request sent</AppText>
        <AppText variant="body" color={colors.muted} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          The operator will confirm availability, usually within a few hours, by phone or WhatsApp.
        </AppText>
      </View>
      <Card style={{ marginTop: spacing.xxl }}>
        <AppText variant="caption" color={colors.muted}>BOOKING REFERENCE</AppText>
        <AppText variant="display" color={colors.forest} selectable style={{ marginTop: 4, letterSpacing: 1 }}>
          {ref}
        </AppText>
        <Divider />
        {!!title && <Row label="Trip" value={title} />}
        {!!date && <Row label="Travel date" value={formatDate(date)} />}
        {!!total && <Row label="Estimated total" value={formatINR(Number(total))} />}
        <Row label="Status" value="Pending confirmation" />
        <Row label="Payment" value="Not charged — pay after confirmation" />
      </Card>
      <DemoNotice text="Demo mode: this request is saved on this device only and is not sent to a real operator." />
      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        <Button label="View my bookings" onPress={() => router.replace('/bookings')} full />
        <Button label="Share reference" kind="outline" icon={<Copy size={16} color={colors.forest} />} onPress={() => Share.share({ message: `My Travo booking request: ${ref}${title ? ` — ${title}` : ''}` })} full />
        <Button label="Back to home" kind="ghost" onPress={() => router.replace('/')} full />
      </View>
      {!!phone && (
        <AppText variant="small" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.md }}>
          Track status any time from Bookings using your reference and {phone}.
        </AppText>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 4 }}>
      <AppText variant="small" color={colors.muted}>{label}</AppText>
      <AppText variant="smallStrong" style={{ flex: 1, textAlign: 'right' }}>{value}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  check: { width: 80, height: 80, borderRadius: radius.pill, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' },
});
