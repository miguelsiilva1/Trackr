import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { TrackrItem } from '@trackr/core';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { MediaIcon } from './MediaIcon';
import { Txt } from './Txt';

/** Cover image with a branded gradient fallback when the URL is missing or fails. */
export function Poster({ item, blur = 0 }: { item: Pick<TrackrItem, 'title' | 'type' | 'coverUrl'>; blur?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.coverUrl]);

  if (!item.coverUrl || failed) {
    return (
      <LinearGradient colors={MEDIA_CLASSES[item.type].fallback} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
        <View className="flex-1 items-center justify-center gap-2 p-3">
          <MediaIcon type={item.type} size={28} color="rgba(255,255,255,0.75)" />
          <Txt className="text-xs font-semibold text-white text-center" numberOfLines={3}>{item.title}</Txt>
        </View>
      </LinearGradient>
    );
  }
  return (
    <Image
      source={item.coverUrl} accessibilityLabel={item.title} contentFit="cover" transition={200} blurRadius={blur}
      onError={() => setFailed(true)} style={StyleSheet.absoluteFill}
    />
  );
}
