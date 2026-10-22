import { View } from 'react-native';
import { Crosshair } from 'lucide-react-native';
import { useApp } from '@/providers/AppProviders';
import { Txt } from './Txt';

export function Logo({ compact = false }: { compact?: boolean }) {
  const { colors } = useApp();
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-9 h-9 rounded-xl bg-surface border border-strong items-center justify-center">
        <Crosshair size={20} color={colors.fg} strokeWidth={1.75} />
        <View className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </View>
      {!compact && (
        <Txt className="text-lg font-black tracking-widest">
          TRACK<Txt className="text-game">R</Txt>
        </Txt>
      )}
    </View>
  );
}
