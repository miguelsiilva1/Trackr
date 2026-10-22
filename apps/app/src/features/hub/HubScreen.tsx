import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, LayoutGrid, Plus, Search, X } from 'lucide-react-native';
import {
  MEDIA_TYPES, MOCK_CATALOG, libKey, normalize, tGenre, type MediaStatus, type MediaType, type StrKey, type TrackrItem,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import { Screen } from '@/components/Screen';
import { MediaIcon } from '@/components/MediaIcon';
import { Txt } from '@/components/Txt';
import { ContinueCard, PosterCard } from './Cards';
import { Rail } from './Rail';

type CatFilter = 'all' | MediaType;

const ROWS: { status: MediaStatus; title: StrKey }[] = [
  { status: 'in_progress', title: 'row_progress' },
  { status: 'backlog', title: 'row_backlog' },
  { status: 'completed', title: 'st_completed_pl' },
  { status: 'dropped', title: 'st_dropped_pl' },
];

const GAP = 14;
const MAX_WIDTH = 1600;
const open = (i: TrackrItem) => router.push({ pathname: '/item/[id]', params: { id: String(i.id) } });

function TypeSwitcher({ value, onChange, counts }: { value: CatFilter; onChange: (c: CatFilter) => void; counts: Record<CatFilter, number> }) {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const options: { id: CatFilter; label: string }[] = [
    { id: 'all', label: t('cat_all') },
    ...MEDIA_TYPES.map(ty => ({ id: ty, label: t(`types_${ty}` as StrKey) })),
  ];
  return (
    <View className={`flex-row p-1 rounded-full bg-surface border border-line ${wide ? 'self-start' : ''}`}>
      {options.map(o => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id} onPress={() => onChange(o.id)}
            className={`h-9 px-3.5 rounded-full flex-row items-center justify-center gap-1.5 ${wide ? '' : 'flex-1'} ${on ? 'bg-accent' : ''}`}
          >
            {o.id !== 'all' && <MediaIcon type={o.id} size={14} color={on ? colors.accentFg : colors.muted} />}
            <Txt className={`text-sm font-semibold ${on ? 'text-accent-fg' : 'text-muted'}`}>{o.label}</Txt>
            {wide && counts[o.id] > 0 && <Txt className={`text-xs ${on ? 'text-accent-fg opacity-70' : 'text-subtle'}`}>{counts[o.id]}</Txt>}
          </Pressable>
        );
      })}
    </View>
  );
}

export function HubScreen() {
  const { t, lang, colors } = useApp();
  const { width, wide } = useBreakpoint();
  const items = useTrackr(s => s.items);
  const addItem = useTrackr(s => s.addItem);
  const [cat, setCat] = useState<CatFilter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<MediaStatus | null>(null);
  const { outcome, isLoading, debounced } = useMediaSearch(query, MOCK_CATALOG);

  const inCat = useMemo(() => items.filter(i => cat === 'all' || i.type === cat), [items, cat]);
  const counts = useMemo(() => ({
    all: items.length, movie: 0, series: 0, game: 0,
    ...Object.fromEntries(MEDIA_TYPES.map(ty => [ty, items.filter(i => i.type === ty).length])),
  }) as Record<CatFilter, number>, [items]);
  const owned = useMemo(() => new Set(items.map(libKey)), [items]);

  const q = normalize(query);
  const matches = q
    ? inCat.filter(i => normalize(i.title).includes(q) || i.genres.some(g => normalize(g).includes(q) || normalize(tGenre(g, lang)).includes(q)))
    : [];
  const discover = (outcome?.items ?? []).filter(i => !owned.has(libKey(i)) && (cat === 'all' || i.type === cat));

  // Card sizes: rails scroll, expanded rows wrap into a grid that fills the content width.
  const contentWidth = Math.min(width, MAX_WIDTH) - (wide ? 64 : 32);
  const posterW = wide ? 158 : 120;
  const continueW = wide ? 300 : 252;
  const gridW = (min: number) => {
    const cols = Math.max(2, Math.floor((contentWidth + GAP) / (min + GAP)));
    return (contentWidth - GAP * (cols - 1)) / cols;
  };

  return (
    <Screen maxWidth={MAX_WIDTH}>
      <View className={`gap-3 mb-8 ${wide ? 'flex-row items-center justify-between' : ''}`}>
        <TypeSwitcher value={cat} onChange={c => { setCat(c); setExpanded(null); }} counts={counts} />
        <View className="h-10 flex-row items-center rounded-full bg-surface border border-line px-3.5 gap-2" style={{ width: wide ? 340 : '100%' }}>
          <Search size={16} color={colors.subtle} />
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
      </View>

      {q ? (
        <>
          {matches.length > 0 && (
            <Rail title={t('in_library')} count={matches.length}>
              {matches.map(i => <PosterCard key={i.id} item={i} width={posterW} onOpen={() => open(i)} />)}
            </Rail>
          )}
          {debounced.length >= 2 && (
            <Rail title={`${t('discover')} · ${outcome?.source === 'remote' ? t('src_live') : t('src_local')}`} count={discover.length}>
              {discover.map(i => (
                <View key={i.id} style={{ width: posterW }}>
                  <PosterCard item={i} onOpen={() => addItem(i)} />
                  <Pressable
                    onPress={() => addItem(i)} accessibilityLabel={`${t('add_short')} ${i.title}`}
                    className="absolute right-2 w-8 h-8 rounded-full bg-accent items-center justify-center active:scale-90"
                    style={{ top: posterW * 1.5 - 40 }}
                  >
                    <Plus size={16} color={colors.accentFg} />
                  </Pressable>
                </View>
              ))}
            </Rail>
          )}
          {outcome?.warnings.length ? (
            <View className="flex-row items-center gap-1.5 -mt-6 mb-6">
              <AlertCircle size={14} color={colors.media.movie} />
              <Txt className="text-xs text-movie">{outcome.warnings.join(' · ')} — {t('using_local')}</Txt>
            </View>
          ) : null}
          {!matches.length && !isLoading && debounced.length >= 2 && !discover.length && (
            <Txt className="text-sm text-subtle">{t('nothing_new', { q: debounced })}</Txt>
          )}
        </>
      ) : inCat.length ? (
        ROWS.map(({ status, title }) => {
          const row = inCat.filter(i => i.myStatus === status);
          if (!row.length) return null;
          const isOpen = expanded === status;
          const landscape = status === 'in_progress';
          const w = isOpen ? gridW(landscape ? continueW : posterW) : landscape ? continueW : posterW;
          return (
            <Rail key={status} title={t(title)} count={row.length} expanded={isOpen} onToggle={() => setExpanded(isOpen ? null : status)}>
              {row.map(i => landscape
                ? <ContinueCard key={i.id} item={i} width={w} onOpen={() => open(i)} />
                : <PosterCard key={i.id} item={i} width={w} onOpen={() => open(i)} />)}
            </Rail>
          );
        })
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
