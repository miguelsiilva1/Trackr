import type { MediaStatus, MediaType, TrackrItem } from './types';
import type { TFn } from '../i18n';

export const MEDIA_TYPES: MediaType[] = ['movie', 'series', 'game'];
export const MEDIA_STATUSES: MediaStatus[] = ['backlog', 'in_progress', 'completed', 'dropped'];

export const MEDIA_META: Record<MediaType, { hex: string; progressUnit: string; defaultTotal: number }> = {
  movie: { hex: '#f59e0b', progressUnit: 'min', defaultTotal: 120 },
  series: { hex: '#06b6d4', progressUnit: 'ep', defaultTotal: 10 },
  game: { hex: '#10b981', progressUnit: 'h', defaultTotal: 50 },
};

export const STATUS_HEX: Record<MediaStatus, string> = {
  backlog: '#a1a1aa',
  in_progress: '#38bdf8',
  completed: '#34d399',
  dropped: '#fb7185',
};

export const statusLabel = (s: MediaStatus, type: MediaType | 'all', t: TFn): string => {
  if (s === 'in_progress') return type === 'game' ? t('st_progress_play') : type === 'all' ? t('st_progress') : t('st_progress_watch');
  if (s === 'backlog') return type === 'game' ? t('st_backlog_play') : type === 'all' ? t('st_backlog') : t('st_backlog_watch');
  return s === 'completed' ? t('st_completed') : t('st_dropped');
};

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export const coverOf = (i: Pick<TrackrItem, 'coverUrl' | 'customCover'>) => i.customCover || i.coverUrl;
export const backdropOf = (i: Pick<TrackrItem, 'coverUrl' | 'backdropUrl' | 'customCover' | 'customBackdrop'>) =>
  i.customBackdrop || i.backdropUrl;

/** Identity used to match the same title across Trackr and external services. */
export const libKey = (i: { type: MediaType; title: string }) => `${i.type}:${normalize(i.title)}`;

/** Where the user can start consuming an item ("Steam", "Netflix", …). */
export const startWhere = (i: TrackrItem) =>
  i.type === 'game' ? (i.platforms.includes('PC') ? 'Steam' : i.platforms[0] ?? '—') : i.platforms[0] ?? 'streaming';

/** Ratings go in half-star steps, 0.5 to 5. */
export const toHalfStar = (n: number) => Math.min(5, Math.max(0.5, Math.round(n * 2) / 2));
