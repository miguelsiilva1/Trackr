import { seedRemote, type ProviderId, type RemoteEntry } from '@trackr/core';
import type { ProviderClient } from './types';

/** In-memory stand-in for services without a usable API (and for local development). */
export function createMockClient(id: ProviderId): ProviderClient {
  const libraries = new Map<string, RemoteEntry[]>();
  return {
    id,
    async fetchLibrary(userToken) {
      if (!libraries.has(userToken)) libraries.set(userToken, seedRemote()[id]);
      return libraries.get(userToken)!;
    },
    async pushLibrary(userToken, entries) {
      libraries.set(userToken, entries);
    },
  };
}
