import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProviders';

export function StarRating({ value = 0, onChange, size = 14 }: { value?: number; onChange?: (v: number) => void; size?: number }) {
  const { colors } = useApp();
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map(n => {
        const on = n <= value;
        return (
          <Pressable
            key={n} disabled={!onChange} accessibilityLabel={`${n}/5`} hitSlop={4}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange?.(n === value ? 0 : n); }}
            className="p-0.5 active:scale-90"
          >
            <Star size={size} color={on ? '#facc15' : colors.subtle} fill={on ? '#facc15' : 'transparent'} />
          </Pressable>
        );
      })}
    </View>
  );
}
