import type { CatalogAccess, Lang, TrackrItem } from '../domain/types';
import { MEDIA_META } from '../domain/media';
import { catalogGet } from './http';

export const TMDB_IMG = 'https://image.tmdb.org/t/p';

const TMDB_GENRES: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime', 99: 'Documentário', 18: 'Drama',
  10751: 'Família', 14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção Científica', 53: 'Thriller', 10752: 'Guerra', 37: 'Western',
  10759: 'Ação & Aventura', 10762: 'Infantil', 10763: 'Notícias', 10764: 'Reality', 10765: 'Sci-Fi & Fantasia',
  10766: 'Novela', 10767: 'Talk Show', 10768: 'Guerra & Política',
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export const tmdbAdapter = {
  map(r: any): TrackrItem {
    const isTv = r.media_type === 'tv';
    const date: string | undefined = isTv ? r.first_air_date : r.release_date;
    return {
      id: `tmdb-${r.media_type}-${r.id}`,
      externalId: r.id,
      apiSource: 'tmdb',
      title: (isTv ? r.name : r.title) ?? '—',
      type: isTv ? 'series' : 'movie',
      year: date ? date.slice(0, 4) : '—',
      coverUrl: r.poster_path ? `${TMDB_IMG}/w500${r.poster_path}` : '',
      backdropUrl: r.backdrop_path ? `${TMDB_IMG}/original${r.backdrop_path}` : undefined,
      genres: (r.genre_ids ?? []).map((id: number) => TMDB_GENRES[id]).filter(Boolean).slice(0, 3),
      rating: round1((r.vote_average ?? 0) / 2),
      myStatus: 'backlog',
      metaDuration: isTv ? 'Série' : 'Longa-metragem',
      platforms: [],
      summary: r.overview || '',
      likedByFriends: [],
      progressTotal: isTv ? MEDIA_META.series.defaultTotal : MEDIA_META.movie.defaultTotal,
    };
  },

  async search(query: string, access: CatalogAccess, lang: Lang): Promise<TrackrItem[]> {
    const data = await catalogGet('tmdb', '/search/multi', { query, language: lang === 'pt' ? 'pt-PT' : 'en-US' }, access);
    return (data.results ?? [])
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 12)
      .map(tmdbAdapter.map);
  },
};
