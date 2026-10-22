import type { ProviderClient } from './types';
import { NotImplementedError } from './types';

/**
 * Letterboxd's official API requires an approved key (api.letterboxd.com, OAuth 2).
 * Until TRACKR is approved, the app moves data with the CSV import/export instead.
 */
export function createLetterboxdClient(apiKey: string | undefined): ProviderClient {
  const fail = async (): Promise<never> => {
    throw new NotImplementedError(
      apiKey ? 'Letterboxd client not implemented yet' : 'LETTERBOXD_API_KEY missing — request API access from Letterboxd first',
    );
  };
  return { id: 'letterboxd', fetchLibrary: fail, pushLibrary: fail };
}
