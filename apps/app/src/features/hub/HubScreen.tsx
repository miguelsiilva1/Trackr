import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, Check, Gamepad2, LayoutGrid, Plus, Search, Sparkles, Tv, X } from 'lucide-react-native';
import {
  MOCK_CATALOG, STATUS_HEX, libKey, normalize, tGenre, type MediaStatus, type MediaType,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import { PageHeader, Screen } from '@/components/Screen';
import { Pill } from '@/components/Controls';
import { MediaIcon } from '@/components/MediaIcon';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { Txt } from '@/components/Txt';
import { MediaCard } from './MediaCard';

type CatFilter = 'all' | MediaType;
type StatusFilter = 'all' | MediaStatus;

const CAT_ACCENT: Record<MediaType, { box: string; text: string }> = {
  movie: { box: 'bg-amber-500', text: 'text-zinc-950' },
  series: { box: 'bg-violet-500', text: 'text-white' },
  game: { box: 'bg-emerald-500', text: 'text-zinc-950' },
};

export function HubScreen() {
  const { t, lang, colors } = useApp();
  const { width, wide } = useBreakpoint();
  const items = useTrackr(s => s.items);
  const updateItem = useTrackr(s => s.updateItem);
  const addItem = useTrackr(s => s.addItem);
  const [cat, setCat] = useState<CatFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const { outcome, isLoading, debounced } = useMediaSearch(query, MOCK_CATALOG);

  const owned = useMemo(() => new Set(items.map(libKey)), [items]);
  const visible = useMemo(() => {
    const q = normalize(query);
    return items.filter(i =>
      (cat === 'all' || i.type === cat) &&
      (status === 'all' || i.myStatus === status) &&
      (!q || normalize(i.title).includes(q) || i.genres.some(g => normalize(g).includes(q) || normalize(tGenre(g, lang)).includes(q))));
  }, [items, cat, status, query, lang]);
  const discover = (outcome?.items ?? []).filter(i => !owned.has(libKey(i)));

  const contentWidth = Math.min(width - (wide ? 256 + 64 : 32), 1280 - 64);
  const cols = wide ? Math.max(3, Math.min(6, Math.floor(contentWidth / 190))) : width >= 560 ? 3 : 2;
  const hours = items.filter(i => i.type === 'game').reduce((s, i) => s + (i.progress ?? 0), 0);
  const eps = items.filter(i => i.type === 'series').reduce((s, i) => s + (i.progress ?? 0), 0);

  const statusText = (s: StatusFilter) => {
    if (s === 'all') return t('any_status');
    if (s === 'in_progress') return cat === 'game' ? t('st_progress_play') : cat === 'all' ? t('st_progress_all') : t('st_progress_watch');
    if (s === 'backlog') return cat === 'all' ? t('st_backlog_all') : `${t('st_backlog')} (${cat === 'game' ? t('st_backlog_play') : t('st_backlog_watch')})`;
    return s === 'completed' ? t('st_completed_pl') : t('st_dropped_pl');
  };

  const stats = [
    { label: t('stat_total'), value: items.length, icon: <LayoutGrid size={18} color={colors.fg} /> },
    { label: t('stat_completed'), value: items.filter(i => i.myStatus === 'completed').length, icon: <Check size={18} color={colors.media.game} /> },
    { label: t('stat_eps'), value: eps, icon: <Tv size={18} color={colors.media.series} /> },
    { label: t('stat_hours'), value: `${hours}h`, icon: <Gamepad2 size={18} color={colors.media.game} /> },
  ];

  return (
    <Screen>
      <PageHeader
        kicker={t('hub_kicker')}
        title={t('nav_hub')}
        right={
          <View className="flex-row gap-2" style={{ width: wide ? 440 : '100%' }}>
            <View className="flex-1 h-11 flex-row items-center rounded-xl bg-surface border border-line px-3 gap-2">
              <Search size={18} color={colors.subtle} />
              <TextInput
                value={query} onChangeText={setQuery} placeholder={t('search_ph')} placeholderTextColor={colors.subtle}
                className="flex-1 text-sm text-fg h-full" style={{ outlineStyle: 'none' } as object}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} accessibilityLabel={t('clear')}>
                  {isLoading ? <ActivityIndicator size="small" color={colors.subtle} /> : <X size={16} color={colors.subtle} />}
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={() => router.push('/add')} className="h-11 px-4 rounded-xl bg-inv flex-row items-center gap-1.5 active:scale-95">
              <Plus size={18} color={colors.invFg} />
              {wide && <Txt className="text-sm font-semibold text-inv-fg">{t('track_item')}</Txt>}
            </Pressable>
          </View>
        }
      />

      <View className="flex-row flex-wrap -m-1.5 mb-5">
        {stats.map(s => (
          <View key={s.label} className="p-1.5" style={{ width: wide ? '25%' : '50%' }}>
            <View className="rounded-2xl bg-surface border border-line p-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface2 items-center justify-center">{s.icon}</View>
              <View className="flex-1">
                <Txt className="text-xl font-bold">{s.value}</Txt>
                <Txt className="text-xs text-subtle" numberOfLines={1}>{s.label}</Txt>
              </View>
            </View>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-3">
        <Pill active={cat === 'all'} onPress={() => setCat('all')}>{`${t('cat_all')}  ${items.length}`}</Pill>
        {(['movie', 'series', 'game'] as MediaType[]).map(ty => {
          const on = cat === ty;
          return (
            <Pill key={ty} active={on} onPress={() => setCat(ty)} activeClass={CAT_ACCENT[ty].box}>
              <MediaIcon type={ty} size={15} color={on ? (ty === 'series' ? '#fff' : '#09090b') : colors.muted} />
              <Txt className={`text-sm font-medium ${on ? CAT_ACCENT[ty].text : 'text-muted'}`}>
                {t(`types_${ty}`)}  {items.filter(i => i.type === ty).length}
              </Txt>
            </Pill>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} className="mb-6">
        {(['all', 'in_progress', 'backlog', 'completed', 'dropped'] as StatusFilter[]).map(s => (
          <Pressable key={s} onPress={() => setStatus(s)} className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${status === s ? 'bg-surface2' : ''}`}>
            {s !== 'all' && <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />}
            <Txt className={`text-xs font-medium ${status === s ? 'text-fg' : 'text-subtle'}`}>{statusText(s)}</Txt>
          </Pressable>
        ))}
      </ScrollView>

      {debounced.length >= 2 && (
        <View className="rounded-2xl bg-surface border border-line p-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#eab308" />
              <Txt className="text-sm font-semibold">{t('discover')}</Txt>
              <Txt className="text-xs text-subtle">· {outcome?.source === 'remote' ? t('src_live') : t('src_local')}</Txt>
            </View>
            {isLoading && <ActivityIndicator size="small" color={colors.subtle} />}
          </View>
          {outcome?.warnings.length ? (
            <View className="flex-row items-center gap-1.5 mb-3">
              <AlertCircle size={14} color={colors.media.movie} />
              <Txt className="text-xs text-movie">{outcome.warnings.join(' · ')} — {t('using_local')}</Txt>
            </View>
          ) : null}
          {!isLoading && discover.length === 0 ? (
            <Txt className="text-sm text-subtle">{t('nothing_new', { q: debounced })}</Txt>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {discover.map(i => (
                <View key={i.id} style={{ width: 112 }}>
                  <View className="rounded-xl overflow-hidden bg-surface2" style={{ aspectRatio: 2 / 3 }}>
                    <Poster item={i} />
                    <View className="absolute top-1.5 left-1.5"><TypeBadge type={i.type} compact /></View>
                    <Pressable
                      onPress={() => addItem(i)} accessibilityLabel={`${t('add_short')} ${i.title}`}
                      className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-white items-center justify-center active:scale-90"
                    >
                      <Plus size={16} color="#09090b" />
                    </Pressable>
                  </View>
                  <Txt className="mt-1.5 text-xs font-medium" numberOfLines={1}>{i.title}</Txt>
                  <Txt className="text-xs text-subtle">{i.year}</Txt>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {visible.length ? (
        <View className="flex-row flex-wrap -mx-2">
          {visible.map(i => (
            <View key={i.id} className="px-2 mb-6" style={{ width: `${100 / cols}%` }}>
              <MediaCard
                item={i}
                onOpen={() => router.push({ pathname: '/item/[id]', params: { id: String(i.id) } })}
                onRate={v => updateItem(i.id, { myRating: v || undefined })}
              />
            </View>
          ))}
        </View>
      ) : (
        <View className="py-16 items-center gap-1">
          <LayoutGrid size={40} color={colors.subtle} />
          <Txt className="font-medium mt-2">{t('empty_title')}</Txt>
          <Txt className="text-sm text-subtle">{t('empty_body')}</Txt>
        </View>
      )}
    </Screen>
  );
}
