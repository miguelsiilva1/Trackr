import { Hono } from 'hono';
import { providerById, reconcile, type Connection, type ProviderId, type TrackrItem } from '@trackr/core';
import { createMockClient } from './providers/mock';
import { createLetterboxdClient } from './providers/letterboxd';
import { NotImplementedError, type ProviderClient } from './providers/types';

export interface AppDeps {
  clients: Record<ProviderId, ProviderClient>;
}

export const defaultDeps = (env: NodeJS.ProcessEnv = process.env): AppDeps => ({
  clients: {
    letterboxd: env.LETTERBOXD_API_KEY ? createLetterboxdClient(env.LETTERBOXD_API_KEY) : createMockClient('letterboxd'),
    serializd: createMockClient('serializd'),
    logg: createMockClient('logg'),
  },
});

interface SyncBody {
  items: TrackrItem[];
  connection: Connection;
}

export function createApp(deps: AppDeps = defaultDeps()) {
  const app = new Hono();

  app.get('/health', c => c.json({ ok: true }));

  // OAuth entry points. Real flows need provider approval; see providers/letterboxd.ts.
  app.get('/auth/:provider/start', c => c.json({ error: `OAuth for ${c.req.param('provider')} not available yet` }, 501));

  /**
   * Two-way sync for one provider. The client sends its library and connection settings;
   * the server reads/writes the remote library and returns the reconciled local library.
   * TODO: replace the bearer token with a TRACKR session mapped to stored provider tokens.
   */
  app.post('/sync/:provider', async c => {
    const p = providerById(c.req.param('provider'));
    if (!p) return c.json({ error: 'unknown provider' }, 404);
    const token = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return c.json({ error: 'missing bearer token' }, 401);

    const body = await c.req.json<SyncBody>();
    const client = deps.clients[p.id];
    try {
      const remote = await client.fetchLibrary(token);
      const at = Date.now();
      const res = reconcile(body.items, remote, p, body.connection, at);
      if (body.connection.direction !== 'pull') await client.pushLibrary(token, res.remote);
      return c.json({ items: res.items, report: res.report, lastSync: at });
    } catch (e) {
      if (e instanceof NotImplementedError) return c.json({ error: e.message }, 501);
      throw e;
    }
  });

  return app;
}
