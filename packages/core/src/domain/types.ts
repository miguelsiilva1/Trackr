export type MediaType = 'movie' | 'series' | 'game';
export type MediaStatus = 'backlog' | 'in_progress' | 'completed' | 'dropped';
export type ProviderId = 'letterboxd' | 'serializd' | 'logg';

export interface TrackrItem {
  id: string | number;
  externalId?: string | number;
  apiSource: 'tmdb' | 'rawg' | 'local_mock' | 'sync';
  title: string;
  type: MediaType;
  year: number | string;
  coverUrl: string;
  backdropUrl?: string;
  genres: string[];
  rating: number;
  myRating?: number;
  myStatus: MediaStatus;
  metaDuration: string;
  platforms: string[];
  summary: string;
  likedByFriends: string[];
  // Personal extensions + sync metadata
  progress?: number;
  progressTotal?: number;
  notes?: string;
  updatedAt?: number;
  links?: Partial<Record<ProviderId, number>>;
}

export interface ApiKeys {
  tmdb: string;
  rawg: string;
}

export type Reaction = '🔥' | '👏' | '🤯';
export type Vote = 'pass' | 'like' | 'super';

export type FeedVerb = 'completed' | 'added' | 'playing' | 'super' | 'rated' | 'match' | 'synced';

export interface FeedEntry {
  id: string;
  /** Friend name, or 'me' for the current user. */
  who: string;
  verb: FeedVerb;
  extra?: string;
  item: Pick<TrackrItem, 'title' | 'type' | 'coverUrl'>;
  rating?: number;
  ts: number;
  reactions: Record<Reaction, number>;
  mine: Reaction[];
}

export interface Friend {
  name: string;
  /** Two hex colors used for the avatar gradient. */
  colors: [string, string];
  now: string;
}

export type Lang = 'pt' | 'en';
export type LangPref = 'system' | Lang;
export type ThemePref = 'system' | 'dark' | 'light';
