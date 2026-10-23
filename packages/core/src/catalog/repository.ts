import type { CatalogAccess, Lang, TrackrItem } from '../domain/types';
import { normalize } from '../domain/media';
import { canReach, errMsg } from './http';
import { tmdbAdapter } from './tmdb';
import { rawgAdapter } from './rawg';

export interface SearchOutcome {
  items: TrackrItem[];
  source: 'remote' | 'mock';
  warnings: string[];
}

export const MediaRepository = {
  searchLocal(query: string, pool: TrackrItem[]): TrackrItem[] {
    const q = normalize(query);
    return pool.filter(i => normalize(i.title).includes(q) || i.genres.some(g => normalize(g).includes(q)));
  },

  /** Never rejects: network, CORS or key failures fall back to the local pool. */
  async search(query: string, access: CatalogAccess, pool: TrackrItem[], lang: Lang): Promise<SearchOutcome> {
    const warnings: string[] = [];
    const tasks: Promise<TrackrItem[]>[] = [];
    if (canReach('tmdb', access)) tasks.push(tmdbAdapter.search(query, access, lang).catch(e => { warnings.push(`TMDB: ${errMsg(e)}`); return []; }));
    if (canReach('rawg', access)) tasks.push(rawgAdapter.search(query, access).catch(e => { warnings.push(`RAWG: ${errMsg(e)}`); return []; }));
    const local = MediaRepository.searchLocal(query, pool);
    if (!tasks.length) return { items: local, source: 'mock', warnings };
    const remote = (await Promise.all(tasks)).flat();
    return remote.length ? { items: remote, source: 'remote', warnings } : { items: local, source: 'mock', warnings };
  },
};
