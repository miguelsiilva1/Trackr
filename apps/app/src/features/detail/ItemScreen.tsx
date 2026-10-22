import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ImageIcon, RefreshCw, Trash2 } from 'lucide-react-native';
import {
  MEDIA_STATUSES, PROVIDERS, STATUS_HEX, backdropOf, statusLabel, summaryOf, tDuration, tGenre,
  type ProviderId, type TrackrItem,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useItemDetails } from '@/hooks/useItemDetails';
import { closeModal } from '@/lib/navigation';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { StarRating } from '@/components/StarRating';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Controls';
import { Kicker, Txt } from '@/components/Txt';
import { SeasonsSection } from './SeasonsSection';
import { AchievementsSection } from './AchievementsSection';
import { ArtworkSheet } from './ArtworkSheet';
import { RatingsCard } from './RatingsCard';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Kicker>{label}</Kicker>
      {typeof children === 'string' ? <Txt className="text-sm">{children}</Txt> : children}
    </View>
  );
}

function RoundButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} className="h-10 px-3 rounded-full bg-black/55 border border-white/15 flex-row items-center gap-2 active:scale-95">
      {children}
    </Pressable>
  );
}

/** Full page for one title: banner, artwork, status, rating, notes and seasons or achievements. */
export function ItemScreen({ id }: { id: string }) {
  const { t, lang, colors } = useApp();
  const { wide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const item = useTrackr(s => s.items.find(i => String(i.id) === id));
  const updateItem = useTrackr(s => s.updateItem);
  const removeItem = useTrackr(s => s.removeItem);
  const details = useItemDetails(item);
  const [artOpen, setArtOpen] = useState(false);

  if (!item) {
    return (
      <View className="flex-1 bg-app items-center justify-center gap-3">
        <Txt className="text-subtle">{t('empty_title')}</Txt>
        <Pressable onPress={closeModal}><Txt className="text-accent font-semibold">{t('back')}</Txt></Pressable>
      </View>
    );
  }

  const m = MEDIA_CLASSES[item.type];
  // Real banner, Letterboxd-style: custom > title's own > first one the provider offers. Never a blurred poster.
  const banner = backdropOf(item) || details?.artwork.backdrops[0];
  const links = Object.keys(item.links ?? {}) as ProviderId[];
  const update = (patch: Partial<TrackrItem>) => updateItem(item.id, patch);
  const heroH = wide ? 520 : 240;
  const posterW = wide ? 220 : 116;

  const typeSection = !details ? (
    <View className="flex-row items-center gap-2 py-6">
      <ActivityIndicator size="small" color={colors.subtle} />
      <Txt className="text-sm text-subtle">{t('loading')}</Txt>
    </View>
  ) : (
    <>
      {details.seasons?.length ? <SeasonsSection item={item} seasons={details.seasons} onChange={update} /> : null}
      {details.achievements?.length ? <AchievementsSection item={item} achievements={details.achievements} onChange={update} /> : null}
      {details.source === 'mock' && item.type !== 'movie' && !details.achievements?.[0]?.image && (
        <Txt className="text-xs text-subtle">{t('sample_data', { s: item.type === 'game' ? 'RAWG' : 'TMDB' })}</Txt>
      )}
    </>
  );

  const side = (
    <View className="gap-4">
      <Card className="gap-4">
        <Txt className="font-bold">{t('details_title')}</Txt>
        <Fact label={t('d_release')}>{String(item.year)}</Fact>
        <Fact label={t('d_duration')}>{tDuration(item.metaDuration, lang)}</Fact>
        {item.genres.length > 0 && <Fact label={t('d_genres')}>{item.genres.map(g => tGenre(g, lang)).join(', ')}</Fact>}
        {item.platforms.length > 0 && (
          <Fact label={item.type === 'game' ? t('where_play') : t('where_watch')}>
            <View className="flex-row flex-wrap gap-1.5">
              {item.platforms.map(p => <View key={p} className="px-2.5 py-1 rounded-lg bg-surface2"><Txt className="text-xs">{p}</Txt></View>)}
            </View>
          </Fact>
        )}
      </Card>

      {item.rating > 0 && <RatingsCard item={item} />}

      <Card className="gap-2">
        <Kicker>{t('notes')}</Kicker>
        <TextInput
          value={item.notes ?? ''} onChangeText={notes => update({ notes })} multiline numberOfLines={4}
          placeholder={item.type === 'game' ? t('notes_ph_game') : t('notes_ph')} placeholderTextColor={colors.subtle}
          className="rounded-xl bg-sunken border border-line p-3 text-sm text-fg" style={{ minHeight: 96, textAlignVertical: 'top', outlineStyle: 'none' } as object}
        />
      </Card>

      {item.likedByFriends.length > 0 && (
        <Card className="flex-row items-center gap-3">
          <View className="flex-row">{item.likedByFriends.map((f, i) => <View key={f} style={{ marginLeft: i ? -8 : 0 }}><Avatar who={f} size={28} /></View>)}</View>
          <Txt className="text-xs text-muted flex-1">
            {t(item.likedByFriends.length > 1 ? 'friends_have_many' : 'friends_have_one', { names: item.likedByFriends.join(', ') })}
          </Txt>
        </Card>
      )}

      <View className="gap-2 px-1">
        <Txt className="text-xs text-subtle">
          {t('source')}: {item.apiSource === 'local_mock' ? t('mock_source') : item.apiSource.toUpperCase()}{item.externalId ? ` · #${item.externalId}` : ''}
        </Txt>
        {links.length > 0 && (
          <View className="flex-row items-center gap-1">
            <RefreshCw size={12} color={colors.media.game} />
            <Txt className="text-xs text-game">{t('synced_with')} {links.map(l => PROVIDERS.find(p => p.id === l)?.name).join(', ')}</Txt>
          </View>
        )}
        <Pressable onPress={() => { removeItem(item.id); closeModal(); }} className="flex-row items-center gap-1.5 self-start mt-1">
          <Trash2 size={14} color="#f43f5e" />
          <Txt className="text-xs text-rose-500">{t('remove')}</Txt>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-app">
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <View style={{ height: heroH, maxWidth: 1440 }} className="w-full self-center overflow-hidden">
          {banner ? <Image source={banner} contentFit="cover" contentPosition="top" transition={200} style={StyleSheet.absoluteFill} /> : <View className={`absolute inset-0 ${m.soft}`} />}
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent', colors.bg]} locations={[0, 0.3, 0.55, 1]} style={StyleSheet.absoluteFill} />
          {wide && (
            <>
              <LinearGradient colors={[colors.bg, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 160 }} />
              <LinearGradient colors={['transparent', colors.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 160 }} />
            </>
          )}
        </View>

        <View className="w-full self-center" style={{ maxWidth: 1200, paddingHorizontal: wide ? 32 : 16, marginTop: -(wide ? 220 : 120) }}>
          <View className="flex-row gap-5 items-end">
            <Pressable onPress={() => setArtOpen(true)} className="rounded-2xl overflow-hidden border border-strong bg-surface2" style={{ width: posterW, aspectRatio: 2 / 3 }}>
              <Poster item={item} />
            </Pressable>
            <View className="flex-1 gap-2 pb-1">
              <TypeBadge type={item.type} variant="solid" />
              <Txt className={`${wide ? 'text-5xl' : 'text-2xl'} font-black tracking-tight`} numberOfLines={3}>{item.title}</Txt>
              <Txt className="text-sm text-muted">
                {[String(item.year), tDuration(item.metaDuration, lang), ...item.genres.slice(0, 2).map(g => tGenre(g, lang))].join(' · ')}
              </Txt>
            </View>
          </View>

          <View className={`mt-6 rounded-2xl bg-surface border border-line p-3 gap-3 ${wide ? 'flex-row items-center' : ''}`}>
            <View className="flex-row flex-wrap gap-1.5 flex-1">
              {MEDIA_STATUSES.map(s => {
                const on = item.myStatus === s;
                return (
                  <Pressable
                    key={s} onPress={() => update({ myStatus: s })}
                    className={`h-10 px-4 rounded-xl flex-row items-center gap-2 border active:scale-95 ${on ? `${m.soft} ${m.border}` : 'bg-sunken border-line'}`}
                  >
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
                    <Txt className={`text-sm font-semibold ${on ? m.text : 'text-muted'}`}>{statusLabel(s, item.type, t)}</Txt>
                  </Pressable>
                );
              })}
            </View>
            <View className={`flex-row items-center gap-3 ${wide ? 'pl-4 border-l border-line' : 'px-1'}`}>
              <Kicker>{t('my_rating')}</Kicker>
              <StarRating value={item.myRating} onChange={v => update({ myRating: v || undefined })} size={24} />
            </View>
          </View>

          <View className={`mt-8 gap-8 ${wide ? 'flex-row items-start' : ''}`}>
            <View className="gap-8" style={{ flex: wide ? 2 : undefined }}>
              <View className="gap-2">
                <Txt className="text-xl font-bold">{t('synopsis')}</Txt>
                <Txt className="text-base leading-relaxed text-muted">{summaryOf(item, lang, t)}</Txt>
              </View>
              {typeSection}
            </View>
            <View style={{ flex: wide ? 1 : undefined }}>{side}</View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 flex-row justify-between px-4" style={{ top: insets.top + 12 }}>
        <RoundButton onPress={closeModal} label={t('back')}><ArrowLeft size={18} color="#fff" />{wide && <Txt className="text-sm text-white font-semibold">{t('back')}</Txt>}</RoundButton>
        <RoundButton onPress={() => setArtOpen(true)} label={t('edit_art')}><ImageIcon size={16} color="#fff" /><Txt className="text-sm text-white font-semibold">{t('edit_art')}</Txt></RoundButton>
      </View>

      {artOpen && <ArtworkSheet item={item} artwork={details?.artwork} onChange={update} onClose={() => setArtOpen(false)} />}
    </View>
  );
}
