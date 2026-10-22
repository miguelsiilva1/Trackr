import { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Heart, RotateCcw, Sparkles, Star, X } from 'lucide-react-native';
import { FRIENDS, startWhere, type MediaType, type StrKey, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PageHeader, Screen } from '@/components/Screen';
import { Card, Pill } from '@/components/Controls';
import { Avatar } from '@/components/Avatar';
import { MediaIcon } from '@/components/MediaIcon';
import { Poster } from '@/components/Poster';
import { Txt } from '@/components/Txt';
import { SwipeDeck, type SwipeDeckHandle } from './SwipeDeck';

const PLANS: { id: MediaType; key: StrKey; box: string; text: string }[] = [
  { id: 'movie', key: 'plan_movie', box: 'bg-amber-500', text: 'text-zinc-950' },
  { id: 'series', key: 'plan_series', box: 'bg-cyan-500', text: 'text-zinc-950' },
  { id: 'game', key: 'plan_game', box: 'bg-emerald-500', text: 'text-zinc-950' },
];

export function MatchScreen() {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const { items, friends, plan, votes, matches, setFriends, setPlan, vote, resetDeck } = useTrackr();
  const deckRef = useRef<SwipeDeckHandle>(null);

  const deck = useMemo(() => {
    const social = (i: TrackrItem) => i.likedByFriends.filter(f => friends.includes(f)).length;
    return items
      .filter(i => i.type === plan && (plan !== 'game' || i.genres.includes('Co-op')))
      .filter(i => i.myStatus !== 'completed' && i.myStatus !== 'dropped' && !votes[String(i.id)])
      .sort((a, b) => social(b) - social(a) || b.rating - a.rating);
  }, [items, plan, friends, votes]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => {
      if (document.querySelector('[aria-modal="true"]') || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') deckRef.current?.fling('pass');
      if (e.key === 'ArrowRight') deckRef.current?.fling('like');
      if (e.key === 'ArrowUp') { e.preventDefault(); deckRef.current?.fling('super'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const empty = (
    <View className="rounded-3xl border border-dashed border-strong items-center justify-center p-8 gap-3" style={StyleSheet.absoluteFill}>
      <Sparkles size={36} color={colors.subtle} />
      <Txt className="font-semibold">{t('deck_empty')}</Txt>
      <Txt className="text-sm text-subtle text-center">{t('deck_empty_body')}</Txt>
      <Pressable onPress={resetDeck} className="mt-2 h-10 px-4 rounded-xl bg-surface2 flex-row items-center gap-1.5">
        <RotateCcw size={15} color={colors.fg} />
        <Txt className="text-sm">{t('reshuffle')}</Txt>
      </Pressable>
    </View>
  );

  const side = (
    <View className="gap-4">
      <Card>
        <View className="flex-row items-center gap-2 mb-3">
          <Heart size={15} color="#f43f5e" />
          <Txt className="text-sm font-semibold">{t('session_matches')}</Txt>
        </View>
        {matches.length ? (
          <View className="gap-2">
            {matches.map(i => (
              <View key={i.id} className="flex-row items-center gap-3">
                <View className="w-10 h-14 rounded-md overflow-hidden bg-surface2"><Poster item={i} /></View>
                <View className="flex-1">
                  <Txt className="text-sm font-medium" numberOfLines={1}>{i.title}</Txt>
                  <Txt className="text-xs text-subtle">{startWhere(i)}</Txt>
                </View>
              </View>
            ))}
          </View>
        ) : <Txt className="text-sm text-subtle">{t('no_matches')}</Txt>}
      </Card>
      <Card className="gap-1.5">
        <Txt className="font-semibold text-sm">{t('how_title')}</Txt>
        <Txt className="text-sm text-muted">{t('how_1')}</Txt>
        <Txt className="text-sm text-muted">{t('how_2')}</Txt>
        <Txt className="text-sm text-muted">{t('how_3', { n: deck.length })}</Txt>
      </Card>
    </View>
  );

  return (
    <Screen>
      <PageHeader kicker={t('match_kicker')} title={<Txt className={`${wide ? 'text-4xl' : 'text-2xl'} font-black tracking-tight`}>Trackr<Txt className="text-game">Match</Txt></Txt>} />

      <View className={`gap-6 ${wide ? 'flex-row items-start' : ''}`}>
        <View className="gap-5" style={{ flex: wide ? 2 : undefined }}>
          <Card className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-4">
                {FRIENDS.map(f => {
                  const on = friends.includes(f.name);
                  return (
                    <Pressable
                      key={f.name} onPress={() => setFriends(on ? friends.filter(x => x !== f.name) : [...friends, f.name])}
                      className={`items-center gap-1 active:scale-90 ${on ? '' : 'opacity-40'}`}
                    >
                      <Avatar who={f.name} size={44} ring={on} dot={on} />
                      <Txt className="text-xs font-medium">{f.name}</Txt>
                    </Pressable>
                  );
                })}
              </View>
              <Txt className="text-xs text-subtle text-right">{friends.length ? t('in_session', { n: friends.length + 1 }) : t('pick_tribe')}</Txt>
            </View>
            <View className="gap-2">
              <Txt className="text-sm font-semibold">{t('plan_q')}</Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PLANS.map(p => {
                  const on = plan === p.id;
                  return (
                    <Pill key={p.id} active={on} onPress={() => setPlan(p.id)} activeClass={p.box}>
                      <MediaIcon type={p.id} size={15} color={on ? '#09090b' : colors.muted} />
                      <Txt className={`text-sm font-medium ${on ? p.text : 'text-muted'}`}>{t(p.key)}</Txt>
                    </Pill>
                  );
                })}
              </ScrollView>
            </View>
          </Card>

          <SwipeDeck ref={deckRef} top={deck[0]} next={deck[1]} friends={friends} onVote={vote} empty={empty} />

          <View className="flex-row items-center justify-center gap-5">
            <Pressable onPress={() => deckRef.current?.fling('pass')} disabled={!deck[0]} accessibilityLabel={t('pass')}
              className="w-16 h-16 rounded-full bg-surface border-2 border-rose-500/60 items-center justify-center active:scale-90 disabled:opacity-30">
              <X size={30} strokeWidth={3} color="#f43f5e" />
            </Pressable>
            <Pressable onPress={() => deckRef.current?.fling('super')} disabled={!deck[0]} accessibilityLabel={t('super')}
              className="w-12 h-12 rounded-full bg-surface border-2 border-sky-500/60 items-center justify-center active:scale-90 disabled:opacity-30">
              <Star size={22} color="#0ea5e9" fill="#0ea5e9" />
            </Pressable>
            <Pressable onPress={() => deckRef.current?.fling('like')} disabled={!deck[0]} accessibilityLabel={t('align')}
              className="w-16 h-16 rounded-full bg-surface border-2 border-emerald-500/60 items-center justify-center active:scale-90 disabled:opacity-30">
              <Txt className="text-3xl">{plan === 'game' ? '🎮' : '🍿'}</Txt>
            </Pressable>
          </View>
          <Txt className="text-center text-xs text-subtle">{Platform.OS === 'web' && wide ? t('kb_hint') : t('swipe_hint')}</Txt>
        </View>

        <View style={{ flex: wide ? 1 : undefined }}>{side}</View>
      </View>
    </Screen>
  );
}
