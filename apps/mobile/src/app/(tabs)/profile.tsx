import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Bell, ChevronRight, Heart, Info, LogIn, MessageSquarePlus, RefreshCw, ShieldCheck, Store, UserRound } from 'lucide-react-native';
import { TabHeader } from '../../components/Screen';
import { AppText, Button, Card } from '../../components/ui';
import { isDemoMode, resetDemoData } from '../../lib/data';
import { useFavourites, useSavedBookings } from '../../lib/local';
import { colors, radius, spacing } from '../../theme/tokens';

export default function Profile() {
  const { favourites } = useFavourites();
  const { bookings } = useSavedBookings();
  const qc = useQueryClient();

  const reset = () =>
    Alert.alert('Reset demo data?', 'This restores the original sample packages and removes demo changes on this device. Your saved booking list is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetDemoData();
          await qc.invalidateQueries();
        },
      },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: spacing.huge }}>
      <TabHeader title="Profile" />
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <UserRound size={26} color={colors.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">Guest traveller</AppText>
            <AppText variant="small" color={colors.muted}>Browse and request trips without an account.</AppText>
          </View>
        </Card>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button label="Log in" kind="primary" icon={<LogIn size={16} color={colors.white} />} onPress={() => router.push('/auth/login')} style={{ flex: 1 }} />
          <Button label="Create account" kind="outline" onPress={() => router.push('/auth/register')} style={{ flex: 1 }} />
        </View>

        <Card padded={false}>
          <Row icon={<Heart size={18} color={colors.forest} />} label="Saved trips" value={`${favourites.length}`} onPress={() => router.push('/saved')} />
          <Row icon={<Bell size={18} color={colors.forest} />} label="My booking requests" value={`${bookings.length}`} onPress={() => router.push('/bookings')} />
          <Row icon={<MessageSquarePlus size={18} color={colors.forest} />} label="Request a custom trip" onPress={() => router.push('/custom-trip')} />
          <Row icon={<Store size={18} color={colors.forest} />} label="List your agency or vehicle" onPress={() => Alert.alert('Partner with Travo', 'Vendor self-service sign-up is coming soon. For now, our team onboards agencies, operators and vehicle owners through the admin dashboard.')} last />
        </Card>

        <Card padded={false}>
          <Row icon={<ShieldCheck size={18} color={colors.forest} />} label="How Travo works" onPress={() => Alert.alert('How Travo works', 'Travo is a marketplace. Packages, trips and vehicles are listed by independent agencies, tour operators and owners. You send a free booking request; the operator confirms and arranges payment. Online payments are coming soon.')} />
          <Row icon={<Info size={18} color={colors.forest} />} label="Data source" value={isDemoMode ? 'Demo (on device)' : 'Live'} last={!isDemoMode} />
          {isDemoMode && <Row icon={<RefreshCw size={18} color={colors.forest} />} label="Reset demo data" onPress={reset} last />}
        </Card>

        <AppText variant="small" color={colors.faint} style={{ textAlign: 'center' }}>
          Travo v{Constants.expoConfig?.version ?? '1.0.0'} · Made for Kerala
        </AppText>
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, value, onPress, last }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.lineSoft, borderRadius: radius.xl }, pressed && { backgroundColor: colors.sandSoft }]}
    >
      {icon}
      <AppText variant="body" style={{ flex: 1 }}>{label}</AppText>
      {value && <AppText variant="small" color={colors.muted}>{value}</AppText>}
      {onPress && <ChevronRight size={18} color={colors.muted} />}
    </Pressable>
  );
}
