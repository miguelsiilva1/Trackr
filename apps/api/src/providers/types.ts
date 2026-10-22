import type { ProviderId, RemoteEntry } from '@trackr/core';

/**
 * Server-side access to one external tracker for one linked user.
 * Each service implements this once; the sync route stays the same.
 */
export interface ProviderClient {
  id: ProviderId;
  fetchLibrary(userToken: string): Promise<RemoteEntry[]>;
  pushLibrary(userToken: string, entries: RemoteEntry[]): Promise<void>;
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
