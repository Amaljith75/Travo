import { Pressable, StyleSheet, View } from 'react-native';
import { Building2, CreditCard, HandCoins, Smartphone, Wallet } from 'lucide-react-native';
import { getPaymentProvider, type PaymentMethod } from '@travo/core';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText, Badge } from './ui';

const ICONS: Record<PaymentMethod, typeof Smartphone> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Building2,
  wallet: Wallet,
  pay_at_operator: HandCoins,
};

/**
 * Payment preference picker. Online methods are shown as "Coming soon" and
 * only record the traveller's preference — nothing is charged and no card
 * details are collected.
 */
export function PaymentOptions({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const methods = getPaymentProvider().listMethods();
  return (
    <View style={{ gap: spacing.sm }}>
      {methods.map((m) => {
        const Icon = ICONS[m.method];
        const selected = value === m.method;
        return (
          <Pressable
            key={m.method}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !m.enabled }}
            accessibilityLabel={`${m.label}${m.comingSoon ? ', coming soon' : ''}`}
            onPress={() => m.enabled && onChange(m.method)}
            style={[s.card, selected && s.cardOn, !m.enabled && { opacity: 0.6 }]}
          >
            <View style={[s.icon, selected && { backgroundColor: colors.forest }]}>
              <Icon size={18} color={selected ? colors.white : colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{m.label}</AppText>
              <AppText variant="small" color={colors.muted}>{m.description}</AppText>
            </View>
            {m.comingSoon ? <Badge label="Coming soon" tone="grey" /> : <View style={[s.radio, selected && s.radioOn]} />}
          </Pressable>
        );
      })}
      <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.xs }}>
        Online payments are not live yet. Submitting sends a free booking request — no payment is taken. The operator confirms availability and arranges payment with you directly.
      </AppText>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  cardOn: { borderColor: colors.forest, backgroundColor: colors.emeraldSoft },
  icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line },
  radioOn: { borderColor: colors.forest, borderWidth: 6 },
});
