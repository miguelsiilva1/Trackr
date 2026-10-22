import { pt, type StrKey } from './pt';
import { en } from './en';
import type { Lang, LangPref, TrackrItem } from '../domain/types';
import { SUMMARY_EN } from './summaries';

export type { StrKey } from './pt';
export type TFn = (k: StrKey, vars?: Record<string, string | number>) => string;

export const makeT = (lang: Lang): TFn => (k, vars) => {
  let s = (lang === 'en' ? en : pt)[k];
  if (vars) for (const [name, v] of Object.entries(vars)) s = s.split(`{${name}}`).join(String(v));
  return s;
};

/** Resolves the 'system' preference from a BCP-47 locale such as "pt-PT" or "en-US". */
export const resolveLang = (pref: LangPref, deviceLocale?: string): Lang =>
  pref !== 'system' ? pref : deviceLocale?.toLowerCase().startsWith('pt') ? 'pt' : 'en';

const GENRE_EN: Record<string, string> = {
  'Ficção Científica': 'Sci-Fi', Aventura: 'Adventure', História: 'History', Animação: 'Animation', Ação: 'Action',
  Comédia: 'Comedy', Mistério: 'Mystery', Estratégia: 'Strategy', Plataformas: 'Platformer', 'Mundo Aberto': 'Open World',
  Documentário: 'Documentary', Família: 'Family', Fantasia: 'Fantasy', Terror: 'Horror', Música: 'Music', Guerra: 'War',
  'Ação & Aventura': 'Action & Adventure', Infantil: 'Kids', Notícias: 'News', 'Sci-Fi & Fantasia': 'Sci-Fi & Fantasy',
  Novela: 'Soap', 'Guerra & Política': 'War & Politics',
};

export const tGenre = (g: string, lang: Lang) => (lang === 'en' ? GENRE_EN[g] ?? g : g);

export const tDuration = (d: string, lang: Lang) => lang === 'pt' ? d : d
  .replace('temporadas', 'seasons').replace('temporada', 'season').replace('Longa-metragem', 'Feature')
  .replace('Série', 'Series').replace('Duração n/d', 'Duration n/a');

export const summaryOf = (i: TrackrItem, lang: Lang, t: TFn) =>
  (lang === 'en' ? SUMMARY_EN[i.title] : undefined) ?? (i.summary || (i.apiSource === 'rawg' ? t('rawg_summary') : t('no_summary')));

export const formatAgo = (ts: number, lang: Lang, now = Date.now()) => {
  const rtf = new Intl.RelativeTimeFormat(lang === 'pt' ? 'pt-PT' : 'en', { numeric: 'auto' });
  const s = Math.round((ts - now) / 1000);
  if (Math.abs(s) < 60) return rtf.format(0, 'second');
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, 'minute');
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, 'hour');
  return rtf.format(Math.round(h / 24), 'day');
};

export { pt, en };
