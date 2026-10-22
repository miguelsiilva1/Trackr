import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProviders';
import { Txt } from '@/components/Txt';
import { NAV } from './nav';

type NavEntry = (typeof NAV)[number];

function TabButton({ entry, isFocused, ref: _ref, ...props }: TabTriggerSlotProps & { entry: NavEntry }) {
  const { t, colors } = useApp();
  const Icon = entry.icon;
  return (
    <Pressable {...props} className="flex-1 h-16 items-center justify-center gap-1 active:scale-90">
      <Icon size={22} color={isFocused ? colors.media.game : colors.subtle} />
      <Txt className={`text-xs font-medium ${isFocused ? 'text-fg' : 'text-subtle'}`}>{t(entry.short)}</Txt>
    </Pressable>
  );
}

/** Thumb-reachable bottom tab bar with a centered "+" action. */
export function BottomBar({ onAdd }: { onAdd: () => void }) {
  const { t, colors } = useApp();
  const insets = useSafeAreaInsets();
  const tab = (n: NavEntry) => (
    <TabTrigger key={n.name} name={n.name} asChild>
      <TabButton entry={n} />
    </TabTrigger>
  );
  return (
    <View className="absolute left-0 right-0 bottom-0 border-t border-line bg-app" style={{ paddingBottom: insets.bottom }}>
      <View className="flex-row items-center">
        {NAV.slice(0, 2).map(tab)}
        <View className="flex-1 items-center">
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onAdd(); }}
            accessibilityLabel={t('track_item')}
            className="w-14 h-14 -mt-7 rounded-2xl bg-inv items-center justify-center active:scale-90"
            style={{ borderWidth: 4, borderColor: colors.bg }}
          >
            <Plus size={26} strokeWidth={2.5} color={colors.invFg} />
          </Pressable>
        </View>
        {NAV.slice(2).map(tab)}
      </View>
    </View>
  );
}
