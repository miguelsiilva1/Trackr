import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { Txt } from '@/components/Txt';

export function ApiChip({ full = true }: { full?: boolean }) {
  const { t, colors } = useApp();
  const live = useTrackr(s => !!(s.keys.tmdb || s.keys.rawg));
  return (
    <Pressable
      onPress={() => router.navigate('/profile')} accessibilityLabel={t('api_title')}
      className={`flex-row items-center gap-1.5 rounded-full border ${full ? 'px-3 py-1.5' : 'p-2'} ${live ? 'border-emerald-500/40 bg-emerald-500/15' : 'border-strong bg-surface'}`}
    >
      {live ? <Wifi size={14} color={colors.media.game} /> : <WifiOff size={14} color={colors.muted} />}
      {full && <Txt className={`text-xs font-medium ${live ? 'text-game' : 'text-muted'}`}>{live ? t('api_live') : t('api_mock')}</Txt>}
    </Pressable>
  );
}
