import { useEffect, useState } from 'react';
import { fetchItemDetails, libKey, type ItemDetails, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useCatalogAccess } from './useCatalogAccess';

// Session cache: reopening a title doesn't refetch seasons, achievements or artwork.
const cache = new Map<string, ItemDetails>();

/** Seasons / achievements / artwork for a title; undefined while loading. */
export function useItemDetails(item: TrackrItem | undefined) {
  const { lang } = useApp();
  const access = useCatalogAccess();
  const cacheKey = item ? `${libKey(item)}|${lang}|${access.tmdb}|${access.rawg}|${!!access.proxy}` : '';
  const [details, setDetails] = useState(() => cache.get(cacheKey));

  useEffect(() => {
    if (!item) return;
    const hit = cache.get(cacheKey);
    if (hit) return setDetails(hit);
    let alive = true;
    setDetails(undefined);
    void fetchItemDetails(item, access, lang).then(d => {
      cache.set(cacheKey, d);
      if (alive) setDetails(d);
    });
    return () => { alive = false; };
    // The cache key already captures everything the fetch depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return details;
}
