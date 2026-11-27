import { View } from 'react-native';
import type { Review } from '@travo/core';
import { colors, spacing } from '../theme/tokens';
import { AppText, Card, Rating } from './ui';

export function ReviewList({ reviews, rating, count }: { reviews: Review[]; rating: number; count: number }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <AppText variant="display" color={colors.forest}>{rating ? rating.toFixed(1) : '–'}</AppText>
        <View>
          <Rating value={rating} />
          <AppText variant="small" color={colors.muted}>{count} verified reviews</AppText>
        </View>
      </View>
      {reviews.length === 0 ? (
        <AppText variant="small" color={colors.muted}>No written reviews yet.</AppText>
      ) : (
        reviews.slice(0, 5).map((r) => (
          <Card key={r.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="bodyStrong">{r.title}</AppText>
              <Rating value={r.rating} />
            </View>
            <AppText variant="body" color={colors.ink} style={{ marginTop: 6 }}>{r.body}</AppText>
            <AppText variant="small" color={colors.muted} style={{ marginTop: 8 }}>
              {r.authorName}, {r.authorCity} · Travelled {r.travelMonth}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}
