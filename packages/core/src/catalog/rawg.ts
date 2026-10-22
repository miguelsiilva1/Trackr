import type { TrackrItem } from '../domain/types';
import { MEDIA_META } from '../domain/media';
import { fetchJson } from './http';

const RAWG_PLATFORMS: Record<string, string> = {
  pc: 'PC', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo',
  mac: 'macOS', linux: 'Linux', ios: 'iOS', android: 'Android',
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export const rawgAdapter = {
  map(g: any): TrackrItem {
    const platforms: string[] = Array.from(new Set<string>(
      (g.parent_platforms ?? []).map((p: any) => RAWG_PLATFORMS[p.platform?.slug] ?? p.platform?.name).filter(Boolean),
    ));
    return {
      id: `rawg-${g.id}`,
      externalId: g.id,
      apiSource: 'rawg',
      title: g.name ?? '—',
      type: 'game',
      year: g.released ? String(g.released).slice(0, 4) : 'TBA',
      coverUrl: g.background_image ?? '',
      backdropUrl: g.background_image ?? undefined,
      genres: (g.genres ?? []).map((x: any) => x.name).slice(0, 3),
      rating: round1(g.rating ?? 0),
      myStatus: 'backlog',
      metaDuration: g.playtime ? `~${g.playtime}h` : 'Duração n/d',
      platforms,
      summary: '',
      likedByFriends: [],
      progressTotal: g.playtime || MEDIA_META.game.defaultTotal,
    };
  },

  async search(query: string, key: string): Promise<TrackrItem[]> {
    const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}&page_size=12`;
    const data = await fetchJson(url);
    return (data.results ?? []).map(rawgAdapter.map);
  },
};
