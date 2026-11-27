import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { Share } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { SmartImage } from './SmartImage';
import { IconButton } from './ui';
import { FavouriteButton } from './cards';

export function Gallery({ images, height = 320, label, favouriteId, shareText }: { images: string[]; height?: number; label?: string; favouriteId?: string; shareText?: string }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [''];
  return (
    <View style={{ height }}>
      <FlatList
        data={list}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(u, i) => `${i}-${u}`}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => <SmartImage uri={item || null} width={1200} label={label} style={{ width, height }} />}
        accessibilityLabel={`Photo gallery, ${list.length} photos`}
      />
      <View style={[s.top, { top: insets.top + spacing.sm }]}>
        <IconButton tone="glass" label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={18} color={colors.charcoal} />
        </IconButton>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {shareText && (
            <IconButton tone="glass" label="Share" onPress={() => Share.share({ message: shareText })}>
              <Share2 size={17} color={colors.charcoal} />
            </IconButton>
          )}
          {favouriteId && <FavouriteButton id={favouriteId} />}
        </View>
      </View>
      {list.length > 1 && (
        <View style={s.dots}>
          {list.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotOn]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  dots: { position: 'absolute', bottom: 28, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { backgroundColor: colors.white, width: 18 },
});
