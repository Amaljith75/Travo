import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, MessageCircle, Phone } from 'lucide-react-native';
import { OPERATOR_TYPE_LABELS, VERIFICATION_LABELS, type Operator } from '@travo/core';
import { colors, radius, spacing } from '../theme/tokens';
import { contactOperator } from '../lib/contact';
import { AppText, Badge, Button, Card, Rating } from './ui';

export function OperatorCard({ operator, message }: { operator: Operator; message: string }) {
  const initials = operator.businessName.split(' ').slice(0, 2).map((w) => w[0]).join('');
  return (
    <Card>
      <Pressable onPress={() => router.push(`/operators/${operator.id}`)} accessibilityRole="button" style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="heading" color={colors.white}>{initials}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>{operator.businessName}</AppText>
          <AppText variant="small" color={colors.muted}>
            {OPERATOR_TYPE_LABELS[operator.type]} · {operator.district}
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4, alignItems: 'center' }}>
            <Rating value={operator.rating} count={operator.reviewCount} />
            {operator.verificationStatus === 'verified' ? (
              <Badge label="Verified" icon={<BadgeCheck size={11} color={colors.forest} />} />
            ) : (
              <Badge label={VERIFICATION_LABELS[operator.verificationStatus]} tone="sand" />
            )}
          </View>
        </View>
      </Pressable>
      {operator.isDemo && (
        <AppText variant="small" color={colors.info} style={{ marginTop: spacing.md }}>
          Sample operator for demonstration — not a real business.
        </AppText>
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Button label="WhatsApp" kind="whatsapp" size="sm" icon={<MessageCircle size={15} color={colors.white} />} onPress={() => contactOperator(operator, 'whatsapp', message)} style={{ flex: 1 }} />
        <Button label="Call" kind="outline" size="sm" icon={<Phone size={15} color={colors.forest} />} onPress={() => contactOperator(operator, 'call', message)} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
