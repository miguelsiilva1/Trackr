import { View } from 'react-native';
import type { MediaType, StrKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { MEDIA_CLASSES, ON_IMAGE } from '@/theme/tokens';
import { MediaIcon } from './MediaIcon';
import { Txt } from './Txt';

/** 'image' = on top of a poster (always dark); 'surface' = on the themed background; 'solid' = filled. */
export function TypeBadge({ type, variant = 'image', compact = false }: { type: MediaType; variant?: 'image' | 'surface' | 'solid'; compact?: boolean }) {
  const { t, colors } = useApp();
  const m = MEDIA_CLASSES[type];
  const box = variant === 'solid' ? `${m.solid} border-transparent`
    : variant === 'surface' ? `${m.soft} ${m.border}`
    : 'bg-black/60 border-white/10';
  const color = variant === 'solid' ? '#09090b' : variant === 'surface' ? colors.media[type] : ON_IMAGE[type];
  return (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border self-start ${box}`}>
      <MediaIcon type={type} size={12} color={color} />
      {!compact && <Txt className="text-xs font-semibold" style={{ color }}>{t(`type_${type}` as StrKey)}</Txt>}
    </View>
  );
}
