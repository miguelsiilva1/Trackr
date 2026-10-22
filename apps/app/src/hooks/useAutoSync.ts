import { useEffect } from 'react';
import { PROVIDERS, pendingCount } from '@trackr/core';
import { useTrackr } from '@/store/useTrackr';

const AUTO_SYNC_DELAY_MS = 3000;

/** Pushes pending local changes to every auto-sync connection after a short idle period. */
export function useAutoSync() {
  const items = useTrackr(s => s.items);
  const conns = useTrackr(s => s.conns);
  const syncing = useTrackr(s => s.syncing);
  const runSync = useTrackr(s => s.runSync);

  useEffect(() => {
    const due = PROVIDERS.filter(p => {
      const c = conns[p.id];
      return c?.auto && c.lastSync && !syncing.includes(p.id) && pendingCount(items, p, c) > 0;
    });
    if (!due.length) return;
    const timer = setTimeout(() => due.forEach(p => runSync(p.id)), AUTO_SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [items, conns, syncing, runSync]);
}
