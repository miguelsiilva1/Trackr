import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Globe, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FRIENDS, formatAgo, libKey, type FeedEntry, type Reaction, type StrKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Card, Segmented } from '@/components/Controls';
import { Avatar } from '@/components/Avatar';
import { Poster } from '@/components/Poster';
import { StarRating } from '@/components/StarRating';
import { TypeBadge } from '@/components/TypeBadge';
import { Txt } from '@/components/Txt';

type Tab = 'global' | 'tribe';

const REACTIONS: Reaction[] = ['🔥', '👏', '🤯'];

function ReactionButton({ entry, r }: { entry: FeedEntry; r: Reaction }) {
  const react = useTrackr(s => s.react);
  const scale = useRef(new Animated.Value(1)).current;
  const mine = entry.mine.includes(r);
  const press = () => {
    Haptics.selectionAsync().catch(() => {});
    react(entry.id, r);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 110, useNativeDriver: false }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: false }),
    ]).start();
  };
  return (
    <Pressable onPress={press} className={`h-8 px-3 rounded-full flex-row items-center gap-1.5 border active:scale-90 ${mine ? 'bg-accent/15 border-accent' : 'bg-sunken border-line'}`}>
      <Animated.Text style={{ transform: [{ scale }] }}>{r}</Animated.Text>
      <Txt className={`text-xs font-semibold ${mine ? 'text-fg' : 'text-muted'}`}>{entry.reactions[r]}</Txt>
    </Pressable>
  );
}

/** One activity: who did what, then the title as a banner made from its poster. */
function FeedCard({ f }: { f: FeedEntry }) {
  const { t, lang } = useApp();
  const me = useTrackr(s => s.me);
  const owned = useTrackr(s => s.items.find(i => libKey(i) === libKey(f.item)));
  const name = f.who === 'me' ? me.name || t('you') : f.who;
  const openItem = owned ? () => router.push({ pathname: '/item/[id]', params: { id: String(owned.id) } }) : undefined;

  return (
    <View className="rounded-2xl bg-surface border border-line overflow-hidden">
      <View className="flex-row items-center gap-3 p-4">
        <Avatar who={f.who} size={40} />
        <View className="flex-1">
          <Txt className="text-sm leading-snug" numberOfLines={2}>
            <Txt className="font-bold">{name}</Txt>{' '}
            <Txt className="text-muted">{t(`v_${f.verb}` as StrKey, { x: f.extra ?? '' })}</Txt>
          </Txt>
          <Txt className="text-xs text-subtle">{formatAgo(f.ts, lang)}</Txt>
        </View>
      </View>

      <Pressable onPress={openItem} disabled={!openItem} className="mx-4 rounded-xl overflow-hidden active:opacity-80" style={{ height: 150 }}>
        <Poster item={f.item} blur={28} />
        <LinearGradient colors={['rgba(8,8,14,0.85)', 'rgba(8,8,14,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <View className="flex-row items-center gap-4 p-3" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
          <View className="rounded-lg overflow-hidden border border-white/20" style={{ height: '100%', aspectRatio: 2 / 3 }}>
            <Poster item={f.item} />
          </View>
          <View className="flex-1 gap-1.5">
            <TypeBadge type={f.item.type} />
            <Txt className="text-lg font-black text-white" numberOfLines={2}>{f.item.title}</Txt>
            {f.rating ? <StarRating value={f.rating} size={14} /> : null}
          </View>
        </View>
        <View className={`absolute left-0 top-0 bottom-0 w-1 ${MEDIA_CLASSES[f.item.type].solid}`} />
      </Pressable>

      <View className="flex-row gap-2 p-4">
        {REACTIONS.map(r => <ReactionButton key={r} entry={f} r={r} />)}
      </View>
    </View>
  );
}

function TribeNow() {
  const { t, colors } = useApp();
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-3">
        <Users size={15} color={colors.fg} />
        <Txt className="text-sm font-semibold">{t('tribe_now')}</Txt>
      </View>
      <View className="gap-3">
        {FRIENDS.map(f => (
          <View key={f.name} className="flex-row items-center gap-3">
            <Avatar who={f.name} size={36} dot />
            <View>
              <Txt className="text-sm font-medium">{f.name}</Txt>
              <Txt className="text-xs text-subtle">{t('consuming')} <Txt className="text-xs text-fg">{f.now}</Txt></Txt>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Titles with the most activity and reactions in the global feed. */
function Trending({ feed }: { feed: FeedEntry[] }) {
  const { t, colors } = useApp();
  const top = useMemo(() => {
    const score = new Map<string, { entry: FeedEntry; n: number }>();
    for (const f of feed) {
      const k = libKey(f.item);
      const n = 5 + Object.values(f.reactions).reduce((a, b) => a + b, 0);
      score.set(k, { entry: score.get(k)?.entry ?? f, n: (score.get(k)?.n ?? 0) + n });
    }
    return [...score.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  }, [feed]);
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-3">
        <Flame size={15} color={colors.accent} />
        <Txt className="text-sm font-semibold">{t('trending')}</Txt>
      </View>
      <View className="gap-3">
        {top.map(({ entry }, i) => (
          <View key={libKey(entry.item)} className="flex-row items-center gap-3">
            <Txt className="w-5 text-lg font-black text-subtle">{i + 1}</Txt>
            <View className="w-9 rounded-md overflow-hidden bg-surface2" style={{ aspectRatio: 2 / 3 }}><Poster item={entry.item} /></View>
            <View className="flex-1">
              <Txt className="text-sm font-medium" numberOfLines={1}>{entry.item.title}</Txt>
              <Txt className="text-xs text-subtle">{t(`type_${entry.item.type}` as StrKey)}</Txt>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function FeedScreen() {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const tribe = useTrackr(s => s.feed);
  const global = useTrackr(s => s.globalFeed);
  const [tab, setTab] = useState<Tab>('tribe');
  // Global = everyone, including your tribe, newest first.
  const all = useMemo(() => [...global, ...tribe].sort((a, b) => b.ts - a.ts), [global, tribe]);
  const feed = tab === 'tribe' ? tribe : all;

  return (
    <Screen>
      <View className={`gap-3 mb-6 ${wide ? 'flex-row items-center justify-between' : ''}`}>
        <Txt className={`${wide ? 'text-4xl' : 'text-2xl'} font-black tracking-tight`}>{t('nav_feed')}</Txt>
        <Segmented<Tab>
          value={tab} onChange={setTab}
          options={[
            { id: 'tribe', label: t('feed_tribe'), icon: <Users size={14} color={colors.muted} /> },
            { id: 'global', label: t('feed_global'), icon: <Globe size={14} color={colors.muted} /> },
          ]}
        />
      </View>
      <View className={`gap-6 ${wide ? 'flex-row items-start' : ''}`}>
        <View className="gap-4" style={{ flex: wide ? 2 : undefined }}>
          {feed.map(f => <FeedCard key={f.id} f={f} />)}
        </View>
        <View className="gap-4" style={{ flex: wide ? 1 : undefined }}>
          {tab === 'tribe' ? <TribeNow /> : <Trending feed={all} />}
        </View>
      </View>
    </Screen>
  );
}
