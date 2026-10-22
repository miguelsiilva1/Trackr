import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Kicker, Txt } from './Txt';

/** Scrollable page with a centered max width, safe-area aware and clear of the mobile tab bar. */
export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { wide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const inner = (
    <View className={`w-full self-center ${wide ? 'px-8 py-10' : 'px-4 py-5'}`} style={{ maxWidth: 1280, paddingBottom: wide ? 40 : 120 }}>
      {children}
    </View>
  );
  return scroll
    ? <ScrollView className="flex-1 bg-app" contentContainerStyle={{ paddingTop: wide ? 0 : insets.top }} keyboardShouldPersistTaps="handled">{inner}</ScrollView>
    : <View className="flex-1 bg-app" style={{ paddingTop: wide ? 0 : insets.top }}>{inner}</View>;
}

export function PageHeader({ kicker, title, right }: { kicker: string; title: React.ReactNode; right?: React.ReactNode }) {
  const { wide } = useBreakpoint();
  return (
    <View className={`gap-4 mb-6 ${wide ? 'flex-row items-end justify-between' : ''}`}>
      <View>
        <Kicker>{kicker}</Kicker>
        {typeof title === 'string' ? <Txt className={`${wide ? 'text-4xl' : 'text-2xl'} font-black tracking-tight`}>{title}</Txt> : title}
      </View>
      {right}
    </View>
  );
}
