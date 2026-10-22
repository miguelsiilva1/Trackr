import { useEffect, useState } from 'react';
import { fetchItemDetails, libKey, type ItemDetails, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';

// Session cache: reopening a title doesn't refetch seasons, achievements or artwork.
const cache = new Map<string, ItemDetails>();

/** Seasons / achievements / artwork for a title; undefined while loading. */
export function useItemDetails(item: TrackrItem | undefined) {
  const { lang } = useApp();
  const keys = useTrackr(s => s.keys);
  const cacheKey = item ? `${libKey(item)}|${lang}|${keys.tmdb}|${keys.rawg}` : '';
  const [details, setDetails] = useState(() => cache.get(cacheKey));

  useEffect(() => {
    if (!item) return;
    const hit = cache.get(cacheKey);
    if (hit) return setDetails(hit);
    let alive = true;
    setDetails(undefined);
    void fetchItemDetails(item, keys, lang).then(d => {
      cache.set(cacheKey, d);
      if (alive) setDetails(d);
    });
    return () => { alive = false; };
    // The cache key already captures everything the fetch depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return details;
}
