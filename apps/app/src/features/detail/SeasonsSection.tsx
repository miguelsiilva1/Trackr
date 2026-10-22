import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, ChevronDown, Star } from 'lucide-react-native';
import { episodeKey, type MediaStatus, type Season, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Txt } from '@/components/Txt';

const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);

/** Watched episodes; items tracked before per-episode data count their first `progress` episodes as watched. */
function initialWatched(item: TrackrItem, seasons: Season[]) {
  if (item.watched) return new Set(item.watched);
  const all = seasons.flatMap(s => s.episodes.map(e => episodeKey(s.number, e.number)));
  return new Set(all.slice(0, item.progress ?? 0));
}

function WatchToggle({ on, onPress, size = 30 }: { on: boolean; onPress: () => void; size?: number }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress} hitSlop={8}
      className={`items-center justify-center rounded-full border ${on ? 'bg-accent border-transparent' : 'border-strong'}`}
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.5} color={on ? colors.accentFg : colors.subtle} strokeWidth={3} />
    </Pressable>
  );
}

export function SeasonsSection({ item, seasons, onChange }: {
  item: TrackrItem; seasons: Season[]; onChange: (patch: Partial<TrackrItem>) => void;
}) {
  const { t, colors } = useApp();
  const watched = useMemo(() => initialWatched(item, seasons), [item, seasons]);
  const total = seasons.reduce((n, s) => n + s.episodes.length, 0);
  const firstOpen = seasons.find(s => s.episodes.some(e => !watched.has(episodeKey(s.number, e.number))))?.number ?? seasons[0]?.number;
  const [open, setOpen] = useState<Set<number>>(() => new Set(firstOpen ? [firstOpen] : []));

  const save = (next: Set<string>) => {
    const status: MediaStatus | undefined = next.size === total ? 'completed'
      : next.size > 0 && (item.myStatus === 'backlog' || item.myStatus === 'completed') ? 'in_progress' : undefined;
    onChange({ watched: [...next], progress: next.size, progressTotal: total, ...(status ? { myStatus: status } : {}) });
  };
  const toggle = (keys: string[], on: boolean) => {
    const next = new Set(watched);
    keys.forEach(k => (on ? next.add(k) : next.delete(k)));
    save(next);
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Txt className="text-xl font-bold">{t('seasons')}</Txt>
        <Txt className="text-sm text-muted">{t('watched_of', { a: watched.size, b: total })}</Txt>
      </View>
      {seasons.map(s => {
        const keys = s.episodes.map(e => episodeKey(s.number, e.number));
        const seen = keys.filter(k => watched.has(k)).length;
        const all = seen === keys.length && keys.length > 0;
        const isOpen = open.has(s.number);
        const rating = avg(s.episodes.map(e => e.rating).filter(Boolean));
        return (
          <View key={s.number} className="rounded-2xl bg-surface border border-line overflow-hidden">
            <Pressable
              onPress={() => setOpen(o => { const n = new Set(o); if (isOpen) n.delete(s.number); else n.add(s.number); return n; })}
              className="flex-row items-center gap-3 p-4"
            >
              <ChevronDown size={18} color={colors.muted} style={{ transform: [{ rotate: isOpen ? '0deg' : '-90deg' }] }} />
              <View className="flex-1 gap-1">
                <Txt className="font-bold">{t('season_n', { n: s.number })}</Txt>
                <View className="flex-row items-center gap-2">
                  <Txt className="text-xs text-subtle">{[s.year, t('episodes_n', { n: s.episodes.length })].filter(Boolean).join(' · ')}</Txt>
                  {rating > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Star size={11} color="#facc15" fill="#facc15" />
                      <Txt className="text-xs text-muted">{rating.toFixed(2)}</Txt>
                    </View>
                  )}
                </View>
                <View className="h-1 mt-1 rounded-full bg-surface2 overflow-hidden" style={{ maxWidth: 220 }}>
                  <View className={`h-full ${MEDIA_CLASSES.series.solid}`} style={{ width: `${keys.length ? (seen / keys.length) * 100 : 0}%` }} />
                </View>
              </View>
              <Txt className="text-xs text-muted">{seen}/{keys.length}</Txt>
              <WatchToggle on={all} onPress={() => toggle(keys, !all)} />
            </Pressable>

            {isOpen && s.episodes.map(e => {
              const k = episodeKey(s.number, e.number);
              const on = watched.has(k);
              return (
                <View key={k} className="flex-row items-center gap-3 px-4 py-3 border-t border-line">
                  <View className="rounded-lg overflow-hidden bg-surface2 items-center justify-center" style={{ width: 112, aspectRatio: 16 / 9 }}>
                    {e.still
                      ? <Image source={e.still} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                      : <Txt className="text-lg font-black text-subtle">{e.number}</Txt>}
                  </View>
                  <View className="flex-1 gap-1">
                    <Txt className={`text-sm font-semibold ${on ? 'text-muted' : ''}`} numberOfLines={2}>{e.title || t('ep_n', { n: e.number })}</Txt>
                    <Txt className="text-xs text-subtle" numberOfLines={1}>
                      {[t('ep_code', { s: s.number, e: e.number }), e.airDate, e.runtime ? `${e.runtime}m` : ''].filter(Boolean).join(' · ')}
                    </Txt>
                    {e.rating > 0 && (
                      <View className="self-start flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-surface2">
                        <Star size={11} color={colors.accent} fill={colors.accent} />
                        <Txt className="text-xs font-semibold">{e.rating.toFixed(2)}</Txt>
                      </View>
                    )}
                  </View>
                  <WatchToggle on={on} onPress={() => toggle([k], !on)} size={26} />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
