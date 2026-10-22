import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ME_COLORS, avatarColors } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { Txt } from './Txt';

/** Round avatar: the user's photo for 'me', otherwise a name-based gradient with the initial. */
export function Avatar({ who, size = 36, ring = false, dot = false }: { who: string; size?: number; ring?: boolean; dot?: boolean }) {
  const { t, colors } = useApp();
  const me = useTrackr(s => s.me);
  const isMe = who === 'me';
  const label = isMe ? me.name || t('you') : who;
  const photo = isMe ? me.photo : undefined;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
          borderWidth: ring ? 2 : 1.5, borderColor: ring ? colors.accent : colors.bg,
        }}
      >
        {photo ? (
          <Image source={photo} contentFit="cover" style={{ flex: 1 }} accessibilityLabel={label} />
        ) : (
          <LinearGradient
            colors={isMe ? ME_COLORS : avatarColors(who)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt className="font-bold text-white" style={{ fontSize: size * 0.4 }}>{label[0]?.toUpperCase()}</Txt>
          </LinearGradient>
        )}
      </View>
      {dot && (
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34d399', borderWidth: 2, borderColor: colors.bg }} />
      )}
    </View>
  );
}
