export const errMsg = (e: unknown) =>
  e instanceof Error && e.name === 'AbortError' ? 'timeout' : e instanceof Error ? e.message : 'network error';

/** fetch + JSON with a short timeout; throws on non-2xx. */
export async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(res.status === 401 ? 'invalid key' : `HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
