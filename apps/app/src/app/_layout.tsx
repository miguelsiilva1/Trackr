import '../../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders, useApp } from '@/providers/AppProviders';
import { Toast } from '@/components/Toast';
import { MatchCelebration } from '@/features/match/MatchCelebration';
import { useAutoSync } from '@/hooks/useAutoSync';

function RootStack() {
  const { theme } = useApp();
  useAutoSync();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'transparentModal', animation: 'none' }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'transparentModal', animation: 'none' }} />
      </Stack>
      <MatchCelebration />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <RootStack />
      </AppProviders>
    </SafeAreaProvider>
  );
}
