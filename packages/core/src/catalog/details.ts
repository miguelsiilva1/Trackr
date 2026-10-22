import type { ApiKeys, Lang, TrackrItem } from '../domain/types';
import { normalize } from '../domain/media';
import { errMsg, fetchJson } from './http';
import { TMDB_IMG } from './tmdb';
import { MOCK_ART, MOCK_STEAM_ACHIEVEMENTS } from '../mocks/artwork';

export interface Episode {
  number: number;
  /** Empty when the source has no title; the UI shows "Episode N". */
  title: string;
  airDate?: string;
  runtime?: number;
  /** Community rating, 0–5. */
  rating: number;
  still?: string;
}

export interface Season {
  number: number;
  name: string;
  year?: string;
  episodes: Episode[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Share of players who unlocked it, 0–100. */
  percent: number;
  image?: string;
}

export interface Artwork {
  posters: string[];
  backdrops: string[];
}

export interface ItemDetails {
  seasons?: Season[];
  achievements?: Achievement[];
  artwork: Artwork;
  source: 'remote' | 'mock';
  warnings: string[];
}

export const episodeKey = (season: number, episode: number) => `${season}:${episode}`;

// Deterministic pseudo-random numbers, so mock data is stable across renders and devices.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Seasons from the mock metaDuration ("2 temporadas · 19 ep"), episodes split evenly. */
export function mockSeasons(item: TrackrItem): Season[] {
  const [, s = '1', e = '8'] = item.metaDuration.match(/(\d+)\D+(\d+)/) ?? [];
  const seasons = Number(s);
  const total = Number(e);
  const rnd = seeded(item.title);
  const startYear = Number(item.year) || 2020;
  return Array.from({ length: seasons }, (_, si) => {
    const count = Math.floor(total / seasons) + (si < total % seasons ? 1 : 0);
    return {
      number: si + 1,
      name: '',
      year: String(startYear + si),
      episodes: Array.from({ length: count }, (_, ei) => ({
        number: ei + 1, title: '', runtime: 40 + Math.floor(rnd() * 25), rating: round2(3.6 + rnd() * 1.3),
      })),
    };
  });
}

const MOCK_ACHIEVEMENTS: Record<Lang, [string, string][]> = {
  pt: [
    ['Primeiros passos', 'Completa o tutorial.'], ['Explorador', 'Descobre 10 locais.'], ['Colecionador', 'Junta 50 itens.'],
    ['Imparável', 'Vence 100 inimigos.'], ['Sem um arranhão', 'Vence um chefe sem sofrer dano.'], ['Mestre artesão', 'Melhora uma arma ao máximo.'],
    ['Lobo solitário', 'Termina um capítulo sem ajuda.'], ['Speedrunner', 'Termina o jogo em menos de 10 horas.'],
    ['Perfeccionista', 'Completa todas as missões secundárias.'], ['Lenda', 'Termina o jogo na dificuldade máxima.'],
    ['Fim da jornada', 'Vê o final verdadeiro.'], ['Platina', 'Desbloqueia todas as conquistas.'],
  ],
  en: [
    ['First steps', 'Finish the tutorial.'], ['Explorer', 'Discover 10 locations.'], ['Collector', 'Gather 50 items.'],
    ['Unstoppable', 'Defeat 100 enemies.'], ['Not a scratch', 'Beat a boss without taking damage.'], ['Master crafter', 'Fully upgrade a weapon.'],
    ['Lone wolf', 'Finish a chapter without help.'], ['Speedrunner', 'Finish the game in under 10 hours.'],
    ['Perfectionist', 'Complete every side quest.'], ['Legend', 'Finish the game on the highest difficulty.'],
    ['Journey’s end', 'See the true ending.'], ['Platinum', 'Unlock every achievement.'],
  ],
};

export function mockAchievements(item: TrackrItem, lang: Lang): Achievement[] {
  const steam = MOCK_STEAM_ACHIEVEMENTS[item.title];
  if (steam) {
    return steam.list.map(([name, description, percent, icon], i) => ({
      id: `steam-${i}`, name, description, percent,
      image: `https://shared.fastly.steamstatic.com/community_assets/images/apps/${steam.appid}/${icon}.jpg`,
    }));
  }
  const rnd = seeded(item.title);
  let percent = 92;
  return MOCK_ACHIEVEMENTS[lang].map(([name, description], i) => {
    percent = Math.max(0.8, round2(percent * (0.55 + rnd() * 0.35)));
    return { id: `mock-${i}`, name, description, percent };
  });
}

/** Community rating spread in half-star buckets (0.5…5), centred on the title's average. */
export function mockRatingHistogram(item: TrackrItem): { buckets: number[]; total: number } {
  const rnd = seeded(`${item.title}:ratings`);
  const mean = item.rating || 3.5;
  const total = 400 + Math.floor(rnd() * 9000);
  const weights = Array.from({ length: 10 }, (_, i) => {
    const d = ((i + 1) / 2 - mean) / 0.75;
    return Math.exp(-d * d / 2) * (0.85 + rnd() * 0.3);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return { buckets: weights.map(w => Math.round((w / sum) * total)), total };
}

// TVmaze needs no key and has episode stills and ratings, so series get real data without TMDB.
async function tvmazeDetails(item: TrackrItem): Promise<Pick<ItemDetails, 'seasons' | 'artwork'>> {
  const hits: any[] = await fetchJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(item.title)}`);
  const show = (hits.find(h => h.show.premiered?.startsWith(String(item.year))) ?? hits[0])?.show;
  if (!show) throw new Error('not found');
  const data = await fetchJson(`https://api.tvmaze.com/shows/${show.id}?embed[]=episodes&embed[]=images`);
  const seasons = new Map<number, Season>();
  for (const e of data._embedded?.episodes ?? []) {
    if (e.type !== 'regular' || e.number == null) continue;
    const s: Season = seasons.get(e.season) ?? { number: e.season, name: '', year: e.airdate?.slice(0, 4), episodes: [] };
    s.episodes.push({
      number: e.number, title: e.name ?? '', airDate: e.airdate || undefined, runtime: e.runtime ?? undefined,
      rating: round2((e.rating?.average ?? 0) / 2), still: e.image?.medium ?? undefined,
    });
    seasons.set(e.season, s);
  }
  const images: any[] = data._embedded?.images ?? [];
  const pick = (type: string) => images.filter(i => i.type === type).map(i => i.resolutions.original.url);
  return { seasons: [...seasons.values()], artwork: { posters: pick('poster'), backdrops: pick('background') } };
}

const tmdbLang = (lang: Lang) => (lang === 'pt' ? 'pt-PT' : 'en-US');

async function tmdbId(item: TrackrItem, key: string): Promise<number | undefined> {
  if (item.apiSource === 'tmdb' && item.externalId) return Number(item.externalId);
  const kind = item.type === 'series' ? 'tv' : 'movie';
  const yearParam = kind === 'tv' ? 'first_air_date_year' : 'year';
  const data = await fetchJson(
    `https://api.themoviedb.org/3/search/${kind}?query=${encodeURIComponent(item.title)}&${yearParam}=${item.year}&api_key=${encodeURIComponent(key)}`,
  );
  return data.results?.[0]?.id;
}

async function tmdbSeasons(id: number, key: string, lang: Lang): Promise<Season[]> {
  const q = `api_key=${encodeURIComponent(key)}&language=${tmdbLang(lang)}`;
  const show = await fetchJson(`https://api.themoviedb.org/3/tv/${id}?${q}`);
  const numbers: number[] = (show.seasons ?? []).map((s: any) => s.season_number).filter((n: number) => n > 0);
  return Promise.all(numbers.map(async n => {
    const s = await fetchJson(`https://api.themoviedb.org/3/tv/${id}/season/${n}?${q}`);
    return {
      number: n,
      name: s.name ?? '',
      year: s.air_date?.slice(0, 4),
      episodes: (s.episodes ?? []).map((e: any) => ({
        number: e.episode_number,
        title: e.name ?? '',
        airDate: e.air_date ?? undefined,
        runtime: e.runtime ?? undefined,
        rating: round2((e.vote_average ?? 0) / 2),
        still: e.still_path ? `${TMDB_IMG}/w300${e.still_path}` : undefined,
      })),
    };
  }));
}

async function tmdbArtwork(item: TrackrItem, id: number, key: string): Promise<Artwork> {
  const kind = item.type === 'series' ? 'tv' : 'movie';
  const data = await fetchJson(`https://api.themoviedb.org/3/${kind}/${id}/images?api_key=${encodeURIComponent(key)}`);
  return {
    posters: (data.posters ?? []).slice(0, 30).map((p: any) => `${TMDB_IMG}/w500${p.file_path}`),
    backdrops: (data.backdrops ?? []).slice(0, 30).map((p: any) => `${TMDB_IMG}/w1280${p.file_path}`),
  };
}

async function rawgId(item: TrackrItem, key: string): Promise<number | undefined> {
  if (item.apiSource === 'rawg' && item.externalId) return Number(item.externalId);
  const data = await fetchJson(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(item.title)}&search_precise=true&page_size=5&key=${encodeURIComponent(key)}`,
  );
  const results: any[] = data.results ?? [];
  return (results.find(g => normalize(g.name) === normalize(item.title)) ?? results[0])?.id;
}

const RAWG_ACHIEVEMENT_PAGES = 3;

async function rawgAchievements(id: number, key: string): Promise<Achievement[]> {
  const out: Achievement[] = [];
  for (let page = 1; page <= RAWG_ACHIEVEMENT_PAGES; page++) {
    const data = await fetchJson(`https://api.rawg.io/api/games/${id}/achievements?page=${page}&page_size=40&key=${encodeURIComponent(key)}`);
    out.push(...(data.results ?? []).map((a: any) => ({
      id: String(a.id), name: a.name ?? '', description: a.description ?? '', percent: Number(a.percent) || 0, image: a.image ?? undefined,
    })));
    if (!data.next) break;
  }
  return out.sort((a, b) => b.percent - a.percent);
}

async function rawgArtwork(id: number, key: string): Promise<Artwork> {
  const [game, shots] = await Promise.all([
    fetchJson(`https://api.rawg.io/api/games/${id}?key=${encodeURIComponent(key)}`),
    fetchJson(`https://api.rawg.io/api/games/${id}/screenshots?key=${encodeURIComponent(key)}`),
  ]);
  const images = [game.background_image, game.background_image_additional, ...(shots.results ?? []).map((s: any) => s.image)].filter(Boolean);
  return { posters: images, backdrops: images };
}

const mockDetails = (item: TrackrItem, lang: Lang, warnings: string[]): ItemDetails => ({
  seasons: item.type === 'series' ? mockSeasons(item) : undefined,
  achievements: item.type === 'game' ? mockAchievements(item, lang) : undefined,
  artwork: MOCK_ART[item.title] ?? { posters: [], backdrops: [] },
  source: 'mock',
  warnings,
});

/** Seasons, achievements and alternative artwork for one title. Never rejects: falls back to mock data. */
export async function fetchItemDetails(item: TrackrItem, keys: ApiKeys, lang: Lang): Promise<ItemDetails> {
  try {
    if (item.type === 'game') {
      if (!keys.rawg) return mockDetails(item, lang, []);
      const id = await rawgId(item, keys.rawg);
      if (!id) return mockDetails(item, lang, ['RAWG: not found']);
      const [achievements, artwork] = await Promise.all([rawgAchievements(id, keys.rawg), rawgArtwork(id, keys.rawg)]);
      return { achievements, artwork, source: 'remote', warnings: [] };
    }
    if (!keys.tmdb) {
      if (item.type !== 'series') return mockDetails(item, lang, []);
      return { ...(await tvmazeDetails(item)), source: 'remote', warnings: [] };
    }
    const id = await tmdbId(item, keys.tmdb);
    if (!id) return mockDetails(item, lang, ['TMDB: not found']);
    const [seasons, artwork] = await Promise.all([
      item.type === 'series' ? tmdbSeasons(id, keys.tmdb, lang) : Promise.resolve(undefined),
      tmdbArtwork(item, id, keys.tmdb),
    ]);
    return { seasons, artwork, source: 'remote', warnings: [] };
  } catch (e) {
    const src = item.type === 'game' ? 'RAWG' : keys.tmdb ? 'TMDB' : 'TVmaze';
    return mockDetails(item, lang, [`${src}: ${errMsg(e)}`]);
  }
}
