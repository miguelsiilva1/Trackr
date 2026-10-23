// Catalog proxy: forwards a fixed set of TMDB and RAWG GET endpoints for signed-in users,
// adding the API keys server-side so they never ship in the app.
//   GET /functions/v1/catalog/tmdb/search/multi?query=dune
//   GET /functions/v1/catalog/rawg/games/3498/achievements?page=1
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const UPSTREAM = {
  tmdb: { base: 'https://api.themoviedb.org/3', keyParam: 'api_key', key: Deno.env.get('TMDB_API_KEY') },
  rawg: { base: 'https://api.rawg.io/api', keyParam: 'key', key: Deno.env.get('RAWG_API_KEY') },
} as const;

// Only the endpoints the app uses; anything else is refused.
const ALLOWED: Record<keyof typeof UPSTREAM, RegExp[]> = {
  tmdb: [
    /^\/search\/(multi|movie|tv)$/,
    /^\/(movie|tv)\/\d+(\/images)?$/,
    /^\/tv\/\d+\/season\/\d+$/,
  ],
  rawg: [
    /^\/games$/,
    /^\/games\/\d+(\/(achievements|screenshots))?$/,
  ],
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Per-user request budget. Isolates are short-lived, so this only stops bursts; TMDB/RAWG have their own limits.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, { start: number; n: number }>();

function overBudget(userId: string) {
  const now = Date.now();
  const h = hits.get(userId);
  if (!h || now - h.start > WINDOW_MS) {
    hits.set(userId, { start: now, n: 1 });
    return false;
  }
  return ++h.n > MAX_PER_WINDOW;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'GET') return json(405, { error: 'method not allowed' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'sign in required' });
  const { data, error } = await auth.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId || data.claims.role !== 'authenticated') return json(401, { error: 'sign in required' });
  if (overBudget(userId)) return json(429, { error: 'too many requests' });

  const url = new URL(req.url);
  const match = url.pathname.match(/\/catalog\/(tmdb|rawg)(\/.*)$/);
  if (!match) return json(404, { error: 'unknown endpoint' });
  const api = match[1] as keyof typeof UPSTREAM;
  const path = match[2];
  if (!ALLOWED[api].some(r => r.test(path))) return json(404, { error: 'unknown endpoint' });

  const up = UPSTREAM[api];
  if (!up.key) return json(503, { error: `${api} not configured` });
  const params = new URLSearchParams(url.search);
  params.delete(up.keyParam);
  params.set(up.keyParam, up.key);

  const res = await fetch(`${up.base}${path}?${params}`);
  return new Response(res.body, {
    status: res.status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=3600' },
  });
});
