import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Check, Plus, Search, Star, Wifi, WifiOff } from 'lucide-react-native';
import { MOCK_CATALOG, canReach, libKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import { useCatalogAccess } from '@/hooks/useCatalogAccess';
import { closeModal } from '@/lib/navigation';
import { Sheet } from '@/components/Sheet';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { Kicker, Txt } from '@/components/Txt';

export function AddSheet() {
  const { t, colors } = useApp();
  const items = useTrackr(s => s.items);
  const access = useCatalogAccess();
  const addItem = useTrackr(s => s.addItem);
  const [query, setQuery] = useState('');
  const { outcome, isLoading, debounced } = useMediaSearch(query, MOCK_CATALOG);
  const owned = useMemo(() => new Set(items.map(libKey)), [items]);
  const results = debounced.length >= 2 ? outcome?.items ?? [] : MOCK_CATALOG;
  const sources = (['tmdb', 'rawg'] as const).filter(api => canReach(api, access)).map(api => api.toUpperCase());
  const live = sources.length > 0;

  return (
    <Sheet onClose={closeModal} title={t('track_item')}>
      <View className="px-5 pb-3 border-b border-line gap-2">
        <View className="h-12 flex-row items-center rounded-xl bg-sunken border border-line px-3 gap-2">
          <Search size={18} color={colors.subtle} />
          <TextInput
            autoFocus value={query} onChangeText={setQuery} placeholder={t('add_ph')} placeholderTextColor={colors.subtle}
            className="flex-1 text-base text-fg h-full" style={{ outlineStyle: 'none' } as object}
          />
          {isLoading && debounced.length >= 2 && <ActivityIndicator size="small" color={colors.subtle} />}
        </View>
        <View className="flex-row items-center gap-1.5">
          {live ? <Wifi size={12} color={colors.media.game} /> : <WifiOff size={12} color={colors.subtle} />}
          <Txt className="text-xs text-subtle">
            {live ? t('live_search', { s: sources.join(' + ') }) : t('mock_hint')}
          </Txt>
        </View>
        {outcome?.warnings.length ? <Txt className="text-xs text-movie">{outcome.warnings.join(' · ')} — {t('using_local')}</Txt> : null}
      </View>

      <View className="p-3 gap-1">
        {debounced.length < 2 && <View className="px-2 pt-1 pb-2"><Kicker>{t('suggestions')}</Kicker></View>}
        {results.length === 0 && !isLoading && <Txt className="p-6 text-center text-sm text-subtle">{t('no_results', { q: debounced })}</Txt>}
        {results.map(i => {
          const has = owned.has(libKey(i));
          return (
            <View key={i.id} className="flex-row items-center gap-3 p-2 rounded-xl">
              <View className="w-12 h-16 rounded-lg overflow-hidden bg-surface2"><Poster item={i} /></View>
              <View className="flex-1 gap-1">
                <Txt className="font-medium text-sm" numberOfLines={1}>{i.title}</Txt>
                <View className="flex-row items-center gap-2">
                  <TypeBadge type={i.type} variant="surface" />
                  <Txt className="text-xs text-subtle">{i.year}</Txt>
                  {i.rating > 0 && (
                    <View className="flex-row items-center gap-0.5">
                      <Star size={11} color="#facc15" fill="#facc15" />
                      <Txt className="text-xs text-subtle">{i.rating.toFixed(1)}</Txt>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                disabled={has} onPress={() => addItem(i)}
                className={`h-9 px-3 rounded-lg flex-row items-center gap-1 active:scale-95 ${has ? 'bg-surface2' : 'bg-accent'}`}
              >
                {has ? <Check size={14} color={colors.media.game} /> : <Plus size={14} color={colors.accentFg} />}
                <Txt className={`text-xs font-semibold ${has ? 'text-game' : 'text-accent-fg'}`}>{has ? t('in_trackr') : t('add_short')}</Txt>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}
