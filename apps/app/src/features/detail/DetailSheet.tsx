import { Pressable, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, Star, Trash2 } from 'lucide-react-native';
import {
  MEDIA_META, MEDIA_STATUSES, PROVIDERS, STATUS_HEX, statusLabel, summaryOf, tDuration, tGenre,
  type MediaStatus, type ProviderId, type StrKey, type TrackrItem,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { closeModal } from '@/lib/navigation';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Sheet } from '@/components/Sheet';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { StarRating } from '@/components/StarRating';
import { Avatar } from '@/components/Avatar';
import { Kicker, Txt } from '@/components/Txt';
import { ProgressControl } from './ProgressControl';

export function DetailSheet({ id }: { id: string }) {
  const { t, lang, colors } = useApp();
  const { wide } = useBreakpoint();
  const item = useTrackr(s => s.items.find(i => String(i.id) === id));
  const updateItem = useTrackr(s => s.updateItem);
  const removeItem = useTrackr(s => s.removeItem);

  if (!item) {
    return (
      <Sheet onClose={closeModal} title="404">
        <Txt className="p-6 text-subtle">{t('empty_title')}</Txt>
      </Sheet>
    );
  }

  const m = MEDIA_CLASSES[item.type];
  const accent = colors.media[item.type];
  const total = item.progressTotal ?? MEDIA_META[item.type].defaultTotal;
  const progress = item.progress ?? 0;
  const links = Object.keys(item.links ?? {}) as ProviderId[];
  const update = (patch: Partial<TrackrItem>) => updateItem(item.id, patch);

  const setProgress = (v: number) => update({
    progress: v,
    ...(v >= total ? { myStatus: 'completed' as MediaStatus } : v > 0 && item.myStatus === 'backlog' ? { myStatus: 'in_progress' as MediaStatus } : {}),
  });

  return (
    <Sheet onClose={closeModal} wide>
      <View className="h-44 overflow-hidden">
        <Poster item={{ ...item, coverUrl: item.backdropUrl ?? item.coverUrl }} blur={item.backdropUrl ? 0 : 20} />
        <LinearGradient colors={['transparent', colors.surface]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '80%' }} />
      </View>

      <View className="px-5 pb-7 -mt-20">
        <View className="flex-row gap-4">
          <View className="w-28 rounded-xl overflow-hidden border border-strong bg-surface2" style={{ aspectRatio: 2 / 3 }}>
            <Poster item={item} />
          </View>
          <View className="flex-1 pt-16 gap-1">
            <TypeBadge type={item.type} variant="solid" />
            <Txt className="text-2xl font-black">{item.title}</Txt>
            <View className="flex-row flex-wrap items-center gap-x-2">
              <Txt className="text-sm text-muted">{item.year} · {tDuration(item.metaDuration, lang)}</Txt>
              {item.rating > 0 && (
                <View className="flex-row items-center gap-1">
                  <Star size={13} color="#facc15" fill="#facc15" />
                  <Txt className="text-sm text-muted">{item.rating.toFixed(1)} / 5</Txt>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-1.5">
          {item.genres.map(g => <View key={g} className={`px-2.5 py-1 rounded-full ${m.soft}`}><Txt className={`text-xs ${m.text}`}>{tGenre(g, lang)}</Txt></View>)}
          {item.platforms.map(p => <View key={p} className="px-2.5 py-1 rounded-full bg-surface2"><Txt className="text-xs text-muted">{p}</Txt></View>)}
        </View>

        <Txt className="mt-4 text-sm leading-relaxed text-muted">{summaryOf(item, lang, t)}</Txt>

        {item.likedByFriends.length > 0 && (
          <View className="mt-4 flex-row items-center gap-3">
            <View className="flex-row">{item.likedByFriends.map((f, i) => <View key={f} style={{ marginLeft: i ? -8 : 0 }}><Avatar who={f} size={24} /></View>)}</View>
            <Txt className="text-xs text-muted flex-1">
              {t(item.likedByFriends.length > 1 ? 'friends_have_many' : 'friends_have_one', { names: item.likedByFriends.join(', ') })}
            </Txt>
          </View>
        )}

        <View className={`mt-6 gap-5 ${wide ? 'flex-row' : ''}`}>
          <View className="flex-1 gap-5">
            <View className="gap-2">
              <Kicker>{t('status')}</Kicker>
              <View className="flex-row flex-wrap -m-0.5">
                {MEDIA_STATUSES.map(s => {
                  const on = item.myStatus === s;
                  return (
                    <View key={s} className="p-0.5" style={{ width: '50%' }}>
                      <Pressable
                        onPress={() => update({ myStatus: s, ...(s === 'completed' ? { progress: total } : {}) })}
                        className={`h-10 rounded-xl flex-row items-center justify-center gap-1.5 border active:scale-95 ${on ? `${m.soft} ${m.border}` : 'bg-sunken border-line'}`}
                      >
                        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
                        <Txt className={`text-sm font-medium ${on ? m.text : 'text-muted'}`}>{statusLabel(s, item.type, t)}</Txt>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
            <View className="gap-2">
              <Kicker>{t('my_rating')}</Kicker>
              <StarRating value={item.myRating} onChange={v => update({ myRating: v || undefined })} size={26} />
            </View>
          </View>

          <View className="flex-1 gap-5">
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Kicker>{t(`progress_${item.type}` as StrKey)}</Kicker>
                <Txt className={`text-sm font-bold ${m.text}`}>{progress} / {total} {MEDIA_META[item.type].progressUnit}</Txt>
              </View>
              <ProgressControl value={progress} total={total} color={accent} onChange={setProgress} />
            </View>
            <View className="gap-2">
              <Kicker>{t('notes')}</Kicker>
              <TextInput
                value={item.notes ?? ''} onChangeText={notes => update({ notes })} multiline numberOfLines={3}
                placeholder={item.type === 'game' ? t('notes_ph_game') : t('notes_ph')} placeholderTextColor={colors.subtle}
                className="rounded-xl bg-sunken border border-line p-3 text-sm text-fg" style={{ minHeight: 84, textAlignVertical: 'top' }}
              />
            </View>
          </View>
        </View>

        <View className="mt-6 pt-4 border-t border-line flex-row flex-wrap gap-3 items-center justify-between">
          <View className="flex-row flex-wrap items-center gap-2">
            <Txt className="text-xs text-subtle">
              {t('source')}: {item.apiSource === 'local_mock' ? t('mock_source') : item.apiSource.toUpperCase()}{item.externalId ? ` · #${item.externalId}` : ''}
            </Txt>
            {links.length > 0 && (
              <View className="flex-row items-center gap-1">
                <RefreshCw size={12} color={colors.media.game} />
                <Txt className="text-xs text-game">{t('synced_with')} {links.map(l => PROVIDERS.find(p => p.id === l)?.name).join(', ')}</Txt>
              </View>
            )}
          </View>
          <Pressable onPress={() => { removeItem(item.id); closeModal(); }} className="flex-row items-center gap-1.5">
            <Trash2 size={14} color="#f43f5e" />
            <Txt className="text-xs text-rose-500">{t('remove')}</Txt>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}
