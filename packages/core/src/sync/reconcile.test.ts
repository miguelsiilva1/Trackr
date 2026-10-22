import { describe, expect, it } from 'vitest';
import type { TrackrItem } from '../domain/types';
import { reconcile, pendingCount } from './reconcile';
import { PROVIDERS } from './providers';
import type { Connection, RemoteEntry } from './types';

const letterboxd = PROVIDERS.find(p => p.id === 'letterboxd')!;
const T0 = 1_000_000;

const film = (title: string, patch: Partial<TrackrItem> = {}): TrackrItem => ({
  id: title, apiSource: 'local_mock', title, type: 'movie', year: 2020, coverUrl: '', genres: [], rating: 0,
  myStatus: 'backlog', metaDuration: '', platforms: [], summary: '', likedByFriends: [], ...patch,
});
const remoteFilm = (title: string, patch: Partial<RemoteEntry> = {}): RemoteEntry => ({
  title, year: 2020, type: 'movie', status: 'completed', updatedAt: T0, ...patch,
});
const conn = (patch: Partial<Connection> = {}): Connection => ({
  username: 'u', connectedAt: 0, direction: 'two_way', conflict: 'newest', auto: false, ...patch,
});

describe('reconcile', () => {
  it('pulls remote-only titles into the library', () => {
    const { items, report } = reconcile([], [remoteFilm('Aftersun')], letterboxd, conn(), T0 + 1);
    expect(items.map(i => i.title)).toEqual(['Aftersun']);
    expect(items[0].myStatus).toBe('completed');
    expect(report.pulled).toEqual(['Aftersun']);
  });

  it('pushes local-only titles of covered types and ignores other types', () => {
    const game: TrackrItem = { ...film('Hades'), type: 'game' };
    const { remote, report } = reconcile([film('Dune'), game], [], letterboxd, conn(), T0);
    expect(remote.map(r => r.title)).toEqual(['Dune']);
    expect(report.pushed).toEqual(['Dune']);
  });

  it('applies the newer side when only one side changed', () => {
    const local = [film('Oppenheimer', { updatedAt: T0 - 10 })];
    const { items, report } = reconcile(local, [remoteFilm('Oppenheimer', { rating: 4 })], letterboxd, conn(), T0 + 1);
    expect(items[0]).toMatchObject({ myStatus: 'completed', myRating: 4 });
    expect(report.updated).toEqual(['Oppenheimer']);
  });

  it('resolves conflicts with the chosen policy', () => {
    const since = T0;
    const local = [film('Dune', { myStatus: 'dropped', updatedAt: since + 50 })];
    const remote = [remoteFilm('Dune', { status: 'completed', updatedAt: since + 10 })];

    const newest = reconcile(local, remote, letterboxd, conn({ lastSync: since }), since + 100);
    expect(newest.report.conflicts).toEqual(['Dune']);
    expect(newest.remote[0].status).toBe('dropped');

    const preferRemote = reconcile(local, remote, letterboxd, conn({ lastSync: since, conflict: 'remote' }), since + 100);
    expect(preferRemote.items[0].myStatus).toBe('completed');
  });

  it('respects pull-only and push-only directions', () => {
    const pullOnly = reconcile([film('Local')], [remoteFilm('Remote')], letterboxd, conn({ direction: 'pull' }), T0);
    expect(pullOnly.report.pushed).toEqual([]);
    expect(pullOnly.report.pulled).toEqual(['Remote']);

    const pushOnly = reconcile([film('Local')], [remoteFilm('Remote')], letterboxd, conn({ direction: 'push' }), T0);
    expect(pushOnly.report.pulled).toEqual([]);
    expect(pushOnly.report.pushed).toEqual(['Local']);
  });

  it('leaves nothing pending right after a sync', () => {
    const at = T0 + 5;
    const { items } = reconcile([film('Dune', { updatedAt: T0 })], [], letterboxd, conn(), at);
    expect(pendingCount(items, letterboxd, conn({ lastSync: at }))).toBe(0);
    expect(items[0].links?.letterboxd).toBe(at);
  });
});
