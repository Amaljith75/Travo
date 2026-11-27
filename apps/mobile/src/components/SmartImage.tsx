import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Mountain } from 'lucide-react-native';
import { sizedImage } from '@travo/core';
import { colors } from '../theme/tokens';
import { AppText } from './ui';

/**
 * Remote image with a branded fallback. If the URL fails to load (offline,
 * removed photo) the user sees a calm green placeholder, not a broken box.
 */
export function SmartImage({ uri, width = 900, style, label, children, rounded = 0 }: { uri?: string | null; width?: number; style?: StyleProp<ViewStyle>; label?: string; children?: React.ReactNode; rounded?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.emeraldSoft, borderRadius: rounded }, style]}>
      {!uri || failed ? (
        <LinearGradient colors={[colors.emerald, colors.forestDeep]} style={[StyleSheet.absoluteFill, styles.center]}>
          <Mountain size={28} color="rgba(255,255,255,0.55)" />
          {label && (
            <AppText variant="smallStrong" color="rgba(255,255,255,0.8)" style={{ marginTop: 6, textAlign: 'center', paddingHorizontal: 12 }} numberOfLines={1}>
              {label}
            </AppText>
          )}
        </LinearGradient>
      ) : (
        <Image
          source={{ uri: sizedImage(uri, width) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
          alt={label}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
