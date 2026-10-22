import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Plus } from 'lucide-react-native';
import { useApp } from '@/providers/AppProviders';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';
import { Txt } from '@/components/Txt';
import { NAV } from './nav';

type NavEntry = (typeof NAV)[number];

function NavButton({ entry, isFocused, ref: _ref, ...props }: TabTriggerSlotProps & { entry: NavEntry }) {
  const { t, colors } = useApp();
  const Icon = entry.icon;
  return (
    <Pressable {...props} className={`h-9 px-4 rounded-full flex-row items-center gap-2 ${isFocused ? 'bg-surface2' : ''}`}>
      <Icon size={16} color={isFocused ? colors.accent : colors.muted} />
      <Txt className={`text-sm font-semibold ${isFocused ? 'text-fg' : 'text-muted'}`}>{t(entry.label)}</Txt>
    </Pressable>
  );
}

/** Desktop navigation: logo, centered sections, quick add and the user's avatar. */
export function TopBar({ onAdd }: { onAdd: () => void }) {
  const { t, colors } = useApp();
  return (
    <View className="h-16 px-6 flex-row items-center border-b border-line bg-app">
      <View className="flex-1"><Logo /></View>
      <View className="flex-row items-center gap-1 p-1 rounded-full bg-surface border border-line">
        {NAV.map(n => (
          <TabTrigger key={n.name} name={n.name} asChild>
            <NavButton entry={n} />
          </TabTrigger>
        ))}
      </View>
      <View className="flex-1 flex-row items-center justify-end gap-3">
        <Pressable onPress={onAdd} className="h-9 px-4 rounded-full bg-accent flex-row items-center gap-1.5 active:scale-95">
          <Plus size={16} color={colors.accentFg} />
          <Txt className="text-sm font-semibold text-accent-fg">{t('track_item')}</Txt>
        </Pressable>
        <Pressable onPress={() => router.navigate('/profile')} accessibilityLabel={t('nav_profile')}>
          <Avatar who="me" size={34} />
        </Pressable>
      </View>
    </View>
  );
}
