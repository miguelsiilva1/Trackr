import type { MediaType } from '@trackr/core';

export type ThemeName = 'dark' | 'light';

/** RGB triplets, consumed as CSS variables by tailwind.config.js. */
const PALETTES: Record<ThemeName, Record<string, string>> = {
  // Cinematic blue-black with a violet brand accent.
  dark: {
    bg: '12 12 20', surface: '21 21 33', surface2: '31 31 48', sunken: '9 9 15', line: '36 36 56', 'line-strong': '58 58 86',
    fg: '242 242 250', muted: '163 163 190', subtle: '112 112 142', 'inv-bg': '242 242 250', 'inv-fg': '12 12 20',
    accent: '139 108 255', 'accent-fg': '255 255 255',
    movie: '251 191 36', series: '34 211 238', game: '52 211 153',
  },
  // Cool paper white, same hues darkened for contrast.
  light: {
    bg: '245 245 250', surface: '255 255 255', surface2: '236 236 245', sunken: '250 250 253', line: '225 225 236', 'line-strong': '204 204 220',
    fg: '18 18 30', muted: '82 82 106', subtle: '120 120 145', 'inv-bg': '18 18 30', 'inv-fg': '250 250 253',
    accent: '109 76 240', 'accent-fg': '255 255 255',
    movie: '180 83 9', series: '14 116 144', game: '4 120 87',
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
    muted: toHex(p.muted), subtle: toHex(p.subtle), line: toHex(p.line),
    accent: toHex(p.accent), accentFg: toHex(p['accent-fg']),
    media: { movie: toHex(p.movie), series: toHex(p.series), game: toHex(p.game) } as Record<MediaType, string>,
  };
};

export type ThemeColors = ReturnType<typeof colorsFor>;

/** Per-media class names (Tailwind needs full static strings). */
export const MEDIA_CLASSES: Record<MediaType, { text: string; soft: string; border: string; solid: string; fallback: [string, string] }> = {
  movie: { text: 'text-movie', soft: 'bg-amber-500/15', border: 'border-amber-500/40', solid: 'bg-amber-500', fallback: ['#d97706', '#18181b'] },
  series: { text: 'text-series', soft: 'bg-cyan-500/15', border: 'border-cyan-500/40', solid: 'bg-cyan-500', fallback: ['#0891b2', '#18181b'] },
  game: { text: 'text-game', soft: 'bg-emerald-500/15', border: 'border-emerald-500/40', solid: 'bg-emerald-500', fallback: ['#059669', '#18181b'] },
};

/** Bright accents for text on top of posters (always dark backgrounds). */
export const ON_IMAGE: Record<MediaType, string> = { movie: '#fcd34d', series: '#67e8f9', game: '#6ee7b7' };
