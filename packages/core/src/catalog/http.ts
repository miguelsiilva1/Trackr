import type { CatalogAccess } from '../domain/types';

export const errMsg = (e: unknown) =>
  e instanceof Error && e.name === 'AbortError' ? 'timeout' : e instanceof Error ? e.message : 'network error';

/** fetch + JSON with a short timeout; throws on non-2xx. */
export async function fetchJson(url: string, timeoutMs = 6000, headers?: Record<string, string>): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) throw new Error(res.status === 401 ? 'invalid key' : `HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export type CatalogApi = 'tmdb' | 'rawg';

const CATALOG_BASE: Record<CatalogApi, string> = { tmdb: 'https://api.themoviedb.org/3', rawg: 'https://api.rawg.io/api' };

export const canReach = (api: CatalogApi, access: CatalogAccess) => !!(access[api] || access.proxy);

/** GET from TMDB or RAWG, directly with the user's own key or through the TRACKR proxy. */
export function catalogGet(api: CatalogApi, path: string, params: Record<string, string | number>, access: CatalogAccess): Promise<any> {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const key = access[api];
  if (key) {
    q.set(api === 'tmdb' ? 'api_key' : 'key', key);
    return fetchJson(`${CATALOG_BASE[api]}${path}?${q}`);
  }
  if (!access.proxy) return Promise.reject(new Error('no key'));
  return fetchJson(`${access.proxy.url}/${api}${path}?${q}`, 8000, { Authorization: `Bearer ${access.proxy.token}` });
}
