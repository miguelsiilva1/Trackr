import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tDuration, tGenre, type TrackrItem, type Vote } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { Poster } from '@/components/Poster';
import { TypeBadge } from '@/components/TypeBadge';
import { Avatar } from '@/components/Avatar';
import { Txt } from '@/components/Txt';

const SWIPE_X = 110;
const SWIPE_UP = 120;
const native = Platform.OS !== 'web';

export interface SwipeDeckHandle {
  fling: (v: Vote) => void;
}

/** Top card follows the finger; release past a threshold votes. Buttons call fling() through the ref. */
export const SwipeDeck = forwardRef<SwipeDeckHandle, {
  top?: TrackrItem; next?: TrackrItem; friends: string[]; onVote: (item: TrackrItem, v: Vote) => void; empty: React.ReactNode;
}>(function SwipeDeck({ top, next, friends, onVote, empty }, ref) {
  const { t, lang } = useApp();
  const pos = useRef(new Animated.ValueXY()).current;
  const busy = useRef(false);
  const latest = useRef({ top, onVote });
  latest.current = { top, onVote };

  const fling = (v: Vote) => {
    const card = latest.current.top;
    if (!card || busy.current) return;
    busy.current = true;
    Haptics.impactAsync(v === 'pass' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const to = v === 'pass' ? { x: -700, y: 60 } : v === 'like' ? { x: 700, y: 60 } : { x: 0, y: -900 };
    Animated.timing(pos, { toValue: to, duration: 260, useNativeDriver: native }).start(() => {
      latest.current.onVote(card, v);
      pos.setValue({ x: 0, y: 0 });
      busy.current = false;
    });
  };

  useImperativeHandle(ref, () => ({ fling }));

  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_X) fling('like');
      else if (g.dx < -SWIPE_X) fling('pass');
      else if (g.dy < -SWIPE_UP) fling('super');
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: native, friction: 6 }).start();
    },
  })).current;

  const rotate = pos.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-16deg', '0deg', '16deg'] });
  const likeOpacity = pos.x.interpolate({ inputRange: [0, SWIPE_X], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = pos.x.interpolate({ inputRange: [-SWIPE_X, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const superOpacity = pos.y.interpolate({ inputRange: [-SWIPE_UP, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const present = top ? top.likedByFriends.filter(f => friends.includes(f)) : [];

  return (
    <View className="w-full self-center" style={{ maxWidth: 384, aspectRatio: 2 / 3 }}>
      {next && (
        <View className="rounded-3xl overflow-hidden border border-line bg-surface opacity-60" style={[StyleSheet.absoluteFill, { transform: [{ scale: 0.95 }, { translateY: 12 }] }]}>
          <Poster item={next} />
        </View>
      )}
      {top ? (
        <Animated.View
          key={top.id}
          {...responder.panHandlers}
          style={[StyleSheet.absoluteFill, styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }], cursor: 'grab' } as object]}
        >
          <Poster item={top} />
          <LinearGradient colors={['transparent', 'rgba(9,9,11,0.5)', '#09090b']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' }} />

          <Animated.View style={[styles.stamp, { top: 24, left: 20, borderColor: '#34d399', opacity: likeOpacity, transform: [{ rotate: '-12deg' }] }]}>
            <Txt className="text-emerald-400 font-black text-xl">{t('swipe_match')}</Txt>
          </Animated.View>
          <Animated.View style={[styles.stamp, { top: 24, right: 20, borderColor: '#f43f5e', opacity: passOpacity, transform: [{ rotate: '12deg' }] }]}>
            <Txt className="text-rose-500 font-black text-xl">{t('swipe_pass')}</Txt>
          </Animated.View>
          <Animated.View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: '33%', opacity: superOpacity }}>
            <View className="px-3 py-1 rounded-lg border-2 border-sky-400"><Txt className="text-sky-400 font-black text-xl">{t('swipe_super')}</Txt></View>
          </Animated.View>

          <View className="absolute top-4 left-4"><TypeBadge type={top.type} /></View>
          <View className="absolute bottom-0 left-0 right-0 p-5 gap-2.5">
            {present.length > 0 && (
              <View className="flex-row items-center gap-2 self-start px-2.5 py-1 rounded-full bg-black/70 border border-white/10">
                <View className="flex-row">{present.map((f, i) => <View key={f} style={{ marginLeft: i ? -6 : 0 }}><Avatar who={f} size={18} /></View>)}</View>
                <Txt className="text-xs font-bold text-white">
                  {present.length > 1 ? t('friends_backlog_many', { n: present.length }) : t('friends_backlog_one')}
                </Txt>
              </View>
            )}
            <Txt className="text-3xl font-black text-white">{top.title}</Txt>
            <Txt className="text-sm text-zinc-300">
              {top.year} · {tDuration(top.metaDuration, lang)}{top.rating > 0 ? ` · ★ ${top.rating.toFixed(1)}` : ''}
            </Txt>
            <View className="flex-row flex-wrap gap-1.5">
              {top.genres.map(g => <View key={g} className="px-2 py-0.5 rounded-full bg-white/10"><Txt className="text-xs text-white">{tGenre(g, lang)}</Txt></View>)}
            </View>
            {top.platforms.length > 0 && (
              <View className="flex-row items-center gap-1.5">
                <Play size={12} color="#a1a1aa" />
                <Txt className="text-xs text-zinc-400">{top.platforms.join(' · ')}</Txt>
              </View>
            )}
          </View>
        </Animated.View>
      ) : empty}
    </View>
  );
});

// Animated.View does not take NativeWind classes, so the moving card is styled inline.
const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#3f3f46', backgroundColor: '#18181b', userSelect: 'none' },
  stamp: { position: 'absolute', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 2 },
});
