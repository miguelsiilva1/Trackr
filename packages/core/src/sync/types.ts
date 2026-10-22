import type { MediaStatus, MediaType, ProviderId } from '../domain/types';

export type SyncDirection = 'two_way' | 'pull' | 'push';
export type ConflictPolicy = 'newest' | 'trackr' | 'remote';

/** Static description of an external tracker. Add a new service by adding one of these. */
export interface ProviderDef {
  id: ProviderId;
  name: string;
  domain: string;
  covers: MediaType[];
  /** Short monogram + two hex colors for the brand mark. */
  mono: string;
  colors: [string, string];
  api: 'official_gated' | 'none';
  csv: 'letterboxd' | 'generic';
}

export interface Connection {
  username: string;
  connectedAt: number;
  lastSync?: number;
  direction: SyncDirection;
  conflict: ConflictPolicy;
  auto: boolean;
}

/** One entry of a user's library as stored by the external service. */
export interface RemoteEntry {
  title: string;
  year: number | string;
  type: MediaType;
  status: MediaStatus;
  rating?: number;
  updatedAt: number;
}

export interface SyncReport {
  provider: ProviderId;
  at: number;
  pulled: string[];
  updated: string[];
  pushed: string[];
  conflicts: string[];
}
