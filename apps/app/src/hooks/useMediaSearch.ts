import { useEffect, useState } from 'react';
import { MediaRepository, type SearchOutcome, type TrackrItem } from '@trackr/core';
import { useTrackr } from '@/store/useTrackr';
import { useApp } from '@/providers/AppProviders';

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setV(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return v;
}

/** Debounced catalog search: live TMDB/RAWG when keys exist, otherwise the local pool. */
export function useMediaSearch(query: string, pool: TrackrItem[]) {
  const keys = useTrackr(s => s.keys);
  const { lang } = useApp();
  const debounced = useDebounced(query.trim(), 400);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debounced.length < 2) { setOutcome(null); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    MediaRepository.search(debounced, keys, pool, lang).then(r => {
      if (!cancelled) { setOutcome(r); setIsLoading(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, keys.tmdb, keys.rawg, lang]);

  return { outcome, isLoading: isLoading || query.trim() !== debounced, debounced };
}
