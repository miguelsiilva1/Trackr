import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrackr } from '@/store/useTrackr';
import { useApp } from '@/providers/AppProviders';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Txt } from './Txt';

const VISIBLE_MS = 2800;

export function Toast() {
  const toast = useTrackr(s => s.toast);
  const { t } = useApp();
  const { wide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
    const timer = setTimeout(() => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start(), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, anim]);

  if (!toast) return null;
  return (
    <View pointerEvents="none" className="absolute left-0 right-0 items-center px-4" style={{ bottom: (wide ? 32 : 96) + insets.bottom }}>
      <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View className="px-4 py-2.5 rounded-full bg-inv">
          <Txt className="text-sm font-semibold text-inv-fg text-center">{t(toast.key, toast.vars)}</Txt>
        </View>
      </Animated.View>
    </View>
  );
}
