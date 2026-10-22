import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { vars } from 'nativewind';
import { Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { startWhere } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { cssVars } from '@/theme/tokens';
import { Poster } from '@/components/Poster';
import { Avatar } from '@/components/Avatar';
import { Txt } from '@/components/Txt';

const CONFETTI_COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#f43f5e', '#38bdf8', '#facc15'];
const native = Platform.OS !== 'web';

function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: Math.random() * width,
    drift: (Math.random() - 0.5) * 160,
    delay: Math.random() * 700,
    duration: 2200 + Math.random() * 1600,
    size: 6 + Math.random() * 6,
    round: Math.random() > 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    progress: new Animated.Value(0),
  })), [width]);

  useEffect(() => {
    pieces.forEach(p => Animated.timing(p.progress, {
      toValue: 1, duration: p.duration, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: native,
    }).start());
  }, [pieces]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', top: -20, left: p.left, width: p.size, height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? p.size : 2, backgroundColor: p.color,
            transform: [
              { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
              { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '900deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Global overlay shown when a vote completes a group match. */
export function MatchCelebration() {
  const { t, theme, colors } = useApp();
  const celebrate = useTrackr(s => s.celebrate);
  const close = useTrackr(s => s.closeCelebration);
  const start = useTrackr(s => s.startCelebrated);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebrate) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, useNativeDriver: native }).start();
  }, [celebrate, pop]);

  if (!celebrate) return null;
  const { item, approvers } = celebrate;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} className="flex-1 items-center justify-center p-5 bg-black/80" style={vars(cssVars(theme))}>
        <Confetti />
        <Animated.View style={{ width: '100%', maxWidth: 384, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: pop }}>
          <Pressable onPress={e => e.stopPropagation()} className="rounded-3xl overflow-hidden bg-surface border border-strong">
            <View className="h-56">
              <Poster item={item} />
              <LinearGradient colors={['transparent', colors.surface]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }} />
            </View>
            <View className="p-6 -mt-12 items-center">
              <View className="flex-row mb-3">
                {['me', ...approvers].map((a, i) => <View key={a} style={{ marginLeft: i ? -12 : 0 }}><Avatar who={a} size={44} /></View>)}
              </View>
              <Txt className="text-3xl font-black text-center text-game">{t('match_title')}</Txt>
              <Txt className="mt-2 font-semibold text-center">{item.title}</Txt>
              <Txt className="mt-1 text-sm text-muted text-center">{t('available_on', { w: startWhere(item) })}</Txt>
              <View className="mt-5 flex-row gap-2 w-full">
                <Pressable onPress={close} className="flex-1 h-12 rounded-xl bg-surface2 items-center justify-center">
                  <Txt className="font-medium">{t('later')}</Txt>
                </Pressable>
                <Pressable onPress={start} className="flex-1 h-12 rounded-xl bg-emerald-500 flex-row items-center justify-center gap-1.5 active:scale-95">
                  <Play size={18} color="#09090b" fill="#09090b" />
                  <Txt className="font-bold text-zinc-950">{t('start')}</Txt>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
