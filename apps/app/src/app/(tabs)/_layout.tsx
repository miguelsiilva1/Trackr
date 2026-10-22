import { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useWebShortcuts } from '@/hooks/useWebShortcuts';
import { TopBar } from '@/features/shell/TopBar';
import { BottomBar } from '@/features/shell/BottomBar';
import { NAV } from '@/features/shell/nav';

/** Headless tabs: the same routes render a top bar on wide screens and a bottom tab bar on phones. */
export default function TabsLayout() {
  const { wide } = useBreakpoint();
  const openAdd = useCallback(() => router.push('/add'), []);
  useWebShortcuts(openAdd);

  return (
    <Tabs style={{ flex: 1 }}>
      {wide && <TopBar onAdd={openAdd} />}
      <View style={{ flex: 1 }}>
        {/* flex: 1 keeps each screen bounded to the viewport so its ScrollView scrolls (not the document) */}
        <TabSlot style={{ flex: 1 }} />
      </View>
      {!wide && <BottomBar onAdd={openAdd} />}
      <TabList style={{ display: 'none' }}>
        {NAV.map(n => <TabTrigger key={n.name} name={n.name} href={n.href} />)}
      </TabList>
    </Tabs>
  );
}
