import { useMemo } from 'react';
import type { CatalogAccess } from '@trackr/core';
import { CATALOG_PROXY_URL } from '@/lib/supabase';
import { useTrackr } from '@/store/useTrackr';
import { useAccount } from '@/store/useAccount';

/** The user's own TMDB/RAWG keys, plus the TRACKR catalog proxy while signed in. */
export function useCatalogAccess(): CatalogAccess {
  const keys = useTrackr(s => s.keys);
  const token = useAccount(s => s.accessToken);
  return useMemo(
    () => ({ ...keys, proxy: CATALOG_PROXY_URL && token ? { url: CATALOG_PROXY_URL, token } : undefined }),
    [keys, token],
  );
}
