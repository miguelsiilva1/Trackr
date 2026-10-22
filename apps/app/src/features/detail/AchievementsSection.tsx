import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Trophy } from 'lucide-react-native';
import type { Achievement, TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Segmented } from '@/components/Controls';
import { Txt } from '@/components/Txt';

type Filter = 'all' | 'unlocked' | 'locked';

const PAGE = 20;

/** Trophy tint by rarity when the source has no icon: gold, silver, bronze. */
const tierHex = (percent: number) => (percent < 5 ? '#facc15' : percent < 25 ? '#cbd5e1' : '#d97706');

export function AchievementsSection({ item, achievements, onChange }: {
  item: TrackrItem; achievements: Achievement[]; onChange: (patch: Partial<TrackrItem>) => void;
}) {
  const { t, colors } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const unlocked = new Set(item.unlocked ?? []);
  const done = achievements.filter(a => unlocked.has(a.id)).length;

  const toggle = (id: string) => {
    const next = new Set(unlocked);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ unlocked: [...next], progress: achievements.filter(a => next.has(a.id)).length, progressTotal: achievements.length });
  };

  const shown = achievements.filter(a => filter === 'all' || (filter === 'unlocked') === unlocked.has(a.id));

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2">
          <Trophy size={18} color={colors.media.game} />
          <Txt className="text-xl font-bold">{t('achievements')}</Txt>
          <Txt className="text-sm text-muted">{done}/{achievements.length}</Txt>
        </View>
        <Segmented<Filter>
          value={filter} onChange={f => { setFilter(f); setLimit(PAGE); }}
          options={[{ id: 'all', label: t('ach_all') }, { id: 'unlocked', label: t('ach_unlocked') }, { id: 'locked', label: t('ach_locked') }]}
        />
      </View>
      <View className="h-1.5 rounded-full bg-surface2 overflow-hidden">
        <View className={`h-full ${MEDIA_CLASSES.game.solid}`} style={{ width: `${achievements.length ? (done / achievements.length) * 100 : 0}%` }} />
      </View>

      <View className="rounded-2xl bg-surface border border-line overflow-hidden">
        {shown.slice(0, limit).map((a, i) => {
          const on = unlocked.has(a.id);
          return (
            <Pressable key={a.id} onPress={() => toggle(a.id)} className={`flex-row items-center gap-3 px-4 py-3 ${i ? 'border-t border-line' : ''}`}>
              <View className="w-14 h-14 rounded-xl overflow-hidden items-center justify-center bg-surface2" style={{ opacity: on ? 1 : 0.45 }}>
                {a.image
                  ? <Image source={a.image} contentFit="cover" style={{ width: '100%', height: '100%', filter: on ? undefined : 'grayscale(1)' }} />
                  : <Trophy size={24} color={tierHex(a.percent)} />}
              </View>
              <View className="flex-1 gap-0.5">
                <Txt className={`text-sm font-semibold ${on ? '' : 'text-muted'}`}>{a.name}</Txt>
                {a.description ? <Txt className="text-xs text-subtle" numberOfLines={2}>{a.description}</Txt> : null}
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="h-1 w-20 rounded-full bg-surface2 overflow-hidden">
                    <View className="h-full bg-accent" style={{ width: `${Math.min(100, a.percent)}%` }} />
                  </View>
                  <Txt className="text-xs text-subtle">{t('ach_rarity', { p: a.percent.toFixed(1) })}</Txt>
                </View>
              </View>
              <View className={`w-7 h-7 rounded-full items-center justify-center border ${on ? 'bg-emerald-500 border-transparent' : 'border-strong'}`}>
                <Check size={14} color={on ? '#09090b' : colors.subtle} strokeWidth={3} />
              </View>
            </Pressable>
          );
        })}
      </View>
      {shown.length > limit && (
        <Pressable onPress={() => setLimit(l => l + PAGE)} className="self-center px-4 py-2">
          <Txt className="text-sm font-semibold text-accent">{t('see_all')} ({shown.length - limit})</Txt>
        </Pressable>
      )}
    </View>
  );
}
