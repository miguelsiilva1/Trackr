import { describe, expect, it } from 'vitest';
import { MOCK_LIBRARY } from '../mocks/library';
import { libKey } from '../domain/media';
import { diffLibraries, mergeLibraries } from './library';

const [a, b, c] = MOCK_LIBRARY;

describe('mergeLibraries', () => {
  it('keeps titles from both sides', () => {
    const merged = mergeLibraries([a, b], [c]);
    expect(merged.map(libKey).sort()).toEqual([a, b, c].map(libKey).sort());
  });

  it('keeps the most recently updated copy of a shared title', () => {
    const older = { ...a, myStatus: 'backlog' as const, updatedAt: 1 };
    const newer = { ...a, myStatus: 'completed' as const, updatedAt: 2 };
    expect(mergeLibraries([older], [newer])[0].myStatus).toBe('completed');
    expect(mergeLibraries([newer], [older])[0].myStatus).toBe('completed');
  });
});

describe('diffLibraries', () => {
  it('reports changed, added and removed titles', () => {
    const changed = { ...b, notes: 'x' };
    const diff = diffLibraries([a, b, c], [a, changed]);
    expect(diff.upserts).toEqual([changed]);
    expect(diff.deletes).toEqual([libKey(c)]);
  });

  it('is empty for the same snapshot', () => {
    expect(diffLibraries([a, b], [a, b])).toEqual({ upserts: [], deletes: [] });
  });
});
