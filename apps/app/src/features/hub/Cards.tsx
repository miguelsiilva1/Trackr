import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { backdropOf, tGenre, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { Txt } from '@/components/Txt';

/** Progress shown on "Continue" cards: episodes for series, achievements for games. */
function progressOf(item: TrackrItem, t: ReturnType<typeof useApp>['t']) {
  const total = item.progressTotal ?? 0;
  const done = item.progress ?? 0;
  if (item.type === 'series' && total) return { pct: done / total, label: t('left_eps', { n: Math.max(0, total - done) }) };
  if (item.type === 'game' && item.unlocked && total) return { pct: done / total, label: t('ach_count', { a: done, b: total }) };
  return null;
}

/** Landscape card for titles in progress, Trakt-style: banner, progress bar, what's left. */
export function ContinueCard({ item, width, onOpen }: { item: TrackrItem; width: number; onOpen: () => void }) {
  const { t, lang } = useApp();
  const p = progressOf(item, t);
  const banner = backdropOf(item);
  return (
    <Pressable onPress={onOpen} style={{ width }} className="active:opacity-80">
      <View className="rounded-xl overflow-hidden bg-surface2 border border-line" style={{ aspectRatio: 16 / 9 }}>
        <Poster item={item} src={banner} />
        <LinearGradient colors={['transparent', 'rgba(8,8,14,0.9)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }} />
        <View className="absolute top-2 left-2"><TypeBadge type={item.type} compact /></View>
        {p && (
          <View className="absolute left-2.5 right-2.5 bottom-2.5 gap-1.5">
            <Txt className="text-xs font-semibold text-white self-end">{p.label}</Txt>
            <View className="h-1 rounded-full bg-white/20 overflow-hidden">
              <View className={`h-full rounded-full ${MEDIA_CLASSES[item.type].solid}`} style={{ width: `${Math.min(100, p.pct * 100)}%` }} />
            </View>
          </View>
        )}
      </View>
      <Txt className="mt-2 text-sm font-semibold" numberOfLines={1}>{item.title}</Txt>
      <Txt className="text-xs text-subtle" numberOfLines={1}>
        {item.year}{item.genres[0] ? ` · ${tGenre(item.genres[0], lang)}` : ''}
      </Txt>
    </Pressable>
  );
}

/** Portrait poster card with title, year and the user's own rating when there is one. */
export function PosterCard({ item, width, onOpen }: { item: TrackrItem; width?: number; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={width ? { width } : undefined} className="active:opacity-80">
      <View className="rounded-xl overflow-hidden bg-surface2 border border-line" style={{ aspectRatio: 2 / 3 }}>
        <Poster item={item} />
        <View className="absolute top-2 left-2"><TypeBadge type={item.type} compact /></View>
      </View>
      <Txt className="mt-2 text-sm font-semibold" numberOfLines={1}>{item.title}</Txt>
      <View className="flex-row items-center gap-1.5">
        <Txt className="text-xs text-subtle">{item.year}</Txt>
        {item.myRating ? (
          <>
            <Star size={11} color="#facc15" fill="#facc15" />
            <Txt className="text-xs text-muted">{item.myRating}</Txt>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}
