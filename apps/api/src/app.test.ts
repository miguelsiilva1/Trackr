import { describe, expect, it } from 'vitest';
import { MOCK_LIBRARY, type Connection } from '@trackr/core';
import { createApp, defaultDeps } from './app';

const connection: Connection = { username: 'u', connectedAt: 0, direction: 'two_way', conflict: 'newest', auto: true };

const sync = (app: ReturnType<typeof createApp>, provider: string, token?: string, items = MOCK_LIBRARY, conn = connection) =>
  app.request(`/sync/${provider}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ items, connection: conn }),
  });

describe('API', () => {
  it('reports health', async () => {
    const res = await createApp(defaultDeps({})).request('/health');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('rejects unknown providers and missing tokens', async () => {
    const app = createApp(defaultDeps({}));
    expect((await sync(app, 'myspace', 't')).status).toBe(404);
    expect((await sync(app, 'letterboxd')).status).toBe(401);
  });

  it('runs a two-way sync against the mock client and persists pushed entries', async () => {
    const app = createApp(defaultDeps({}));
    const first = await (await sync(app, 'letterboxd', 'user-1')).json();
    expect(first.report.pulled).toContain('Past Lives');
    expect(first.report.pushed.length).toBeGreaterThan(0);

    // Re-syncing the reconciled library finds nothing left to move in either direction.
    const second = await (await sync(app, 'letterboxd', 'user-1', first.items, { ...connection, lastSync: first.lastSync })).json();
    expect(second.report).toMatchObject({ pulled: [], updated: [], pushed: [], conflicts: [] });
  });

  it('returns 501 for Letterboxd until an approved key and client exist', async () => {
    const app = createApp(defaultDeps({ LETTERBOXD_API_KEY: 'k' }));
    expect((await sync(app, 'letterboxd', 'user-1')).status).toBe(501);
  });
});
