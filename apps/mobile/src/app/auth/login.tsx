import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Info, Lock, Mail } from 'lucide-react-native';
import { ScreenHeader } from '../../components/Screen';
import { TextField } from '../../components/forms';
import { AppText, Button, Card } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

/**
 * Future-ready sign-in UI. Traveller accounts are not enabled yet, so the
 * form explains that honestly instead of pretending to sign in.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScreenHeader title="Log in" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Welcome back</AppText>
        <AppText variant="body" color={colors.muted} style={{ marginTop: 4, marginBottom: spacing.xl }}>Sign in to sync saved trips and bookings across devices.</AppText>
        <TextField label="Email" icon={<Mail size={18} color={colors.emerald} />} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <TextField label="Password" icon={<Lock size={18} color={colors.emerald} />} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <Button label="Log in" full onPress={() => setSubmitted(true)} />
        {submitted && (
          <Card style={{ marginTop: spacing.lg, flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }}>
            <Info size={18} color={colors.info} />
            <AppText variant="small" color={colors.info} style={{ flex: 1 }}>
              Traveller accounts are launching soon. You can already browse, save trips and send booking requests as a guest — nothing is lost.
            </AppText>
          </Card>
        )}
        <Button label="Continue as guest" kind="ghost" full style={{ marginTop: spacing.md }} onPress={() => router.back()} />
        <Button label="New here? Create an account" kind="ghost" full onPress={() => router.replace('/auth/register')} />
      </ScrollView>
    </View>
  );
}
