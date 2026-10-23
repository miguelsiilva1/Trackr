import { afterEach, describe, expect, it, vi } from 'vitest';
import { canReach, catalogGet } from './http';

const calls: { url: string; headers?: Record<string, string> }[] = [];

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url, headers: init?.headers });
    return { ok: true, status: 200, json: async () => ({}) };
  }));
}

afterEach(() => {
  calls.length = 0;
  vi.unstubAllGlobals();
});

describe('catalogGet', () => {
  const proxy = { url: 'https://x.supabase.co/functions/v1/catalog', token: 'jwt' };

  it('uses the user key directly when there is one', async () => {
    stubFetch();
    await catalogGet('tmdb', '/search/multi', { query: 'dune' }, { tmdb: 'k1', rawg: '', proxy });
    expect(calls[0].url).toBe('https://api.themoviedb.org/3/search/multi?query=dune&api_key=k1');
    expect(calls[0].headers).toBeUndefined();
  });

  it('goes through the proxy with the session token and no key otherwise', async () => {
    stubFetch();
    await catalogGet('rawg', '/games/1/achievements', { page: 2 }, { tmdb: '', rawg: '', proxy });
    expect(calls[0].url).toBe('https://x.supabase.co/functions/v1/catalog/rawg/games/1/achievements?page=2');
    expect(calls[0].headers).toEqual({ Authorization: 'Bearer jwt' });
  });

  it('fails without a key or a proxy', async () => {
    await expect(catalogGet('tmdb', '/search/multi', {}, { tmdb: '', rawg: '' })).rejects.toThrow('no key');
    expect(canReach('rawg', { tmdb: '', rawg: '' })).toBe(false);
    expect(canReach('rawg', { tmdb: '', rawg: '', proxy })).toBe(true);
  });
});
