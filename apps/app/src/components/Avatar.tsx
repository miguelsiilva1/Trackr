import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FRIENDS, ME_COLORS } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { Txt } from './Txt';

export function Avatar({ who, size = 36, ring = false, dot = false }: { who: string; size?: number; ring?: boolean; dot?: boolean }) {
  const { t, colors } = useApp();
  const label = who === 'me' ? t('you') : who;
  const grad = FRIENDS.find(f => f.name === who)?.colors ?? ME_COLORS;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
          borderWidth: ring ? 2 : 1.5, borderColor: ring ? '#34d399' : colors.bg,
        }}
      >
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt className="font-bold text-white" style={{ fontSize: size * 0.4 }}>{label[0]}</Txt>
        </LinearGradient>
      </View>
      {dot && (
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34d399', borderWidth: 2, borderColor: colors.bg }} />
      )}
    </View>
  );
}
