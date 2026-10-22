import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { coverOf, type TrackrItem } from '@trackr/core';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { MediaIcon } from './MediaIcon';
import { Txt } from './Txt';

/**
 * Cover image (the user's custom cover when set) with a branded gradient fallback when the URL is missing or fails.
 * Pass `src` to show another image of the same item, such as a backdrop.
 */
export function Poster({ item, src, blur = 0 }: {
  item: Pick<TrackrItem, 'title' | 'type' | 'coverUrl' | 'customCover'>; src?: string; blur?: number;
}) {
  const uri = src ?? coverOf(item);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
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
      source={uri} accessibilityLabel={item.title} contentFit="cover" transition={200} blurRadius={blur}
      onError={() => setFailed(true)} style={StyleSheet.absoluteFill}
    />
  );
}
