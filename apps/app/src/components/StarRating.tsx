import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProviders';

const GOLD = '#facc15';

/** Five stars in half-star steps. With `onChange`, each star's left half sets n − 0.5 and its right half n; tapping the current value clears it. */
export function StarRating({ value = 0, onChange, size = 14 }: { value?: number; onChange?: (v: number) => void; size?: number }) {
  const { colors } = useApp();
  const pick = (v: number) => { Haptics.selectionAsync().catch(() => {}); onChange?.(v === value ? 0 : v); };
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map(n => {
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        return (
          <View key={n} className="p-0.5">
            <Star size={size} color={fill ? GOLD : colors.subtle} fill="transparent" />
            {fill > 0 && (
              <View className="absolute top-0.5 left-0.5 overflow-hidden" style={{ width: size * fill, height: size }}>
                <Star size={size} color={GOLD} fill={GOLD} />
              </View>
            )}
            {onChange && (
              <View className="absolute inset-0 flex-row">
                <Pressable onPress={() => pick(n - 0.5)} accessibilityLabel={`${n - 0.5}/5`} className="flex-1" />
                <Pressable onPress={() => pick(n)} accessibilityLabel={`${n}/5`} className="flex-1" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
