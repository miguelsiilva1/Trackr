import { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FRIENDS, formatAgo, type FeedEntry, type Reaction, type StrKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MEDIA_CLASSES } from '@/theme/tokens';
import { PageHeader, Screen } from '@/components/Screen';
import { Card } from '@/components/Controls';
import { Avatar } from '@/components/Avatar';
import { MediaIcon } from '@/components/MediaIcon';
import { Poster } from '@/components/Poster';
import { StarRating } from '@/components/StarRating';
import { Txt } from '@/components/Txt';

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
    <Pressable onPress={press} className={`h-8 px-3 rounded-full flex-row items-center gap-1.5 border active:scale-90 ${mine ? 'bg-surface2 border-strong' : 'bg-sunken border-line'}`}>
      <Animated.Text style={{ transform: [{ scale }] }}>{r}</Animated.Text>
      <Txt className={`text-xs font-semibold ${mine ? 'text-fg' : 'text-muted'}`}>{entry.reactions[r]}</Txt>
    </Pressable>
  );
}

function FeedItem({ f }: { f: FeedEntry }) {
  const { t, lang, colors } = useApp();
  const m = MEDIA_CLASSES[f.item.type];
  return (
    <View className="pl-14">
      <View className="absolute left-0 top-0"><Avatar who={f.who} size={40} /></View>
      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1">
            <Txt className="text-sm leading-snug">
              <Txt className="font-bold">{f.who === 'me' ? t('you') : f.who}</Txt>{' '}
              <Txt className="text-muted">{t(`v_${f.verb}` as StrKey, { x: f.extra ?? '' })}</Txt>{' '}
              <Txt className={`font-bold ${m.text}`}>{f.item.title}</Txt>
              {f.verb === 'completed' && f.extra ? <Txt className="text-subtle"> ({f.extra})</Txt> : null}
            </Txt>
            {f.rating ? <StarRating value={f.rating} size={14} /> : null}
            <View className="flex-row items-center gap-1.5">
              <MediaIcon type={f.item.type} size={12} color={colors.subtle} />
              <Txt className="text-xs text-subtle">{t(`type_${f.item.type}` as StrKey)} · {formatAgo(f.ts, lang)}</Txt>
            </View>
          </View>
          <View className="w-12 h-16 rounded-lg overflow-hidden bg-surface2"><Poster item={f.item} /></View>
        </View>
        <View className="mt-3 flex-row gap-2">
          {REACTIONS.map(r => <ReactionButton key={r} entry={f} r={r} />)}
        </View>
      </Card>
    </View>
  );
}

export function FeedScreen() {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const feed = useTrackr(s => s.feed);

  return (
    <Screen>
      <PageHeader kicker={t('feed_kicker')} title={t('nav_feed')} />
      <View className={`gap-6 ${wide ? 'flex-row items-start' : ''}`}>
        <View className="gap-4" style={{ flex: wide ? 2 : undefined }}>
          <View className="absolute left-5 top-2 bottom-2 w-px bg-surface2" />
          {feed.map(f => <FeedItem key={f.id} f={f} />)}
        </View>
        <View style={{ flex: wide ? 1 : undefined }}>
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
        </View>
      </View>
    </Screen>
  );
}
