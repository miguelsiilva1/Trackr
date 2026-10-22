import type { ProviderId, TrackrItem } from '../domain/types';
import { MEDIA_META, libKey, normalize } from '../domain/media';
import type { Connection, ProviderDef, RemoteEntry, SyncReport } from './types';

export const fromRemote = (r: RemoteEntry, p: ProviderId, at: number): TrackrItem => ({
  id: `sync-${p}-${normalize(r.title).replace(/\W+/g, '-')}-${at}`,
  apiSource: 'sync',
  title: r.title,
  type: r.type,
  year: r.year,
  coverUrl: '',
  genres: [],
  rating: 0,
  myRating: r.rating ? Math.round(r.rating) : undefined,
  myStatus: r.status,
  metaDuration: '—',
  platforms: [],
  summary: '',
  likedByFriends: [],
  progressTotal: MEDIA_META[r.type].defaultTotal,
  updatedAt: r.updatedAt,
  links: { [p]: at },
});

export const toRemote = (i: TrackrItem, at: number): RemoteEntry => ({
  title: i.title, year: i.year, type: i.type, status: i.myStatus, rating: i.myRating, updatedAt: at,
});

/**
 * Pure two-way reconciliation between the local library and one service.
 * Runs unchanged in the app (simulated remote) and in the backend (real remote).
 */
export function reconcile(local: TrackrItem[], remote: RemoteEntry[], p: ProviderDef, conn: Connection, at: number) {
  const since = conn.lastSync ?? 0;
  const canPull = conn.direction !== 'push';
  const canPush = conn.direction !== 'pull';
  const report: SyncReport = { provider: p.id, at, pulled: [], updated: [], pushed: [], conflicts: [] };
  let items = [...local];
  const remoteMap = new Map(remote.map(r => [libKey(r), { ...r }]));

  for (const r of remote) {
    const idx = items.findIndex(i => libKey(i) === libKey(r));
    if (idx < 0) {
      if (canPull) { items.unshift(fromRemote(r, p.id, at)); report.pulled.push(r.title); }
      continue;
    }
    const l = items[idx];
    const lt = l.updatedAt ?? 0;
    const differs = l.myStatus !== r.status || (l.myRating ?? 0) !== Math.round(r.rating ?? 0);
    if (!differs) continue;

    let winner: 'local' | 'remote';
    if (since > 0 && lt > since && r.updatedAt > since) {
      winner = conn.conflict === 'trackr' ? 'local' : conn.conflict === 'remote' ? 'remote' : lt >= r.updatedAt ? 'local' : 'remote';
      report.conflicts.push(r.title);
    } else {
      winner = r.updatedAt > lt ? 'remote' : 'local';
    }

    if (winner === 'remote' && canPull) {
      items[idx] = {
        ...l, myStatus: r.status, myRating: r.rating ? Math.round(r.rating) : l.myRating, updatedAt: r.updatedAt,
        progress: r.status === 'completed' ? l.progressTotal ?? l.progress : l.progress,
      };
      report.updated.push(r.title);
    } else if (winner === 'local' && canPush) {
      remoteMap.set(libKey(r), toRemote(l, at));
      report.pushed.push(r.title);
    }
  }

  if (canPush) {
    for (const l of items) {
      if (p.covers.includes(l.type) && !remoteMap.has(libKey(l))) {
        remoteMap.set(libKey(l), toRemote(l, at));
        report.pushed.push(l.title);
      }
    }
  }

  items = items.map(i => (p.covers.includes(i.type) ? { ...i, links: { ...i.links, [p.id]: at } } : i));
  return { items, remote: Array.from(remoteMap.values()), report };
}

/** Local changes newer than the last sync, for the items a provider covers. */
export const pendingCount = (items: TrackrItem[], p: ProviderDef, conn?: Connection) =>
  conn ? items.filter(i => p.covers.includes(i.type) && (i.updatedAt ?? 0) > (conn.lastSync ?? 0)).length : 0;
