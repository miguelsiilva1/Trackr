import React, { createContext, useContext, useMemo } from 'react';
import { View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { getLocales } from 'expo-localization';
import { makeT, resolveLang, type Lang, type TFn } from '@trackr/core';
import { useTrackr } from '@/store/useTrackr';
import { colorsFor, cssVars, type ThemeColors, type ThemeName } from '@/theme/tokens';

interface AppContext {
  t: TFn;
  lang: Lang;
  theme: ThemeName;
  colors: ThemeColors;
}

const Ctx = createContext<AppContext | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProviders>');
  return ctx;
}

/** Resolves language + theme preferences and exposes them, with the theme's CSS variables applied to the tree. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const prefs = useTrackr(s => s.prefs);
  const scheme = useColorScheme();
  const lang = resolveLang(prefs.lang, getLocales()[0]?.languageTag);
  const theme: ThemeName = prefs.theme === 'system' ? (scheme === 'light' ? 'light' : 'dark') : prefs.theme;

  const value = useMemo(() => ({ t: makeT(lang), lang, theme, colors: colorsFor(theme) }), [lang, theme]);
  const themeVars = useMemo(() => vars(cssVars(theme)), [theme]);

  return (
    <Ctx.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars]} className="bg-app">
        {children}
      </View>
    </Ctx.Provider>
  );
}
