import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

const TAB_ROUTES = ['/', '/match', '/feed', '/profile'] as const;

/** Desktop keyboard shortcuts: 1-4 switch tabs, N adds an item, "," opens the profile. */
export function useWebShortcuts(onAdd: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[aria-modal="true"]')) return;
      if (e.key === 'n') onAdd();
      else if (e.key === ',') router.navigate('/profile');
      else if (['1', '2', '3', '4'].includes(e.key)) router.navigate(TAB_ROUTES[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onAdd]);
}
