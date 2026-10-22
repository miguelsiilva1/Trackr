import type { FeedEntry, Friend, Reaction } from '../domain/types';
import type { RemoteEntry } from '../sync/types';
import type { ProviderId } from '../domain/types';
import { MOCK_LIBRARY } from './library';

const HOUR = 36e5;
const DAY = 24 * HOUR;

export const FRIENDS: Friend[] = [
  { name: 'Diogo', colors: ['#38bdf8', '#2563eb'], now: 'Elden Ring' },
  { name: 'Sara', colors: ['#f472b6', '#e11d48'], now: 'Severance' },
  { name: 'Marta', colors: ['#fdba74', '#d97706'], now: 'Hades' },
];

export const ME_COLORS: [string, string] = ['#6ee7b7', '#0d9488'];

export const zeroReactions = (): Record<Reaction, number> => ({ '🔥': 0, '👏': 0, '🤯': 0 });

const byTitle = (title: string) => MOCK_LIBRARY.find(i => i.title === title)!;

export const seedFeed = (now = Date.now()): FeedEntry[] => [
  { id: 'f1', who: 'Diogo', verb: 'completed', extra: '95h', item: byTitle('Elden Ring'), rating: 5, ts: now - 2 * HOUR, reactions: { '🔥': 12, '👏': 5, '🤯': 2 }, mine: [] },
  { id: 'f2', who: 'Sara', verb: 'added', item: byTitle('Severance'), ts: now - 4 * HOUR, reactions: { '🔥': 3, '👏': 1, '🤯': 6 }, mine: [] },
  { id: 'f3', who: 'Marta', verb: 'playing', item: byTitle('Hades'), ts: now - 6 * HOUR, reactions: { '🔥': 4, '👏': 2, '🤯': 0 }, mine: [] },
  { id: 'f4', who: 'Sara', verb: 'completed', item: byTitle('Succession'), rating: 4, ts: now - 1.2 * DAY, reactions: { '🔥': 7, '👏': 9, '🤯': 1 }, mine: [] },
  { id: 'f5', who: 'Marta', verb: 'super', item: byTitle("Baldur's Gate 3"), ts: now - 1.5 * DAY, reactions: { '🔥': 5, '👏': 3, '🤯': 0 }, mine: [] },
  { id: 'f6', who: 'Diogo', verb: 'rated', item: byTitle('Dune: Part Two'), rating: 5, ts: now - 2.4 * DAY, reactions: { '🔥': 15, '👏': 4, '🤯': 3 }, mine: [] },
];

const AVATAR_GRADIENTS: [string, string][] = [
  ['#a78bfa', '#6d28d9'], ['#fda4af', '#be123c'], ['#fcd34d', '#b45309'], ['#67e8f9', '#0e7490'],
  ['#86efac', '#15803d'], ['#f0abfc', '#a21caf'], ['#93c5fd', '#1d4ed8'],
];

/** Gradient for any user: tribe members keep theirs, everyone else gets a stable one from their name. */
export const avatarColors = (name: string): [string, string] => {
  const friend = FRIENDS.find(f => f.name === name);
  if (friend) return friend.colors;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

/** Activity from TRACKR users outside the tribe, for the Global feed. */
export const seedGlobalFeed = (now = Date.now()): FeedEntry[] => [
  { id: 'g1', who: 'Rita', verb: 'completed', item: byTitle('Shōgun'), rating: 5, ts: now - 0.5 * HOUR, reactions: { '🔥': 41, '👏': 18, '🤯': 7 }, mine: [] },
  { id: 'g2', who: 'Tiago', verb: 'playing', item: byTitle("Baldur's Gate 3"), ts: now - 1.5 * HOUR, reactions: { '🔥': 22, '👏': 6, '🤯': 3 }, mine: [] },
  { id: 'g3', who: 'Inês', verb: 'rated', item: byTitle('Your Name.'), rating: 5, ts: now - 3 * HOUR, reactions: { '🔥': 15, '👏': 30, '🤯': 9 }, mine: [] },
  { id: 'g4', who: 'João', verb: 'added', item: byTitle('The Bear'), ts: now - 5 * HOUR, reactions: { '🔥': 8, '👏': 2, '🤯': 0 }, mine: [] },
  { id: 'g5', who: 'Beatriz', verb: 'completed', item: byTitle('It Takes Two'), rating: 4, ts: now - 9 * HOUR, reactions: { '🔥': 12, '👏': 14, '🤯': 1 }, mine: [] },
  { id: 'g6', who: 'Rui', verb: 'super', item: byTitle('Breaking Bad'), ts: now - 20 * HOUR, reactions: { '🔥': 33, '👏': 11, '🤯': 19 }, mine: [] },
];

/** Simulated libraries living in each external service. */
export const seedRemote = (now = Date.now()): Record<ProviderId, RemoteEntry[]> => ({
  letterboxd: [
    { title: 'Dune: Part Two', year: 2024, type: 'movie', status: 'completed', rating: 5, updatedAt: now - 40 * DAY },
    { title: 'Interstellar', year: 2014, type: 'movie', status: 'completed', rating: 5, updatedAt: now - 300 * DAY },
    { title: 'Oppenheimer', year: 2023, type: 'movie', status: 'completed', rating: 4, updatedAt: now - 3 * DAY },
    { title: 'Past Lives', year: 2023, type: 'movie', status: 'completed', rating: 5, updatedAt: now - 12 * DAY },
    { title: 'Aftersun', year: 2022, type: 'movie', status: 'backlog', updatedAt: now - 5 * DAY },
    { title: 'Perfect Days', year: 2023, type: 'movie', status: 'backlog', updatedAt: now - 8 * DAY },
  ],
  serializd: [
    { title: 'Succession', year: 2018, type: 'series', status: 'completed', rating: 4, updatedAt: now - 90 * DAY },
    { title: 'Shōgun', year: 2024, type: 'series', status: 'completed', rating: 5, updatedAt: now - 2 * DAY },
    { title: 'Fleabag', year: 2016, type: 'series', status: 'completed', rating: 5, updatedAt: now - 10 * DAY },
    { title: 'Twin Peaks', year: 1990, type: 'series', status: 'backlog', updatedAt: now - 20 * DAY },
  ],
  logg: [
    { title: 'Elden Ring', year: 2022, type: 'game', status: 'in_progress', rating: 5, updatedAt: now - 30 * DAY },
    { title: 'Portal 2', year: 2011, type: 'game', status: 'completed', rating: 5, updatedAt: now - 400 * DAY },
    { title: 'Hollow Knight', year: 2017, type: 'game', status: 'completed', rating: 5, updatedAt: now - 15 * DAY },
    { title: 'Celeste', year: 2018, type: 'game', status: 'backlog', updatedAt: now - 6 * DAY },
  ],
});

/** Entries the "simulate remote activity" button can add, one per service. */
export const REMOTE_EXTRAS: Record<ProviderId, Omit<RemoteEntry, 'updatedAt'>> = {
  letterboxd: { title: 'Anatomy of a Fall', year: 2023, type: 'movie', status: 'completed', rating: 4 },
  serializd: { title: 'Slow Horses', year: 2022, type: 'series', status: 'in_progress' },
  logg: { title: 'Outer Wilds', year: 2019, type: 'game', status: 'backlog' },
};
