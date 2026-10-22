import type { TrackrItem } from '../domain/types';
import { libKey } from '../domain/media';

/**
 * First-login merge of the device library with the cloud library.
 * Titles are matched by libKey; when both sides have a title the most recently updated copy wins.
 */
export function mergeLibraries(local: TrackrItem[], cloud: TrackrItem[]): TrackrItem[] {
  const byKey = new Map(local.map(i => [libKey(i), i]));
  for (const c of cloud) {
    const l = byKey.get(libKey(c));
    if (!l || (c.updatedAt ?? 0) > (l.updatedAt ?? 0)) byKey.set(libKey(c), c);
  }
  return [...byKey.values()];
}

export interface LibraryDiff {
  upserts: TrackrItem[];
  deletes: string[];
}

/** What changed between two snapshots of the library, by libKey. Unchanged objects keep their reference. */
export function diffLibraries(prev: TrackrItem[], next: TrackrItem[]): LibraryDiff {
  const before = new Map(prev.map(i => [libKey(i), i]));
  const after = new Set(next.map(libKey));
  return {
    upserts: next.filter(i => before.get(libKey(i)) !== i),
    deletes: [...before.keys()].filter(k => !after.has(k)),
  };
}
