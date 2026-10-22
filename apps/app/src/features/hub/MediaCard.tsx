import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, RefreshCw, Star } from 'lucide-react-native';
import { STATUS_HEX, statusLabel, tDuration, tGenre, type StrKey, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { StarRating } from '@/components/StarRating';
import { Txt } from '@/components/Txt';

export function MediaCard({ item, onOpen, onRate }: { item: TrackrItem; onOpen: () => void; onRate: (v: number) => void }) {
  const { t, lang } = useApp();
  const m = MEDIA_CLASSES[item.type];
  const pct = item.progressTotal ? Math.min(100, ((item.progress ?? 0) / item.progressTotal) * 100) : 0;
  const synced = Object.keys(item.links ?? {}).length > 0;

  return (
    <Pressable onPress={onOpen} className="active:scale-95">
      <View className="rounded-2xl overflow-hidden bg-surface border border-line" style={{ aspectRatio: 2 / 3 }}>
        <Poster item={item} />
        <LinearGradient colors={['transparent', 'rgba(9,9,11,0.85)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }} />
        <View className="absolute top-2 left-2"><TypeBadge type={item.type} compact /></View>
        <View className="absolute top-2 right-2 flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10">
          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_HEX[item.myStatus] }} />
          <Txt className="text-xs text-white">{statusLabel(item.myStatus, item.type, t)}</Txt>
        </View>
        <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            {item.rating > 0 && <><Star size={12} color="#facc15" fill="#facc15" /><Txt className="text-xs text-zinc-200">{item.rating.toFixed(1)}</Txt></>}
          </View>
          <View className="flex-row items-center gap-1.5">
            {synced && <RefreshCw size={11} color="#6ee7b7" />}
            <Clock size={12} color="#e4e4e7" />
            <Txt className="text-xs text-zinc-200">{tDuration(item.metaDuration.split(' · ')[0], lang)}</Txt>
          </View>
        </View>
        {item.myStatus === 'in_progress' && (
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <View className={`h-full ${m.solid}`} style={{ width: `${pct}%` }} />
          </View>
        )}
      </View>
      <View className="mt-2.5 px-0.5">
        <Txt className="font-semibold text-sm" numberOfLines={1}>{item.title}</Txt>
        <Txt className="text-xs text-subtle" numberOfLines={1}>
          {item.year} · {item.genres[0] ? tGenre(item.genres[0], lang) : t(`type_${item.type}` as StrKey)}
        </Txt>
        <View className="mt-1 -ml-0.5"><StarRating value={item.myRating} onChange={onRate} size={15} /></View>
        {item.platforms.length > 0 && (
          <View className="mt-1.5 flex-row flex-wrap gap-1">
            {item.platforms.slice(0, 3).map(p => (
              <View key={p} className="px-1.5 py-0.5 rounded-md bg-surface border border-line"><Txt className="text-xs text-muted">{p}</Txt></View>
            ))}
            {item.platforms.length > 3 && <Txt className="px-1.5 py-0.5 text-xs text-subtle">+{item.platforms.length - 3}</Txt>}
          </View>
        )}
      </View>
    </Pressable>
  );
}
