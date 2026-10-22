import type { MediaType } from '@trackr/core';

export type ThemeName = 'dark' | 'light';

/** RGB triplets, consumed as CSS variables by tailwind.config.js. */
const PALETTES: Record<ThemeName, Record<string, string>> = {
  dark: {
    bg: '9 9 11', surface: '24 24 27', surface2: '39 39 42', sunken: '9 9 11', line: '39 39 42', 'line-strong': '63 63 70',
    fg: '250 250 250', muted: '161 161 170', subtle: '113 113 122', 'inv-bg': '244 244 245', 'inv-fg': '9 9 11',
    movie: '251 191 36', series: '167 139 250', game: '52 211 153',
  },
  light: {
    bg: '245 245 244', surface: '255 255 255', surface2: '236 236 234', sunken: '250 250 249', line: '228 228 231', 'line-strong': '212 212 216',
    fg: '24 24 27', muted: '82 82 91', subtle: '113 113 122', 'inv-bg': '24 24 27', 'inv-fg': '250 250 250',
    movie: '180 83 9', series: '109 40 217', game: '4 120 87',
  },
};

const toHex = (triplet: string) =>
  `#${triplet.split(' ').map(n => Number(n).toString(16).padStart(2, '0')).join('')}`;

export const cssVars = (theme: ThemeName) =>
  Object.fromEntries(Object.entries(PALETTES[theme]).map(([k, v]) => [`--${k}`, v]));

/** Hex values for places that need a raw color (icons, gradients, status bar). */
export const colorsFor = (theme: ThemeName) => {
  const p = PALETTES[theme];
  return {
    bg: toHex(p.bg), surface: toHex(p.surface), surface2: toHex(p.surface2), fg: toHex(p.fg),
    muted: toHex(p.muted), subtle: toHex(p.subtle), invFg: toHex(p['inv-fg']), line: toHex(p.line),
    media: { movie: toHex(p.movie), series: toHex(p.series), game: toHex(p.game) } as Record<MediaType, string>,
  };
};

export type ThemeColors = ReturnType<typeof colorsFor>;

/** Per-media class names (Tailwind needs full static strings). */
export const MEDIA_CLASSES: Record<MediaType, { text: string; soft: string; border: string; solid: string; fallback: [string, string] }> = {
  movie: { text: 'text-movie', soft: 'bg-amber-500/15', border: 'border-amber-500/40', solid: 'bg-amber-500', fallback: ['#d97706', '#18181b'] },
  series: { text: 'text-series', soft: 'bg-violet-500/15', border: 'border-violet-500/40', solid: 'bg-violet-500', fallback: ['#7c3aed', '#18181b'] },
  game: { text: 'text-game', soft: 'bg-emerald-500/15', border: 'border-emerald-500/40', solid: 'bg-emerald-500', fallback: ['#059669', '#18181b'] },
};

/** Bright accents for text on top of posters (always dark backgrounds). */
export const ON_IMAGE: Record<MediaType, string> = { movie: '#fcd34d', series: '#c4b5fd', game: '#6ee7b7' };
