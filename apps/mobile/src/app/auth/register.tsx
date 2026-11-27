import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Info, Lock, Mail, Phone, UserRound } from 'lucide-react-native';
import { ScreenHeader } from '../../components/Screen';
import { TextField } from '../../components/forms';
import { AppText, Button, Card } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title="Create account" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Join Travo</AppText>
        <AppText variant="body" color={colors.muted} style={{ marginTop: 4, marginBottom: spacing.xl }}>Faster bookings, trip history and offers.</AppText>
        <TextField label="Full name" icon={<UserRound size={18} color={colors.emerald} />} value={form.name} onChangeText={set('name')} autoComplete="name" />
        <TextField label="Mobile number" icon={<Phone size={18} color={colors.emerald} />} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <TextField label="Email" icon={<Mail size={18} color={colors.emerald} />} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Password" icon={<Lock size={18} color={colors.emerald} />} value={form.password} onChangeText={set('password')} secureTextEntry />
        <Button label="Create account" full onPress={() => setSubmitted(true)} />
        {submitted && (
          <Card style={{ marginTop: spacing.lg, flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }}>
            <Info size={18} color={colors.info} />
            <AppText variant="small" color={colors.info} style={{ flex: 1 }}>
              Account sign-up opens soon — no account was created and your details were not stored. Keep exploring as a guest in the meantime.
            </AppText>
          </Card>
        )}
        <Button label="Already have an account? Log in" kind="ghost" full style={{ marginTop: spacing.md }} onPress={() => router.replace('/auth/login')} />
      </ScrollView>
    </View>
  );
}
