import React, { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext } from 'react';
import {
  Film, Tv, Gamepad2, Search, Plus, Settings, X, Star, Loader2, Check, Key, Wifi, WifiOff,
  Clock, Play, Sparkles, Users, Activity, LayoutGrid, ChevronLeft, ChevronRight, Crosshair,
  Eye, EyeOff, Trash2, Keyboard, AlertCircle, RotateCcw, Heart, RefreshCw, Upload, Download,
  Copy, Link2, Unlink, Sun, Moon, Monitor, Languages, ArrowDown, ArrowUp, Zap, User,
} from 'lucide-react';

/* ============================================================================
 * 1. SCHEMA UNIFICADO
 * ========================================================================== */

type MediaType = 'movie' | 'series' | 'game';
type MediaStatus = 'backlog' | 'in_progress' | 'completed' | 'dropped';
type ProviderId = 'letterboxd' | 'serializd' | 'logg';

interface TrackrItem {
  id: string | number;
  externalId?: string | number;
  apiSource: 'tmdb' | 'rawg' | 'local_mock' | 'sync';
  title: string;
  type: MediaType;
  year: number | string;
  coverUrl: string;
  backdropUrl?: string;
  genres: string[];
  rating: number;
  myRating?: number;
  myStatus: MediaStatus;
  metaDuration: string;
  platforms: string[];
  summary: string;
  likedByFriends: string[];
  // Extensões pessoais + sync
  progress?: number;
  progressTotal?: number;
  notes?: string;
  updatedAt?: number;
  links?: Partial<Record<ProviderId, number>>;
}

interface ApiKeys { tmdb: string; rawg: string }
type ViewId = 'hub' | 'match' | 'feed' | 'profile';
type Reaction = '🔥' | '👏' | '🤯';
type Vote = 'pass' | 'like' | 'super';
type Lang = 'pt' | 'en';
type LangPref = 'system' | Lang;
type ThemePref = 'system' | 'dark' | 'light';

type FeedVerb = 'completed' | 'added' | 'playing' | 'super' | 'rated' | 'match' | 'synced';
interface FeedEntry {
  id: string;
  who: string; // 'me' = utilizador
  verb: FeedVerb;
  extra?: string;
  item: Pick<TrackrItem, 'title' | 'type' | 'coverUrl'>;
  rating?: number;
  ts: number;
  reactions: Record<Reaction, number>;
  mine: Reaction[];
}

/* ============================================================================
 * 2. I18N (PT / EN)
 * ========================================================================== */

const PT = {
  nav_hub: 'O Meu Trackr', nav_hub_short: 'Trackr', nav_match: 'TrackrMatch', nav_match_short: 'Match',
  nav_feed: 'Feed da Tribo', nav_feed_short: 'Tribo', nav_profile: 'Perfil & Sync', nav_profile_short: 'Perfil',
  you: 'Tu', close: 'Fechar', clear: 'Limpar', save: 'Guardar', later: 'Depois', start: 'Iniciar',
  track_item: 'Track Item', hub_kicker: 'Hub individual', search_ph: 'Pesquisar títulos, géneros…',
  stat_total: 'No Trackr', stat_completed: 'Completados', stat_eps: 'Episódios vistos', stat_hours: 'Horas jogadas',
  type_movie: 'Filme', type_series: 'Série', type_game: 'Jogo', types_movie: 'Filmes', types_series: 'Séries', types_game: 'Jogos',
  cat_all: 'Todos', any_status: 'Qualquer estado',
  st_progress: 'A Consumir', st_progress_all: 'A Consumir / A Jogar', st_progress_watch: 'A Ver', st_progress_play: 'A Jogar',
  st_backlog: 'Backlog', st_backlog_all: 'Backlog (Quero Ver/Jogar)', st_backlog_watch: 'Quero Ver', st_backlog_play: 'Quero Jogar',
  st_completed: 'Completado', st_completed_pl: 'Completados', st_dropped: 'Abandonado', st_dropped_pl: 'Abandonados',
  discover: 'Descobrir', src_live: 'TMDB / RAWG (live)', src_local: 'catálogo local',
  nothing_new: 'Nada novo para “{q}”. Tudo o que existe já está no teu Trackr.', using_local: 'a usar dados locais.',
  empty_title: 'Nada por aqui.', empty_body: 'Ajusta os filtros ou adiciona algo novo ao Trackr.',
  add_ph: 'Filme, série ou jogo…', live_search: 'Pesquisa live: {s}', mock_hint: 'Modo mock — adiciona chaves em Perfil para pesquisa real',
  suggestions: 'Sugestões', no_results: 'Sem resultados para “{q}”.', in_trackr: 'No Trackr', add_to: 'Adicionar ao Trackr', add_short: 'Adicionar',
  status: 'Estado', my_rating: 'A minha nota', notes: 'Notas pessoais', notes_ph_game: 'Build, boss onde parei, com quem jogar…',
  notes_ph: 'O que achaste? Onde ficaste?', source: 'Fonte', mock_source: 'Mock local', remove: 'Remover do Trackr',
  friends_have_one: '{names} tem isto no Trackr', friends_have_many: '{names} têm isto no Trackr',
  progress_movie: 'Minutos vistos', progress_series: 'Episódios vistos', progress_game: 'Horas jogadas',
  no_summary: 'Sinopse ainda não disponível.', rawg_summary: 'Descrição completa no endpoint de detalhe da RAWG (/games/{id}).',
  synced_with: 'Sincronizado com',
  match_kicker: 'Motor social', in_session: '{n} na sessão', pick_tribe: 'Escolhe a tribo', plan_q: 'Qual é o plano de hoje?',
  plan_movie: 'Ver Filme', plan_series: 'Ver Série', plan_game: 'Jogar Co-op',
  swipe_match: 'MATCH', swipe_pass: 'PASSAR', swipe_super: 'SUPER VOTO',
  friends_backlog_one: '1 amigo tem isto no Backlog', friends_backlog_many: '{n} amigos têm isto no Backlog',
  deck_empty: 'Deck esgotado', deck_empty_body: 'Já votaste em tudo para este plano. Troca de plano ou baralha de novo.',
  reshuffle: 'Baralhar de novo', pass: 'Passar', super: 'Super Voto', align: 'Alinhar',
  kb_hint: '← Passar · ↑ Super Voto · → Alinhar · ou arrasta o card',
  session_matches: 'Matches da sessão', no_matches: 'Ainda sem matches. Alinha títulos que a tribo também quer.',
  how_title: 'Como funciona', how_1: '🍿/🎮 Match quando todos os amigos presentes já aprovaram o título.',
  how_2: '⭐ Super Voto: basta um amigo presente ter aprovado.', how_3: 'Restam {n} títulos no deck.',
  match_title: 'Temos Match no Trackr!', available_on: 'Disponível na {w}. Iniciar agora?',
  feed_kicker: 'Comunidade', tribe_now: 'A tribo agora', consuming: 'A consumir',
  v_completed: 'completou', v_added: 'adicionou ao Trackr', v_playing: 'está a jogar', v_super: 'deu Super Voto a',
  v_rated: 'avaliou', v_match: 'deu match com {x} em', v_synced: 'importou de {x}',
  toast_completed: '✓ {t} completado', toast_exists: 'Já está no teu Trackr', toast_added: '+ {t} adicionado ao Backlog',
  toast_removed: '{t} removido', toast_keys: 'Chaves guardadas — pesquisa live ativa', toast_mock: 'Modo mock local ativo',
  toast_super: '⭐ Super Voto enviado à tribo', toast_vote: 'Voto registado — à espera da tribo', toast_start: '▶ {t} — bom proveito!',
  api_live: 'API Live', api_mock: 'Mock Local', shortcuts: 'Atalhos', sc_search: 'pesquisar', sc_add: 'adicionar', sc_profile: 'perfil',
  by_cat: 'Por categoria', collapse: 'Colapsar sidebar',
  profile_kicker: 'Conta', prefs: 'Preferências', language: 'Língua', theme: 'Tema',
  opt_system: 'Sistema', th_dark: 'Escuro', th_light: 'Claro',
  api_title: 'APIs de catálogo', api_body: 'Sem chaves, o TRACKR usa o catálogo mock interno. As chaves ficam guardadas só neste browser.',
  paste_key: 'Colar chave…', show_keys: 'Mostrar chaves', hide_keys: 'Esconder chaves',
  sync_title: 'Sync com outros trackers',
  sync_body: 'Mantém Letterboxd, Serializd e Logg atualizados para quem está fora da tribo. O que entra no Trackr segue para lá — e o que fazes lá entra aqui.',
  connect: 'Ligar conta', disconnect: 'Desligar', sync_now: 'Sincronizar agora', syncing: 'A sincronizar…',
  last_sync: 'Último sync {d}', never: 'nunca', pending: '{n} alterações por enviar', up_to_date: 'Em dia',
  direction: 'Direção', dir_two: 'Bidirecional', dir_pull: 'Só importar', dir_push: 'Só exportar',
  conflict: 'Em conflito, ganha', cf_newest: 'Mais recente', cf_trackr: 'Trackr', cf_remote: 'Serviço',
  auto_sync: 'Sync automático', remote_count: '{n} itens na conta',
  cap_official: 'API oficial com chave aprovada · CSV real', cap_none: 'Sem API pública · sync simulado · CSV',
  sim_badge: 'Simulado', simulate_remote: 'Simular atividade remota', toast_remote: '{p}: nova atividade remota',
  login_title: 'Ligar {p}', login_user: 'Utilizador em {p}', login_cta: 'Continuar com {p}', login_sim_cta: 'Ligar em modo simulado',
  login_note_oauth: 'Simulação do fluxo OAuth. Em produção o login passa por um backend TRACKR com a API key oficial — a tua password nunca toca nesta app.',
  login_note_none: '{p} não tem API pública. A ligação é simulada até existir API oficial; usa CSV para mover dados hoje.',
  csv_import: 'Importar CSV', csv_export: 'Exportar CSV', export_watched: 'Vistos', export_watchlist: 'Watchlist',
  csv_hint_lb: 'Aceita o export do Letterboxd: watched.csv, ratings.csv, diary.csv, watchlist.csv',
  csv_hint_generic: 'Aceita CSV com colunas Title/Name, Year, Status, Rating',
  csv_done: '{p} CSV: {a} novos, {u} atualizados', csv_err: 'CSV inválido ou vazio',
  copy: 'Copiar', copied: 'Copiado!', download: 'Descarregar', export_title: 'Exportar para {p}',
  export_hint_lb: 'Importa em letterboxd.com/import (Vistos) ou na tua Watchlist → Import.',
  export_hint_generic: 'Formato genérico TRACKR — para importar manualmente.',
  log_title: 'Registo de sync', sync_result: '{p}: ↓{a} importados · ↻{u} atualizados · ↑{b} enviados · ⚠{c} conflitos',
  log_empty: 'Ainda não sincronizaste nada.', more_soon: 'Mais conectores em breve', more_soon_body: 'Trakt, Backloggd, TV Time, Goodreads… o motor de sync é por adaptador.',
  covers: 'Cobre', profile_tagline: 'A tua tribo, os teus trackers, um só sítio.',
};
type StrKey = keyof typeof PT;

const EN: Record<StrKey, string> = {
  nav_hub: 'My Trackr', nav_hub_short: 'Trackr', nav_match: 'TrackrMatch', nav_match_short: 'Match',
  nav_feed: 'Tribe Feed', nav_feed_short: 'Tribe', nav_profile: 'Profile & Sync', nav_profile_short: 'Profile',
  you: 'You', close: 'Close', clear: 'Clear', save: 'Save', later: 'Later', start: 'Start',
  track_item: 'Track Item', hub_kicker: 'Personal hub', search_ph: 'Search titles, genres…',
  stat_total: 'In Trackr', stat_completed: 'Completed', stat_eps: 'Episodes watched', stat_hours: 'Hours played',
  type_movie: 'Movie', type_series: 'Series', type_game: 'Game', types_movie: 'Movies', types_series: 'Series', types_game: 'Games',
  cat_all: 'All', any_status: 'Any status',
  st_progress: 'In Progress', st_progress_all: 'Watching / Playing', st_progress_watch: 'Watching', st_progress_play: 'Playing',
  st_backlog: 'Backlog', st_backlog_all: 'Backlog (Want to Watch/Play)', st_backlog_watch: 'Want to Watch', st_backlog_play: 'Want to Play',
  st_completed: 'Completed', st_completed_pl: 'Completed', st_dropped: 'Dropped', st_dropped_pl: 'Dropped',
  discover: 'Discover', src_live: 'TMDB / RAWG (live)', src_local: 'local catalog',
  nothing_new: 'Nothing new for “{q}”. Everything is already in your Trackr.', using_local: 'using local data.',
  empty_title: 'Nothing here.', empty_body: 'Adjust the filters or add something new to Trackr.',
  add_ph: 'Movie, series or game…', live_search: 'Live search: {s}', mock_hint: 'Mock mode — add keys in Profile for real search',
  suggestions: 'Suggestions', no_results: 'No results for “{q}”.', in_trackr: 'In Trackr', add_to: 'Add to Trackr', add_short: 'Add',
  status: 'Status', my_rating: 'My rating', notes: 'Personal notes', notes_ph_game: 'Build, boss where I stopped, who to play with…',
  notes_ph: 'What did you think? Where did you stop?', source: 'Source', mock_source: 'Local mock', remove: 'Remove from Trackr',
  friends_have_one: '{names} has this in Trackr', friends_have_many: '{names} have this in Trackr',
  progress_movie: 'Minutes watched', progress_series: 'Episodes watched', progress_game: 'Hours played',
  no_summary: 'No synopsis available yet.', rawg_summary: 'Full description on the RAWG detail endpoint (/games/{id}).',
  synced_with: 'Synced with',
  match_kicker: 'Social engine', in_session: '{n} in session', pick_tribe: 'Pick your tribe', plan_q: "What's the plan tonight?",
  plan_movie: 'Watch a Movie', plan_series: 'Watch a Series', plan_game: 'Play Co-op',
  swipe_match: 'MATCH', swipe_pass: 'PASS', swipe_super: 'SUPER VOTE',
  friends_backlog_one: '1 friend has this in Backlog', friends_backlog_many: '{n} friends have this in Backlog',
  deck_empty: 'Deck empty', deck_empty_body: "You've voted on everything for this plan. Switch plans or reshuffle.",
  reshuffle: 'Reshuffle', pass: 'Pass', super: 'Super Vote', align: 'Match',
  kb_hint: '← Pass · ↑ Super Vote · → Match · or drag the card',
  session_matches: 'Session matches', no_matches: 'No matches yet. Pick titles your tribe also wants.',
  how_title: 'How it works', how_1: '🍿/🎮 Match when every friend present already approved the title.',
  how_2: '⭐ Super Vote: one present friend approving is enough.', how_3: '{n} titles left in the deck.',
  match_title: "It's a Trackr Match!", available_on: 'Available on {w}. Start now?',
  feed_kicker: 'Community', tribe_now: 'Tribe right now', consuming: 'Currently on',
  v_completed: 'completed', v_added: 'added to Trackr', v_playing: 'is playing', v_super: 'super-voted',
  v_rated: 'rated', v_match: 'matched with {x} on', v_synced: 'imported from {x}',
  toast_completed: '✓ {t} completed', toast_exists: 'Already in your Trackr', toast_added: '+ {t} added to Backlog',
  toast_removed: '{t} removed', toast_keys: 'Keys saved — live search on', toast_mock: 'Local mock mode on',
  toast_super: '⭐ Super Vote sent to the tribe', toast_vote: 'Vote saved — waiting on the tribe', toast_start: '▶ {t} — enjoy!',
  api_live: 'Live API', api_mock: 'Local Mock', shortcuts: 'Shortcuts', sc_search: 'search', sc_add: 'add', sc_profile: 'profile',
  by_cat: 'By category', collapse: 'Collapse sidebar',
  profile_kicker: 'Account', prefs: 'Preferences', language: 'Language', theme: 'Theme',
  opt_system: 'System', th_dark: 'Dark', th_light: 'Light',
  api_title: 'Catalog APIs', api_body: 'Without keys, TRACKR uses its internal mock catalog. Keys are stored only in this browser.',
  paste_key: 'Paste key…', show_keys: 'Show keys', hide_keys: 'Hide keys',
  sync_title: 'Sync with other trackers',
  sync_body: 'Keep Letterboxd, Serializd and Logg up to date for people outside the tribe. What goes into Trackr flows there — and what you do there flows here.',
  connect: 'Connect account', disconnect: 'Disconnect', sync_now: 'Sync now', syncing: 'Syncing…',
  last_sync: 'Last sync {d}', never: 'never', pending: '{n} changes to push', up_to_date: 'Up to date',
  direction: 'Direction', dir_two: 'Two-way', dir_pull: 'Import only', dir_push: 'Export only',
  conflict: 'On conflict, prefer', cf_newest: 'Newest', cf_trackr: 'Trackr', cf_remote: 'Service',
  auto_sync: 'Auto sync', remote_count: '{n} items in account',
  cap_official: 'Official API with approved key · real CSV', cap_none: 'No public API · simulated sync · CSV',
  sim_badge: 'Simulated', simulate_remote: 'Simulate remote activity', toast_remote: '{p}: new remote activity',
  login_title: 'Connect {p}', login_user: '{p} username', login_cta: 'Continue with {p}', login_sim_cta: 'Connect in simulated mode',
  login_note_oauth: 'Simulated OAuth flow. In production, login goes through a TRACKR backend holding the official API key — your password never touches this app.',
  login_note_none: '{p} has no public API. The connection is simulated until an official API exists; use CSV to move data today.',
  csv_import: 'Import CSV', csv_export: 'Export CSV', export_watched: 'Watched', export_watchlist: 'Watchlist',
  csv_hint_lb: 'Accepts the Letterboxd export: watched.csv, ratings.csv, diary.csv, watchlist.csv',
  csv_hint_generic: 'Accepts CSV with columns Title/Name, Year, Status, Rating',
  csv_done: '{p} CSV: {a} new, {u} updated', csv_err: 'Invalid or empty CSV',
  copy: 'Copy', copied: 'Copied!', download: 'Download', export_title: 'Export to {p}',
  export_hint_lb: 'Import at letterboxd.com/import (Watched) or in your Watchlist → Import.',
  export_hint_generic: 'Generic TRACKR format — for manual import.',
  log_title: 'Sync log', sync_result: '{p}: ↓{a} imported · ↻{u} updated · ↑{b} pushed · ⚠{c} conflicts',
  log_empty: "You haven't synced anything yet.", more_soon: 'More connectors soon', more_soon_body: 'Trakt, Backloggd, TV Time, Goodreads… the sync engine is adapter-based.',
  covers: 'Covers', profile_tagline: 'Your tribe, your trackers, one place.',
};

type TFn = (k: StrKey, vars?: Record<string, string | number>) => string;
const makeT = (lang: Lang): TFn => (k, vars) => {
  let s = (lang === 'en' ? EN : PT)[k];
  if (vars) for (const [name, v] of Object.entries(vars)) s = s.split(`{${name}}`).join(String(v));
  return s;
};

const I18n = createContext<{ t: TFn; lang: Lang }>({ t: makeT('pt'), lang: 'pt' });
const useI18n = () => useContext(I18n);

const GENRE_EN: Record<string, string> = {
  'Ficção Científica': 'Sci-Fi', Aventura: 'Adventure', História: 'History', Animação: 'Animation', Ação: 'Action',
  Comédia: 'Comedy', Mistério: 'Mystery', Estratégia: 'Strategy', Plataformas: 'Platformer', 'Mundo Aberto': 'Open World',
  Documentário: 'Documentary', Família: 'Family', Fantasia: 'Fantasy', Terror: 'Horror', Música: 'Music', Guerra: 'War',
  'Ação & Aventura': 'Action & Adventure', Infantil: 'Kids', Notícias: 'News', 'Sci-Fi & Fantasia': 'Sci-Fi & Fantasy',
  Novela: 'Soap', 'Guerra & Política': 'War & Politics',
};
const tGenre = (g: string, lang: Lang) => (lang === 'en' ? GENRE_EN[g] ?? g : g);
const tDuration = (d: string, lang: Lang) => lang === 'pt' ? d : d
  .replace('temporadas', 'seasons').replace('temporada', 'season').replace('Longa-metragem', 'Feature')
  .replace('Série', 'Series').replace('Duração n/d', 'Duration n/a');

const SUMMARY_EN: Record<string, string> = {
  'Dune: Part Two': 'Paul Atreides unites with Chani and the Fremen on a warpath of revenge against the conspirators who destroyed his family, while trying to prevent a terrible future only he can foresee.',
  Interstellar: 'On a dying Earth, a team of explorers travels through a wormhole near Saturn in search of a new home for humanity.',
  Oppenheimer: 'The story of J. Robert Oppenheimer and his role in developing the atomic bomb — and the moral cost that followed.',
  'Spider-Man: Across the Spider-Verse': 'Miles Morales catapults across the Multiverse and meets a team of Spider-People charged with protecting its very existence.',
  'Everything Everywhere All at Once': 'An overwhelmed immigrant is swept into an insane adventure where only she can save the world by exploring other universes.',
  'Your Name.': 'Two teenagers who have never met discover they swap bodies while they sleep — a bond that crosses time and distance.',
  Succession: 'The Roy family controls one of the biggest media empires in the world. As the patriarch steps back, his children fight for the throne.',
  Severance: "Mark leads a team whose memories have been surgically divided between work and personal life. When a mysterious colleague appears outside the office, the truth starts to unravel.",
  'The Last of Us': 'Twenty years after civilization collapsed, Joel is hired to smuggle 14-year-old Ellie out of an oppressive quarantine zone.',
  Arcane: 'Between utopian Piltover and oppressed Zaun, two sisters fight on opposite sides of a war between magic technologies and clashing convictions.',
  'Shōgun': 'Japan, 1600. Lord Yoshii Toranaga fights for his life as his enemies on the Council of Regents unite against him.',
  'The Bear': 'A young fine-dining chef returns to Chicago to run his family sandwich shop after a tragedy.',
  'Breaking Bad': 'A terminally ill chemistry teacher teams up with a former student to cook and sell meth to secure his family’s future.',
  'Elden Ring': 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring in the Lands Between. A vast open world with online co-op.',
  "Baldur's Gate 3": 'Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal — with up to 4-player co-op.',
  'It Takes Two': 'A platform adventure built purely for two players. Cody and May, turned into dolls, must cooperate to save their marriage.',
  'Portal 2': 'Return to Aperture Science with the portal gun, a vengeful AI and a dedicated two-robot co-op mode.',
  Hades: 'Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler.',
  'The Witcher 3: Wild Hunt': 'Geralt of Rivia, monster slayer, searches for his adopted daughter across a war-torn open world hunted by the Wild Hunt.',
  'BioShock Infinite': 'Columbia, a floating city in the skies of 1912. Booker DeWitt has a debt to settle: find Elizabeth.',
  'The Elder Scrolls V: Skyrim': 'Dragons return to Skyrim. You are the Dragonborn, the only hope of a land torn by civil war.',
  'Grand Theft Auto V': 'Three very different criminals risk everything in a series of daring heists across Los Santos.',
  'Elden Ring Nightreign': 'A standalone co-op adventure in the Elden Ring universe for up to three players.',
};

const formatAgo = (ts: number, lang: Lang) => {
  const rtf = new Intl.RelativeTimeFormat(lang === 'pt' ? 'pt-PT' : 'en', { numeric: 'auto' });
  const s = Math.round((ts - Date.now()) / 1000);
  if (Math.abs(s) < 60) return rtf.format(0, 'second');
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, 'minute');
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, 'hour');
  return rtf.format(Math.round(h / 24), 'day');
};

/* ============================================================================
 * 3. DESIGN TOKENS (Dark / Light via CSS variables)
 * ========================================================================== */

const TYPE_META: Record<MediaType, {
  icon: typeof Film; hex: string; tx: string; soft: string; bd: string; onImage: string; solid: string; fallback: string;
  progressUnit: string; defaultTotal: number;
}> = {
  movie: { icon: Film, hex: '#f59e0b', tx: 'tx-movie', soft: 'soft-movie', bd: 'bd-movie', onImage: 'text-amber-300', solid: 'bg-amber-500', fallback: 'from-amber-600 to-zinc-900', progressUnit: 'min', defaultTotal: 120 },
  series: { icon: Tv, hex: '#8b5cf6', tx: 'tx-series', soft: 'soft-series', bd: 'bd-series', onImage: 'text-violet-300', solid: 'bg-violet-500', fallback: 'from-violet-600 to-zinc-900', progressUnit: 'ep', defaultTotal: 10 },
  game: { icon: Gamepad2, hex: '#10b981', tx: 'tx-game', soft: 'soft-game', bd: 'bd-game', onImage: 'text-emerald-300', solid: 'bg-emerald-500', fallback: 'from-emerald-600 to-zinc-900', progressUnit: 'h', defaultTotal: 50 },
};

const statusLabel = (s: MediaStatus, type: MediaType | 'all', t: TFn): string => {
  if (s === 'in_progress') return type === 'game' ? t('st_progress_play') : type === 'all' ? t('st_progress') : t('st_progress_watch');
  if (s === 'backlog') return type === 'game' ? t('st_backlog_play') : type === 'all' ? t('st_backlog') : t('st_backlog_watch');
  return s === 'completed' ? t('st_completed') : t('st_dropped');
};

const STATUS_DOT: Record<MediaStatus, string> = {
  backlog: 'bg-zinc-400', in_progress: 'bg-sky-400', completed: 'bg-emerald-400', dropped: 'bg-rose-400',
};

const FRIENDS = [
  { name: 'Diogo', grad: 'from-sky-400 to-blue-600', now: 'Elden Ring' },
  { name: 'Sara', grad: 'from-pink-400 to-rose-600', now: 'Severance' },
  { name: 'Marta', grad: 'from-orange-300 to-amber-600', now: 'Hades' },
];
const avatarGrad = (who: string) => FRIENDS.find(f => f.name === who)?.grad ?? 'from-emerald-300 to-teal-600';

const GLOBAL_CSS = `
.trk[data-theme=dark] {
  --bg:#09090b; --surface:#18181b; --surface2:#27272a; --sunken:#09090b; --line:#27272a; --line-strong:#3f3f46;
  --fg:#fafafa; --muted:#a1a1aa; --subtle:#71717a; --inv-bg:#f4f4f5; --inv-fg:#09090b;
  --movie:#fbbf24; --series:#a78bfa; --game:#34d399; color-scheme: dark;
}
.trk[data-theme=light] {
  --bg:#f5f5f4; --surface:#ffffff; --surface2:#ececea; --sunken:#fafaf9; --line:#e4e4e7; --line-strong:#d4d4d8;
  --fg:#18181b; --muted:#52525b; --subtle:#71717a; --inv-bg:#18181b; --inv-fg:#fafafa;
  --movie:#b45309; --series:#6d28d9; --game:#047857; color-scheme: light;
}
.trk { background: var(--bg); color: var(--fg); }
.bg-app { background: var(--bg); } .bg-surface { background: var(--surface); } .bg-surface2 { background: var(--surface2); }
.bg-sunken { background: var(--sunken); } .bg-app-blur { background: color-mix(in srgb, var(--bg) 82%, transparent); }
.bg-invert { background: var(--inv-bg); color: var(--inv-fg); } .bg-invert:hover { opacity: .92; }
.border-line { border-color: var(--line); } .border-strong { border-color: var(--line-strong); }
.text-fg { color: var(--fg); } .text-muted { color: var(--muted); } .text-subtle { color: var(--subtle); }
.hov-surface:hover { background: var(--surface); } .hov-surface2:hover { background: var(--surface2); }
.hov-fg:hover { color: var(--fg); } .hov-strong:hover { border-color: var(--line-strong); }
.trk input::placeholder, .trk textarea::placeholder { color: var(--subtle); }
.tx-movie { color: var(--movie); } .tx-series { color: var(--series); } .tx-game { color: var(--game); }
.soft-movie { background: rgba(245,158,11,.14); } .soft-series { background: rgba(139,92,246,.14); } .soft-game { background: rgba(16,185,129,.14); }
.bd-movie { border-color: rgba(245,158,11,.45); } .bd-series { border-color: rgba(139,92,246,.45); } .bd-game { border-color: rgba(16,185,129,.45); }
@keyframes trk-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes trk-up { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: none } }
@keyframes trk-pop { 0% { opacity: 0; transform: scale(.85) } 60% { transform: scale(1.03) } 100% { opacity: 1; transform: scale(1) } }
@keyframes trk-confetti { 0% { transform: translate3d(0,-10vh,0) rotate(0deg) } 100% { transform: translate3d(var(--dx),110vh,0) rotate(900deg) } }
@keyframes trk-bump { 0% { transform: scale(1) } 40% { transform: scale(1.4) } 100% { transform: scale(1) } }
.trk-scroll::-webkit-scrollbar { display: none }
.trk-scroll { scrollbar-width: none }
.trk-range { accent-color: var(--trk-accent); }
`;

/* ============================================================================
 * 4. MOCK DE ALTA FIDELIDADE
 * ========================================================================== */

const TMDB_IMG = 'https://image.tmdb.org/t/p';
const tmdbPoster = (p: string) => `${TMDB_IMG}/w500${p}`;
const rawgImg = (p: string) => `https://media.rawg.io/media/games/${p}.jpg`;
const NOW = Date.now();
const HOUR = 36e5;
const DAY = 24 * HOUR;

const MOCK_LIBRARY: TrackrItem[] = [
  {
    id: 'm1', apiSource: 'local_mock', title: 'Dune: Part Two', type: 'movie', year: 2024,
    coverUrl: tmdbPoster('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'), genres: ['Ficção Científica', 'Aventura'],
    rating: 4.1, myRating: 5, myStatus: 'completed', metaDuration: '2h 46min', platforms: ['Max', 'Prime Video'],
    summary: 'Paul Atreides une-se a Chani e aos Fremen numa guerra de vingança contra os conspiradores que destruíram a sua família. Perante uma escolha entre o amor da sua vida e o destino do universo, tenta evitar um futuro terrível que só ele consegue prever.',
    likedByFriends: ['Diogo', 'Sara'], progress: 166, progressTotal: 166,
  },
  {
    id: 'm2', apiSource: 'local_mock', title: 'Interstellar', type: 'movie', year: 2014,
    coverUrl: tmdbPoster('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'), genres: ['Ficção Científica', 'Drama'],
    rating: 4.2, myRating: 5, myStatus: 'completed', metaDuration: '2h 49min', platforms: ['Netflix', 'Prime Video'],
    summary: 'Numa Terra a morrer, um grupo de exploradores atravessa um buraco de minhoca perto de Saturno em busca de um novo lar para a humanidade, enfrentando o tempo, a gravidade e a distância que os separa de quem amam.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progress: 169, progressTotal: 169,
  },
  {
    id: 'm3', apiSource: 'local_mock', title: 'Oppenheimer', type: 'movie', year: 2023,
    coverUrl: tmdbPoster('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'), genres: ['Drama', 'História'],
    rating: 4.0, myStatus: 'backlog', metaDuration: '3h 00min', platforms: ['Prime Video'],
    summary: 'A história de J. Robert Oppenheimer e do seu papel no desenvolvimento da bomba atómica durante a Segunda Guerra Mundial — e do preço moral que se seguiu.',
    likedByFriends: ['Marta', 'Diogo'], progressTotal: 180,
  },
  {
    id: 'm4', apiSource: 'local_mock', title: 'Spider-Man: Across the Spider-Verse', type: 'movie', year: 2023,
    coverUrl: tmdbPoster('/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'), genres: ['Animação', 'Ação'],
    rating: 4.2, myStatus: 'backlog', metaDuration: '2h 20min', platforms: ['Netflix'],
    summary: 'Miles Morales atravessa o Multiverso e encontra uma equipa de Homens-Aranha encarregada de proteger a sua própria existência. Quando discordam sobre como lidar com uma nova ameaça, Miles terá de redefinir o que é ser herói.',
    likedByFriends: ['Sara', 'Marta', 'Diogo'], progressTotal: 140,
  },
  {
    id: 'm5', apiSource: 'local_mock', title: 'Everything Everywhere All at Once', type: 'movie', year: 2022,
    coverUrl: tmdbPoster('/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg'), genres: ['Ação', 'Comédia'],
    rating: 3.9, myStatus: 'in_progress', metaDuration: '2h 19min', platforms: ['Prime Video'],
    summary: 'Uma imigrante sobrecarregada vê-se arrastada para uma aventura insana em que só ela pode salvar o mundo, explorando outros universos e as vidas que poderia ter vivido.',
    likedByFriends: ['Sara'], progress: 62, progressTotal: 139,
  },
  {
    id: 'm6', apiSource: 'local_mock', title: 'Your Name.', type: 'movie', year: 2016,
    coverUrl: tmdbPoster('/q719jXXEzOoYaps6babgKnONONX.jpg'), genres: ['Animação', 'Romance'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '1h 46min', platforms: ['Netflix'],
    summary: 'Dois adolescentes que nunca se conheceram descobrem que trocam de corpo enquanto dormem. Uma ligação improvável que atravessa tempo e distância.',
    likedByFriends: ['Marta', 'Sara'], progressTotal: 106,
  },
  {
    id: 's1', apiSource: 'local_mock', title: 'Succession', type: 'series', year: 2018,
    coverUrl: tmdbPoster('/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg'), genres: ['Drama', 'Comédia'],
    rating: 4.3, myRating: 4, myStatus: 'completed', metaDuration: '4 temporadas · 39 ep', platforms: ['Max'],
    summary: 'A família Roy controla um dos maiores impérios de media do mundo. Quando o patriarca começa a afastar-se, os filhos disputam o trono com tudo o que têm — e não têm.',
    likedByFriends: ['Sara', 'Diogo'], progress: 39, progressTotal: 39,
  },
  {
    id: 's2', apiSource: 'local_mock', title: 'Severance', type: 'series', year: 2022,
    coverUrl: tmdbPoster('/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg'), genres: ['Mistério', 'Ficção Científica'],
    rating: 4.2, myRating: 5, myStatus: 'in_progress', metaDuration: '2 temporadas · 19 ep', platforms: ['Apple TV+'],
    summary: 'Mark lidera uma equipa de funcionários cujas memórias foram cirurgicamente divididas entre o trabalho e a vida pessoal. Quando um colega misterioso aparece fora do escritório, começa uma viagem para descobrir a verdade.',
    likedByFriends: ['Sara', 'Marta'], progress: 12, progressTotal: 19,
  },
  {
    id: 's3', apiSource: 'local_mock', title: 'The Last of Us', type: 'series', year: 2023,
    coverUrl: tmdbPoster('/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg'), genres: ['Drama', 'Ação'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '2 temporadas · 16 ep', platforms: ['Max'],
    summary: 'Vinte anos após o colapso da civilização, Joel é contratado para tirar Ellie, uma rapariga de 14 anos, de uma zona de quarentena opressiva. O que começa como um pequeno trabalho torna-se numa viagem brutal.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progressTotal: 16,
  },
  {
    id: 's4', apiSource: 'local_mock', title: 'Arcane', type: 'series', year: 2021,
    coverUrl: tmdbPoster('/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg'), genres: ['Animação', 'Ação'],
    rating: 4.4, myStatus: 'in_progress', metaDuration: '2 temporadas · 18 ep', platforms: ['Netflix'],
    summary: 'Entre a utópica Piltover e a oprimida Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções em choque.',
    likedByFriends: ['Diogo', 'Marta'], progress: 6, progressTotal: 18,
  },
  {
    id: 's5', apiSource: 'local_mock', title: 'Shōgun', type: 'series', year: 2024,
    coverUrl: tmdbPoster('/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg'), genres: ['Drama', 'História'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '1 temporada · 10 ep', platforms: ['Disney+'],
    summary: 'Japão, 1600. Lord Yoshii Toranaga luta pela sua vida enquanto os seus inimigos no Conselho de Regentes se unem contra ele — até um navio europeu misterioso naufragar numa aldeia piscatória próxima.',
    likedByFriends: ['Diogo'], progressTotal: 10,
  },
  {
    id: 's6', apiSource: 'local_mock', title: 'The Bear', type: 'series', year: 2022,
    coverUrl: tmdbPoster('/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg'), genres: ['Drama', 'Comédia'],
    rating: 4.1, myStatus: 'backlog', metaDuration: '3 temporadas · 28 ep', platforms: ['Disney+'],
    summary: 'Um jovem chef do mundo da alta cozinha regressa a Chicago para gerir a sanduicheria da família depois de uma tragédia.',
    likedByFriends: ['Sara', 'Marta'], progressTotal: 28,
  },
  {
    id: 's7', apiSource: 'local_mock', title: 'Breaking Bad', type: 'series', year: 2008,
    coverUrl: tmdbPoster('/ggFHVNu6YYI5L9pCfOacjizRGt.jpg'), genres: ['Drama', 'Crime'],
    rating: 4.5, myRating: 5, myStatus: 'completed', metaDuration: '5 temporadas · 62 ep', platforms: ['Netflix'],
    summary: 'Um professor de química com cancro terminal alia-se a um antigo aluno para produzir e vender metanfetamina e garantir o futuro da família.',
    likedByFriends: ['Diogo'], progress: 62, progressTotal: 62,
  },
  {
    id: 'g1', apiSource: 'local_mock', title: 'Elden Ring', type: 'game', year: 2022,
    coverUrl: rawgImg('b29/b294fdd866dcdb643e7bab370a552855'), genres: ['RPG', 'Ação', 'Co-op'],
    rating: 4.4, myRating: 5, myStatus: 'in_progress', metaDuration: '~95h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Ergue-te, Maculado, e deixa-te guiar pela graça para empunhares o poder do Anel Prístino e te tornares Senhor Prístino nas Terras Intermédias. Um mundo aberto vasto, masmorras complexas e co-op online.',
    likedByFriends: ['Diogo', 'Marta'], progress: 64, progressTotal: 95,
  },
  {
    id: 'g2', apiSource: 'local_mock', title: "Baldur's Gate 3", type: 'game', year: 2023,
    coverUrl: rawgImg('699/69907ecf13f172e9e144069769c3be73'), genres: ['RPG', 'Estratégia', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~100h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Reúne o teu grupo e regressa aos Reinos Esquecidos numa história de amizade, traição, sacrifício e sobrevivência — com co-op até 4 jogadores e escolhas com peso real.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progressTotal: 100,
  },
  {
    id: 'g3', apiSource: 'local_mock', title: 'It Takes Two', type: 'game', year: 2021,
    coverUrl: rawgImg('d47/d479582ed0a46496ad34f65c7099d7e5'), genres: ['Aventura', 'Plataformas', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~14h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Uma aventura de plataformas feita exclusivamente para dois jogadores. Cody e May, transformados em bonecos, têm de cooperar para salvar o casamento — e voltar ao normal.',
    likedByFriends: ['Sara', 'Marta'], progressTotal: 14,
  },
  {
    id: 'g4', apiSource: 'local_mock', title: 'Portal 2', type: 'game', year: 2011,
    coverUrl: rawgImg('2ba/2bac0e87cf45e5b508f227d281c9252a'), genres: ['Puzzle', 'Co-op'],
    rating: 4.6, myRating: 5, myStatus: 'completed', metaDuration: '~11h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Regressa ao Aperture Science com a portal gun, uma IA vingativa e um modo cooperativo dedicado com dois robôs que vai testar qualquer amizade.',
    likedByFriends: ['Diogo'], progress: 11, progressTotal: 11,
  },
  {
    id: 'g5', apiSource: 'local_mock', title: 'Hades', type: 'game', year: 2020,
    coverUrl: rawgImg('1f4/1f47a270b8f241e4676b14d39ec620f7'), genres: ['Roguelike', 'Ação'],
    rating: 4.4, myStatus: 'in_progress', metaDuration: '~22h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Desafia o deus dos mortos enquanto abres caminho para fora do Submundo neste roguelike de ação dos criadores de Bastion e Transistor.',
    likedByFriends: ['Marta'], progress: 9, progressTotal: 22,
  },
  {
    id: 'g6', apiSource: 'local_mock', title: 'The Witcher 3: Wild Hunt', type: 'game', year: 2015,
    coverUrl: rawgImg('618/618c2031a07bbff6b4f611f10b6bcdbc'), genres: ['RPG', 'Aventura'],
    rating: 4.7, myRating: 3, myStatus: 'dropped', metaDuration: '~50h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Geralt de Rívia, caçador de monstros, procura a filha adotiva num mundo aberto devastado pela guerra e perseguido pela Caçada Selvagem.',
    likedByFriends: ['Diogo', 'Sara'], progress: 18, progressTotal: 50,
  },
];

// Catálogo extra pesquisável offline (simula resultados "da web" sem chave)
const MOCK_CATALOG: TrackrItem[] = [
  {
    id: 'c1', apiSource: 'local_mock', title: 'BioShock Infinite', type: 'game', year: 2013,
    coverUrl: rawgImg('fc1/fc1307a2774506b5bd65d7e8424664a7'), genres: ['Ação', 'Shooter'],
    rating: 4.4, myStatus: 'backlog', metaDuration: '~12h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Columbia, uma cidade flutuante nos céus de 1912. Booker DeWitt tem uma dívida para saldar: encontrar Elizabeth.',
    likedByFriends: ['Diogo'], progressTotal: 12,
  },
  {
    id: 'c2', apiSource: 'local_mock', title: 'The Elder Scrolls V: Skyrim', type: 'game', year: 2011,
    coverUrl: rawgImg('7cf/7cfc9220b401b7a300e409e539c9afd5'), genres: ['RPG', 'Aventura'],
    rating: 4.4, myStatus: 'backlog', metaDuration: '~34h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'O regresso dos dragões a Skyrim. És o Dovahkiin, o Sangue de Dragão, a única esperança de uma terra dividida pela guerra civil.',
    likedByFriends: ['Marta'], progressTotal: 34,
  },
  {
    id: 'c3', apiSource: 'local_mock', title: 'Grand Theft Auto V', type: 'game', year: 2013,
    coverUrl: rawgImg('20a/20aa03a10cda45239fe22d035c0ebe64'), genres: ['Ação', 'Mundo Aberto', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~74h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Três criminosos muito diferentes arriscam tudo numa série de golpes ousados em Los Santos.',
    likedByFriends: ['Diogo', 'Sara'], progressTotal: 74,
  },
  {
    id: 'c4', apiSource: 'local_mock', title: 'Elden Ring Nightreign', type: 'game', year: 2025,
    coverUrl: rawgImg('5ec/5ecac5cb026ec26a56efcc546364e348'), genres: ['Ação', 'Co-op'],
    rating: 4.0, myStatus: 'backlog', metaDuration: '~30h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Uma experiência cooperativa independente no universo de Elden Ring para até três jogadores.',
    likedByFriends: [], progressTotal: 30,
  },
];

const zeroReactions = (): Record<Reaction, number> => ({ '🔥': 0, '👏': 0, '🤯': 0 });
const SEED_FEED: FeedEntry[] = [
  { id: 'f1', who: 'Diogo', verb: 'completed', extra: '95h', item: MOCK_LIBRARY[13], rating: 5, ts: NOW - 2 * HOUR, reactions: { '🔥': 12, '👏': 5, '🤯': 2 }, mine: [] },
  { id: 'f2', who: 'Sara', verb: 'added', item: MOCK_LIBRARY[7], ts: NOW - 4 * HOUR, reactions: { '🔥': 3, '👏': 1, '🤯': 6 }, mine: [] },
  { id: 'f3', who: 'Marta', verb: 'playing', item: MOCK_LIBRARY[17], ts: NOW - 6 * HOUR, reactions: { '🔥': 4, '👏': 2, '🤯': 0 }, mine: [] },
  { id: 'f4', who: 'Sara', verb: 'completed', item: MOCK_LIBRARY[6], rating: 4, ts: NOW - 1.2 * DAY, reactions: { '🔥': 7, '👏': 9, '🤯': 1 }, mine: [] },
  { id: 'f5', who: 'Marta', verb: 'super', item: MOCK_LIBRARY[14], ts: NOW - 1.5 * DAY, reactions: { '🔥': 5, '👏': 3, '🤯': 0 }, mine: [] },
  { id: 'f6', who: 'Diogo', verb: 'rated', item: MOCK_LIBRARY[0], rating: 5, ts: NOW - 2.4 * DAY, reactions: { '🔥': 15, '👏': 4, '🤯': 3 }, mine: [] },
];

/* ============================================================================
 * 5. CAMADA DE DADOS — Adaptadores de catálogo + Repositório
 * ========================================================================== */

const TMDB_GENRES: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime', 99: 'Documentário', 18: 'Drama',
  10751: 'Família', 14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção Científica', 53: 'Thriller', 10752: 'Guerra', 37: 'Western',
  10759: 'Ação & Aventura', 10762: 'Infantil', 10763: 'Notícias', 10764: 'Reality', 10765: 'Sci-Fi & Fantasia',
  10766: 'Novela', 10767: 'Talk Show', 10768: 'Guerra & Política',
};

const RAWG_PLATFORMS: Record<string, string> = {
  pc: 'PC', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo',
  mac: 'macOS', linux: 'Linux', ios: 'iOS', android: 'Android',
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const errMsg = (e: unknown) =>
  e instanceof DOMException && e.name === 'AbortError' ? 'timeout' : e instanceof Error ? e.message : 'network error';

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
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

const tmdbAdapter = {
  map(r: any): TrackrItem {
    const isTv = r.media_type === 'tv';
    const date: string | undefined = isTv ? r.first_air_date : r.release_date;
    return {
      id: `tmdb-${r.media_type}-${r.id}`,
      externalId: r.id,
      apiSource: 'tmdb',
      title: (isTv ? r.name : r.title) ?? '—',
      type: isTv ? 'series' : 'movie',
      year: date ? date.slice(0, 4) : '—',
      coverUrl: r.poster_path ? `${TMDB_IMG}/w500${r.poster_path}` : '',
      backdropUrl: r.backdrop_path ? `${TMDB_IMG}/original${r.backdrop_path}` : undefined,
      genres: (r.genre_ids ?? []).map((id: number) => TMDB_GENRES[id]).filter(Boolean).slice(0, 3),
      rating: round1((r.vote_average ?? 0) / 2),
      myStatus: 'backlog',
      metaDuration: isTv ? 'Série' : 'Longa-metragem',
      platforms: [],
      summary: r.overview || '',
      likedByFriends: [],
      progressTotal: isTv ? TYPE_META.series.defaultTotal : TYPE_META.movie.defaultTotal,
    };
  },
  async search(query: string, key: string, lang: Lang): Promise<TrackrItem[]> {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${encodeURIComponent(key)}&language=${lang === 'pt' ? 'pt-PT' : 'en-US'}`;
    const data = await fetchJson(url);
    return (data.results ?? [])
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 12)
      .map(tmdbAdapter.map);
  },
};

const rawgAdapter = {
  map(g: any): TrackrItem {
    const platforms: string[] = Array.from(new Set<string>(
      (g.parent_platforms ?? []).map((p: any) => RAWG_PLATFORMS[p.platform?.slug] ?? p.platform?.name).filter(Boolean),
    ));
    return {
      id: `rawg-${g.id}`,
      externalId: g.id,
      apiSource: 'rawg',
      title: g.name ?? '—',
      type: 'game',
      year: g.released ? String(g.released).slice(0, 4) : 'TBA',
      coverUrl: g.background_image ?? '',
      backdropUrl: g.background_image ?? undefined,
      genres: (g.genres ?? []).map((x: any) => x.name).slice(0, 3),
      rating: round1(g.rating ?? 0),
      myStatus: 'backlog',
      metaDuration: g.playtime ? `~${g.playtime}h` : 'Duração n/d',
      platforms,
      summary: '',
      likedByFriends: [],
      progressTotal: g.playtime || TYPE_META.game.defaultTotal,
    };
  },
  async search(query: string, key: string): Promise<TrackrItem[]> {
    const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}&page_size=12`;
    const data = await fetchJson(url);
    return (data.results ?? []).map(rawgAdapter.map);
  },
};

interface SearchOutcome { items: TrackrItem[]; source: 'remote' | 'mock'; warnings: string[] }

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const MediaRepository = {
  searchLocal(query: string, pool: TrackrItem[]): TrackrItem[] {
    const q = normalize(query);
    return pool.filter(i => normalize(i.title).includes(q) || i.genres.some(g => normalize(g).includes(q)));
  },
  // Nunca rejeita: falhas de rede/CORS/chave caem para o mock local.
  async search(query: string, keys: ApiKeys, pool: TrackrItem[], lang: Lang): Promise<SearchOutcome> {
    const warnings: string[] = [];
    const tasks: Promise<TrackrItem[]>[] = [];
    if (keys.tmdb) tasks.push(tmdbAdapter.search(query, keys.tmdb, lang).catch(e => { warnings.push(`TMDB: ${errMsg(e)}`); return []; }));
    if (keys.rawg) tasks.push(rawgAdapter.search(query, keys.rawg).catch(e => { warnings.push(`RAWG: ${errMsg(e)}`); return []; }));
    const local = MediaRepository.searchLocal(query, pool);
    if (!tasks.length) return { items: local, source: 'mock', warnings };
    const remote = (await Promise.all(tasks)).flat();
    return remote.length ? { items: remote, source: 'remote', warnings } : { items: local, source: 'mock', warnings };
  },
};

/* ============================================================================
 * 6. MOTOR DE SYNC — Trackr <-> Letterboxd / Serializd / Logg
 *    Cada serviço é um adaptador. Hoje: estado remoto simulado + CSV real.
 *    Produção: o mesmo reconcile() corre num backend com tokens OAuth.
 * ========================================================================== */

type SyncDirection = 'two_way' | 'pull' | 'push';
type ConflictPolicy = 'newest' | 'trackr' | 'remote';

interface ProviderDef {
  id: ProviderId;
  name: string;
  domain: string;
  covers: MediaType[];
  mono: string;
  grad: string;
  api: 'official_gated' | 'none';
  csv: 'letterboxd' | 'generic';
}

const PROVIDERS: ProviderDef[] = [
  { id: 'letterboxd', name: 'Letterboxd', domain: 'letterboxd.com', covers: ['movie'], mono: 'Lb', grad: 'from-orange-400 via-emerald-400 to-sky-400', api: 'official_gated', csv: 'letterboxd' },
  { id: 'serializd', name: 'Serializd', domain: 'serializd.com', covers: ['series'], mono: 'Sz', grad: 'from-violet-500 to-fuchsia-500', api: 'none', csv: 'generic' },
  { id: 'logg', name: 'Logg', domain: 'Logg: Game Tracker', covers: ['game'], mono: 'Lg', grad: 'from-emerald-400 to-cyan-500', api: 'none', csv: 'generic' },
];

interface Connection {
  username: string;
  connectedAt: number;
  lastSync?: number;
  direction: SyncDirection;
  conflict: ConflictPolicy;
  auto: boolean;
}

interface RemoteEntry {
  title: string;
  year: number | string;
  type: MediaType;
  status: MediaStatus;
  rating?: number;
  updatedAt: number;
}

interface SyncReport {
  provider: ProviderId;
  at: number;
  pulled: string[];
  updated: string[];
  pushed: string[];
  conflicts: string[];
}

const seedRemote = (): Record<ProviderId, RemoteEntry[]> => ({
  letterboxd: [
    { title: 'Dune: Part Two', year: 2024, type: 'movie', status: 'completed', rating: 5, updatedAt: NOW - 40 * DAY },
    { title: 'Interstellar', year: 2014, type: 'movie', status: 'completed', rating: 5, updatedAt: NOW - 300 * DAY },
    { title: 'Oppenheimer', year: 2023, type: 'movie', status: 'completed', rating: 4, updatedAt: NOW - 3 * DAY },
    { title: 'Past Lives', year: 2023, type: 'movie', status: 'completed', rating: 5, updatedAt: NOW - 12 * DAY },
    { title: 'Aftersun', year: 2022, type: 'movie', status: 'backlog', updatedAt: NOW - 5 * DAY },
    { title: 'Perfect Days', year: 2023, type: 'movie', status: 'backlog', updatedAt: NOW - 8 * DAY },
  ],
  serializd: [
    { title: 'Succession', year: 2018, type: 'series', status: 'completed', rating: 4, updatedAt: NOW - 90 * DAY },
    { title: 'Shōgun', year: 2024, type: 'series', status: 'completed', rating: 5, updatedAt: NOW - 2 * DAY },
    { title: 'Fleabag', year: 2016, type: 'series', status: 'completed', rating: 5, updatedAt: NOW - 10 * DAY },
    { title: 'Twin Peaks', year: 1990, type: 'series', status: 'backlog', updatedAt: NOW - 20 * DAY },
  ],
  logg: [
    { title: 'Elden Ring', year: 2022, type: 'game', status: 'in_progress', rating: 5, updatedAt: NOW - 30 * DAY },
    { title: 'Portal 2', year: 2011, type: 'game', status: 'completed', rating: 5, updatedAt: NOW - 400 * DAY },
    { title: 'Hollow Knight', year: 2017, type: 'game', status: 'completed', rating: 5, updatedAt: NOW - 15 * DAY },
    { title: 'Celeste', year: 2018, type: 'game', status: 'backlog', updatedAt: NOW - 6 * DAY },
  ],
});

const libKey = (i: { type: MediaType; title: string }) => `${i.type}:${normalize(i.title)}`;

const fromRemote = (r: RemoteEntry, p: ProviderId, at: number): TrackrItem => ({
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
  progressTotal: TYPE_META[r.type].defaultTotal,
  updatedAt: r.updatedAt,
  links: { [p]: at },
});

const toRemote = (i: TrackrItem, at: number): RemoteEntry => ({
  title: i.title, year: i.year, type: i.type, status: i.myStatus, rating: i.myRating, updatedAt: at,
});

/** Reconciliação pura: devolve o novo estado local, o novo estado remoto e o relatório. */
function reconcile(local: TrackrItem[], remote: RemoteEntry[], p: ProviderDef, conn: Connection, at: number) {
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
    if (lt > since && r.updatedAt > since && since > 0) {
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

/* ---------- CSV real ---------- */

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter(r => r.some(x => x.trim()));
  if (!header) return [];
  const keys = header.map(h => h.trim().replace(/^﻿/, ''));
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

const VALID_STATUS: MediaStatus[] = ['backlog', 'in_progress', 'completed', 'dropped'];

/** Importa ficheiros CSV (export do Letterboxd ou formato genérico TRACKR) para a biblioteca. */
function importCsvFiles(files: { name: string; text: string }[], items: TrackrItem[], p: ProviderDef, at: number) {
  const next = [...items];
  let added = 0;
  let updated = 0;
  for (const f of files) {
    const fname = f.name.toLowerCase();
    for (const row of parseCsv(f.text)) {
      const title = row.Name ?? row.Title ?? row.title ?? row.name;
      if (!title) continue;
      const rowType = row.Type as MediaType;
      const type: MediaType = ['movie', 'series', 'game'].includes(rowType) ? rowType : p.covers[0];
      const status: MediaStatus = VALID_STATUS.includes(row.Status as MediaStatus) ? row.Status as MediaStatus
        : fname.includes('watchlist') ? 'backlog'
        : p.csv === 'letterboxd' ? 'completed' : 'backlog';
      const rawRating = parseFloat(row.Rating ?? row.rating ?? '');
      const rating = Number.isFinite(rawRating) && rawRating > 0 ? Math.max(1, Math.round(rawRating)) : undefined;
      const year = row.Year ?? row.year ?? '';
      const idx = next.findIndex(i => libKey(i) === libKey({ type, title }) && (!year || !i.year || String(i.year) === year));
      if (idx >= 0) {
        const cur = next[idx];
        const keepCompleted = cur.myStatus === 'completed' && status === 'backlog';
        next[idx] = {
          ...cur, myStatus: keepCompleted ? cur.myStatus : status, myRating: rating ?? cur.myRating,
          updatedAt: at, links: { ...cur.links, [p.id]: at },
        };
        updated++;
      } else {
        next.unshift(fromRemote({ title, year: year || '—', type, status, rating, updatedAt: at }, p.id, at));
        added++;
      }
    }
  }
  return { items: next, added, updated };
}

function buildExport(items: TrackrItem[], p: ProviderDef, kind: 'watched' | 'watchlist') {
  const own = items.filter(i => p.covers.includes(i.type));
  const stamp = new Date().toISOString().slice(0, 10);
  if (p.csv === 'letterboxd') {
    // Formato aceite pelo importador do Letterboxd (letterboxd.com/import)
    if (kind === 'watchlist') {
      const rows = own.filter(i => i.myStatus === 'backlog').map(i => [i.title, i.year]);
      return { filename: `trackr-letterboxd-watchlist-${stamp}.csv`, content: toCsv(['Title', 'Year'], rows) };
    }
    const rows = own.filter(i => i.myStatus === 'completed')
      .map(i => [i.title, i.year, i.myRating ?? '', new Date(i.updatedAt ?? NOW).toISOString().slice(0, 10), i.notes ?? '']);
    return { filename: `trackr-letterboxd-watched-${stamp}.csv`, content: toCsv(['Title', 'Year', 'Rating', 'WatchedDate', 'Review'], rows) };
  }
  const rows = own.map(i => [i.title, i.year, i.type, i.myStatus, i.myRating ?? '', i.progress ?? '', i.notes ?? '']);
  return { filename: `trackr-${p.id}-${stamp}.csv`, content: toCsv(['Title', 'Year', 'Type', 'Status', 'Rating', 'Progress', 'Notes'], rows) };
}

/* ============================================================================
 * 7. HOOKS & UTILITÁRIOS
 * ========================================================================== */

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch { /* storage indisponível: estado de sessão */ }
  return fallback;
}
function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fica só em memória */ }
}

const LS = { keys: 'trackr.apiKeys.v1', prefs: 'trackr.prefs.v1', conns: 'trackr.connections.v1' };

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function useMediaSearch(query: string, keys: ApiKeys, pool: TrackrItem[]) {
  const { lang } = useI18n();
  const debounced = useDebounced(query.trim(), 400);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debounced.length < 2) { setOutcome(null); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    MediaRepository.search(debounced, keys, pool, lang).then(r => {
      if (!cancelled) { setOutcome(r); setIsLoading(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, keys.tmdb, keys.rawg, lang]);

  return { outcome, isLoading: isLoading || query.trim() !== debounced, debounced };
}

function useSystemDark() {
  const query = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const [dark, setDark] = useState(query);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const h = () => setDark(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  return dark;
}

const startWhere = (i: TrackrItem) =>
  i.type === 'game' ? (i.platforms.includes('PC') ? 'Steam' : i.platforms[0] ?? '—') : i.platforms[0] ?? 'streaming';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

const summaryOf = (i: TrackrItem, lang: Lang, t: TFn) =>
  (lang === 'en' ? SUMMARY_EN[i.title] : undefined) ?? (i.summary || (i.apiSource === 'rawg' ? t('rawg_summary') : t('no_summary')));

/* ============================================================================
 * 8. COMPONENTES BASE
 * ========================================================================== */

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative w-9 h-9 rounded-xl bg-surface border border-strong flex items-center justify-center shrink-0">
        <Crosshair size={20} className="text-fg" strokeWidth={1.75} />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      {!compact && <span className="text-lg font-black tracking-widest">TRACK<span className="tx-game">R</span></span>}
    </div>
  );
}

function Poster({ item, className = '' }: { item: Pick<TrackrItem, 'title' | 'type' | 'coverUrl'>; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.coverUrl]);
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  if (!item.coverUrl || failed) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center bg-gradient-to-br ${meta.fallback} ${className}`}>
        <Icon size={28} className="text-white/70" />
        <span className="text-xs font-semibold text-white/90">{item.title}</span>
      </div>
    );
  }
  return (
    <img
      src={item.coverUrl} alt={item.title} loading="lazy" draggable={false}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

/** variant 'image' = sobre poster (sempre escuro); 'surface' = sobre fundo do tema; 'solid' = preenchido */
function TypeBadge({ type, variant = 'image', compact = false }: { type: MediaType; variant?: 'image' | 'surface' | 'solid'; compact?: boolean }) {
  const { t } = useI18n();
  const m = TYPE_META[type];
  const Icon = m.icon;
  const cls = variant === 'solid' ? `${m.solid} text-zinc-950 border-transparent`
    : variant === 'surface' ? `${m.soft} ${m.tx} ${m.bd}`
    : `bg-zinc-950/60 ${m.onImage} border-white/10`;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md border ${cls}`}>
      <Icon size={12} /> {!compact && t(`type_${type}` as StrKey)}
    </span>
  );
}

function StarRating({ value = 0, onChange, size = 14 }: { value?: number; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" disabled={!onChange} aria-label={`${n}/5`}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={e => { e.stopPropagation(); onChange?.(n === value ? 0 : n); }}
          className={`p-0.5 transition-transform ${onChange ? 'hover:scale-125 active:scale-90' : 'cursor-default'}`}
        >
          <Star size={size} className={n <= shown ? 'text-yellow-400' : 'text-subtle'} fill={n <= shown ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function Avatar({ who, size = 36, ring = false, dot = false }: { who: string; size?: number; ring?: boolean; dot?: boolean }) {
  const { t } = useI18n();
  const label = who === 'me' ? t('you') : who;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br ${avatarGrad(who)} flex items-center justify-center font-bold text-white`}
        style={{ fontSize: size * 0.4, boxShadow: ring ? '0 0 0 2px var(--bg), 0 0 0 4px #34d399' : '0 0 0 2px var(--bg)' }}
      >
        {label[0]}
      </div>
      {dot && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 0 2px var(--bg)' }} />}
    </div>
  );
}

function Pill({ active, onClick, children, accent }: { active: boolean; onClick: () => void; children: React.ReactNode; accent?: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
        active ? `${accent ?? 'bg-invert'} border-transparent shadow-lg` : 'bg-surface text-muted border-line hov-strong hov-fg'}`}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; icon?: typeof Film }[] }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-sunken border border-line gap-1 flex-wrap">
      {options.map(o => (
        <button
          key={o.id} onClick={() => onChange(o.id)}
          className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
            value === o.id ? 'bg-surface2 text-fg shadow' : 'text-muted hov-fg'}`}
        >
          {o.icon && <o.icon size={14} />}{o.label}
        </button>
      ))}
    </div>
  );
}

function Sheet({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div data-trk-modal className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm" style={{ animation: 'trk-fade .2s ease-out' }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`relative w-full ${wide ? 'md:max-w-3xl' : 'md:max-w-xl'} bg-surface border border-line rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
        style={{ maxHeight: '92vh', animation: 'trk-up .28s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div className="md:hidden flex justify-center pt-2 pb-1"><span className="w-10 h-1 rounded-full bg-surface2" /></div>
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ title, onClose }: { title: React.ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center shrink-0" aria-label={t('close')}><X size={16} /></button>
    </div>
  );
}

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-subtle font-semibold">{children}</p>
);

/* ============================================================================
 * 9. CARD DE MEDIA
 * ========================================================================== */

function MediaCard({ item, onOpen, onRate }: { item: TrackrItem; onOpen: () => void; onRate: (v: number) => void }) {
  const { t, lang } = useI18n();
  const m = TYPE_META[item.type];
  const pct = item.progressTotal ? Math.min(100, ((item.progress ?? 0) / item.progressTotal) * 100) : 0;
  const synced = Object.keys(item.links ?? {}).length > 0;
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => { if (e.key === 'Enter') onOpen(); }} className="group text-left cursor-pointer outline-none">
      <div
        className="relative rounded-2xl overflow-hidden bg-surface border border-line transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-active:scale-95"
        style={{ aspectRatio: '2 / 3' }}
      >
        <Poster item={item} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
        <div className="absolute top-2 left-2"><TypeBadge type={item.type} compact /></div>
        <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-950/60 backdrop-blur-md border border-white/10 text-zinc-100">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.myStatus]}`} />
          <span className="hidden sm:inline">{statusLabel(item.myStatus, item.type, t)}</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-zinc-200">
          <span className="inline-flex items-center gap-1">
            {item.rating > 0 && <><Star size={12} className="text-yellow-400" fill="currentColor" />{item.rating.toFixed(1)}</>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {synced && <RefreshCw size={11} className="text-emerald-300" />}
            <Clock size={12} />{tDuration(item.metaDuration.split(' · ')[0], lang)}
          </span>
        </div>
        {item.myStatus === 'in_progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div className={`h-full ${m.solid}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="font-semibold text-sm truncate">{item.title}</h3>
        <p className="text-xs text-subtle">{item.year} · {item.genres[0] ? tGenre(item.genres[0], lang) : t(`type_${item.type}` as StrKey)}</p>
        <div className="mt-1 -ml-0.5"><StarRating value={item.myRating} onChange={onRate} size={15} /></div>
        {item.platforms.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.platforms.slice(0, 3).map(p => (
              <span key={p} className="px-1.5 py-0.5 rounded-md text-xs bg-surface border border-line text-muted">{p}</span>
            ))}
            {item.platforms.length > 3 && <span className="px-1.5 py-0.5 text-xs text-subtle">+{item.platforms.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * 10. VISTA 1 — O MEU TRACKR
 * ========================================================================== */

type CatFilter = 'all' | MediaType;
type StatusFilter = 'all' | MediaStatus;

function HubView({ items, keys, searchRef, onOpen, onRate, onAdd, onOpenAdd }: {
  items: TrackrItem[]; keys: ApiKeys; searchRef: React.RefObject<HTMLInputElement>;
  onOpen: (id: TrackrItem['id']) => void; onRate: (id: TrackrItem['id'], v: number) => void;
  onAdd: (i: TrackrItem) => void; onOpenAdd: () => void;
}) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<CatFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const { outcome, isLoading, debounced } = useMediaSearch(query, keys, MOCK_CATALOG);

  const owned = useMemo(() => new Set(items.map(libKey)), [items]);
  const visible = useMemo(() => {
    const q = normalize(query);
    return items.filter(i =>
      (cat === 'all' || i.type === cat) &&
      (status === 'all' || i.myStatus === status) &&
      (!q || normalize(i.title).includes(q) || i.genres.some(g => normalize(g).includes(q) || normalize(tGenre(g, lang)).includes(q))));
  }, [items, cat, status, query, lang]);
  const discover = (outcome?.items ?? []).filter(i => !owned.has(libKey(i)));

  const count = (c: CatFilter) => items.filter(i => c === 'all' || i.type === c).length;
  const hours = items.filter(i => i.type === 'game').reduce((s, i) => s + (i.progress ?? 0), 0);
  const eps = items.filter(i => i.type === 'series').reduce((s, i) => s + (i.progress ?? 0), 0);

  const catPills: { id: CatFilter; label: string; accent?: string; icon?: typeof Film }[] = [
    { id: 'all', label: t('cat_all') },
    { id: 'movie', label: t('types_movie'), accent: 'bg-amber-500 text-zinc-950', icon: Film },
    { id: 'series', label: t('types_series'), accent: 'bg-violet-500 text-white', icon: Tv },
    { id: 'game', label: t('types_game'), accent: 'bg-emerald-500 text-zinc-950', icon: Gamepad2 },
  ];
  const statusText = (s: StatusFilter) => {
    if (s === 'all') return t('any_status');
    if (s === 'in_progress') return cat === 'game' ? t('st_progress_play') : cat === 'all' ? t('st_progress_all') : t('st_progress_watch');
    if (s === 'backlog') return cat === 'all' ? t('st_backlog_all') : `${t('st_backlog')} (${cat === 'game' ? t('st_backlog_play') : t('st_backlog_watch')})`;
    return s === 'completed' ? t('st_completed_pl') : t('st_dropped_pl');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <Kicker>{t('hub_kicker')}</Kicker>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">{t('nav_hub')}</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search_ph')}
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface border border-line text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hov-fg" aria-label={t('clear')}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              </button>
            )}
            {!query && <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 rounded border border-strong text-xs text-subtle">/</kbd>}
          </div>
          <button onClick={onOpenAdd} className="h-11 px-4 rounded-xl bg-invert font-semibold text-sm inline-flex items-center gap-1.5 active:scale-95 transition-all shrink-0">
            <Plus size={18} /> <span className="hidden sm:inline">{t('track_item')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('stat_total'), value: items.length, icon: LayoutGrid, cls: 'text-fg' },
          { label: t('stat_completed'), value: items.filter(i => i.myStatus === 'completed').length, icon: Check, cls: 'tx-game' },
          { label: t('stat_eps'), value: eps, icon: Tv, cls: 'tx-series' },
          { label: t('stat_hours'), value: `${hours}h`, icon: Gamepad2, cls: 'tx-game' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-surface border border-line p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center shrink-0"><s.icon size={18} className={s.cls} /></div>
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-subtle mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto trk-scroll -mx-4 px-4 md:mx-0 md:px-0">
          {catPills.map(p => (
            <Pill key={p.id} active={cat === p.id} onClick={() => setCat(p.id)} accent={p.accent}>
              {p.icon && <p.icon size={15} />} {p.label}
              <span className="text-xs opacity-60">{count(p.id)}</span>
            </Pill>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto trk-scroll -mx-4 px-4 md:mx-0 md:px-0">
          {(['all', 'in_progress', 'backlog', 'completed', 'dropped'] as StatusFilter[]).map(s => (
            <button
              key={s} onClick={() => setStatus(s)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s ? 'bg-surface2 text-fg' : 'text-subtle hov-fg'}`}
            >
              {s !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />}
              {statusText(s)}
            </button>
          ))}
        </div>
      </div>

      {debounced.length >= 2 && (
        <section className="rounded-2xl bg-surface border border-line p-4" style={{ animation: 'trk-fade .25s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" /> {t('discover')}
              <span className="text-xs font-normal text-subtle">· {outcome?.source === 'remote' ? t('src_live') : t('src_local')}</span>
            </h2>
            {isLoading && <Loader2 size={16} className="animate-spin text-subtle" />}
          </div>
          {outcome?.warnings.length ? (
            <p className="mb-3 text-xs tx-movie inline-flex items-center gap-1.5">
              <AlertCircle size={14} /> {outcome.warnings.join(' · ')} — {t('using_local')}
            </p>
          ) : null}
          {!isLoading && discover.length === 0 ? (
            <p className="text-sm text-subtle">{t('nothing_new', { q: debounced })}</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto trk-scroll pb-1">
              {discover.map(i => (
                <div key={i.id} className="w-28 shrink-0">
                  <div className="relative rounded-xl overflow-hidden bg-surface2" style={{ aspectRatio: '2 / 3' }}>
                    <Poster item={i} />
                    <div className="absolute top-1.5 left-1.5"><TypeBadge type={i.type} /></div>
                    <button
                      onClick={() => onAdd(i)} aria-label={`${t('add_short')} ${i.title}`}
                      className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs font-medium truncate">{i.title}</p>
                  <p className="text-xs text-subtle">{i.year}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {visible.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-6">
          {visible.map(i => <MediaCard key={i.id} item={i} onOpen={() => onOpen(i.id)} onRate={v => onRate(i.id, v)} />)}
        </div>
      ) : (
        <div className="py-16 text-center text-subtle">
          <LayoutGrid size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-fg">{t('empty_title')}</p>
          <p className="text-sm">{t('empty_body')}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 11. MODAL — ADICIONAR
 * ========================================================================== */

function AddModal({ items, keys, onAdd, onClose }: { items: TrackrItem[]; keys: ApiKeys; onAdd: (i: TrackrItem) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const { outcome, isLoading, debounced } = useMediaSearch(query, keys, MOCK_CATALOG);
  const owned = useMemo(() => new Set(items.map(libKey)), [items]);
  const results = debounced.length >= 2 ? outcome?.items ?? [] : MOCK_CATALOG;
  const live = !!(keys.tmdb || keys.rawg);

  return (
    <Sheet onClose={onClose}>
      <div className="p-5 pb-3 border-b border-line space-y-4">
        <SheetHeader title={t('track_item')} onClose={onClose} />
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={t('add_ph')}
            className="w-full h-12 pl-10 pr-10 rounded-xl bg-sunken border border-line focus:outline-none focus:border-zinc-500"
          />
          {isLoading && debounced.length >= 2 && <Loader2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-subtle" />}
        </div>
        <div>
          <p className="text-xs text-subtle inline-flex items-center gap-1.5">
            {live ? <Wifi size={12} className="tx-game" /> : <WifiOff size={12} />}
            {live ? t('live_search', { s: [keys.tmdb && 'TMDB', keys.rawg && 'RAWG'].filter(Boolean).join(' + ') }) : t('mock_hint')}
          </p>
          {outcome?.warnings.length ? <p className="mt-1 text-xs tx-movie">{outcome.warnings.join(' · ')} — {t('using_local')}</p> : null}
        </div>
      </div>
      <div className="overflow-y-auto p-3 space-y-1">
        {debounced.length < 2 && <div className="px-2 pt-1 pb-2"><Kicker>{t('suggestions')}</Kicker></div>}
        {results.length === 0 && !isLoading && <p className="p-6 text-center text-sm text-subtle">{t('no_results', { q: debounced })}</p>}
        {results.map(i => {
          const has = owned.has(libKey(i));
          return (
            <div key={i.id} className="flex items-center gap-3 p-2 rounded-xl hov-surface2 transition-colors">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface2 shrink-0"><Poster item={i} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{i.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TypeBadge type={i.type} variant="surface" />
                  <span className="text-xs text-subtle">{i.year}</span>
                  {i.rating > 0 && <span className="text-xs text-subtle inline-flex items-center gap-0.5"><Star size={11} className="text-yellow-400" fill="currentColor" />{i.rating.toFixed(1)}</span>}
                </div>
              </div>
              <button
                disabled={has} onClick={() => onAdd(i)}
                className={`shrink-0 h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all active:scale-95 ${has ? 'bg-surface2 tx-game' : 'bg-invert'}`}
              >
                {has ? <><Check size={14} /> {t('in_trackr')}</> : <><Plus size={14} /> <span className="hidden sm:inline">{t('add_to')}</span><span className="sm:hidden">{t('add_short')}</span></>}
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ============================================================================
 * 12. MODAL — DETALHES
 * ========================================================================== */

function DetailModal({ item, onUpdate, onRemove, onClose }: {
  item: TrackrItem; onUpdate: (patch: Partial<TrackrItem>) => void; onRemove: () => void; onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const m = TYPE_META[item.type];
  const total = item.progressTotal ?? m.defaultTotal;
  const progress = item.progress ?? 0;
  const statuses: MediaStatus[] = ['backlog', 'in_progress', 'completed', 'dropped'];
  const links = Object.keys(item.links ?? {}) as ProviderId[];
  const names = item.likedByFriends.join(', ');

  return (
    <Sheet onClose={onClose} wide>
      <div className="overflow-y-auto">
        <div className="relative h-44 md:h-56 overflow-hidden">
          <div className="absolute inset-0 scale-110" style={{ filter: item.backdropUrl ? 'none' : 'blur(24px) saturate(1.4)' }}>
            <Poster item={{ ...item, coverUrl: item.backdropUrl ?? item.coverUrl }} />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-zinc-950/60 text-white backdrop-blur-md flex items-center justify-center" aria-label={t('close')}><X size={18} /></button>
        </div>

        <div className="px-5 md:px-7 pb-7 -mt-20 relative">
          <div className="flex gap-4 md:gap-6">
            <div className="w-28 md:w-36 shrink-0 rounded-xl overflow-hidden border border-strong shadow-2xl bg-surface2" style={{ aspectRatio: '2 / 3' }}>
              <Poster item={item} />
            </div>
            <div className="pt-16 md:pt-20 min-w-0">
              <TypeBadge type={item.type} variant="solid" />
              <h2 className="mt-2 text-xl md:text-3xl font-black leading-tight">{item.title}</h2>
              <p className="mt-1 text-sm text-muted flex flex-wrap items-center gap-x-2">
                <span>{item.year}</span><span>·</span><span>{tDuration(item.metaDuration, lang)}</span>
                {item.rating > 0 && <><span>·</span><span className="inline-flex items-center gap-1"><Star size={13} className="text-yellow-400" fill="currentColor" />{item.rating.toFixed(1)} / 5</span></>}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {item.genres.map(g => <span key={g} className={`px-2.5 py-1 rounded-full text-xs ${m.soft} ${m.tx}`}>{tGenre(g, lang)}</span>)}
            {item.platforms.map(p => <span key={p} className="px-2.5 py-1 rounded-full text-xs bg-surface2 text-muted">{p}</span>)}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">{summaryOf(item, lang, t)}</p>

          {item.likedByFriends.length > 0 && (
            <div className="mt-4 flex items-center gap-3 text-xs text-muted">
              <div className="flex -space-x-2">{item.likedByFriends.map(f => <Avatar key={f} who={f} size={24} />)}</div>
              {t(item.likedByFriends.length > 1 ? 'friends_have_many' : 'friends_have_one', { names })}
            </div>
          )}

          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <div className="space-y-5">
              <div>
                <div className="mb-2"><Kicker>{t('status')}</Kicker></div>
                <div className="grid grid-cols-2 gap-1.5">
                  {statuses.map(s => (
                    <button
                      key={s} onClick={() => onUpdate({ myStatus: s, ...(s === 'completed' ? { progress: total } : {}) })}
                      className={`h-10 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                        item.myStatus === s ? `${m.soft} ${m.bd} ${m.tx}` : 'bg-sunken border-line text-muted hov-fg'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />{statusLabel(s, item.type, t)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2"><Kicker>{t('my_rating')}</Kicker></div>
                <StarRating value={item.myRating} onChange={v => onUpdate({ myRating: v || undefined })} size={26} />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Kicker>{t(`progress_${item.type}` as StrKey)}</Kicker>
                  <span className={`text-sm font-bold ${m.tx}`}>{progress} / {total} {m.progressUnit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onUpdate({ progress: Math.max(0, progress - 1) })} className="w-9 h-9 rounded-lg bg-surface2 active:scale-90 font-bold">−</button>
                  <input
                    type="range" min={0} max={total} value={progress}
                    onChange={e => {
                      const v = Number(e.target.value);
                      onUpdate({ progress: v, ...(v >= total ? { myStatus: 'completed' as MediaStatus } : v > 0 && item.myStatus === 'backlog' ? { myStatus: 'in_progress' as MediaStatus } : {}) });
                    }}
                    className="trk-range flex-1" style={{ ['--trk-accent' as string]: m.hex } as React.CSSProperties}
                  />
                  <button onClick={() => onUpdate({ progress: Math.min(total, progress + 1) })} className="w-9 h-9 rounded-lg bg-surface2 active:scale-90 font-bold">+</button>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface2 overflow-hidden">
                  <div className={`h-full ${m.solid} transition-all`} style={{ width: `${(progress / total) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2"><Kicker>{t('notes')}</Kicker></div>
                <textarea
                  value={item.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value })} rows={3}
                  placeholder={item.type === 'game' ? t('notes_ph_game') : t('notes_ph')}
                  className="w-full rounded-xl bg-sunken border border-line p-3 text-sm focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line flex flex-wrap gap-3 items-center justify-between text-xs text-subtle">
            <span className="inline-flex items-center gap-2 flex-wrap">
              {t('source')}: {item.apiSource === 'local_mock' ? t('mock_source') : item.apiSource.toUpperCase()}{item.externalId ? ` · #${item.externalId}` : ''}
              {links.length > 0 && (
                <span className="inline-flex items-center gap-1 tx-game">
                  <RefreshCw size={12} /> {t('synced_with')} {links.map(l => PROVIDERS.find(p => p.id === l)?.name).join(', ')}
                </span>
              )}
            </span>
            <button onClick={onRemove} className="inline-flex items-center gap-1.5 text-rose-500"><Trash2 size={14} /> {t('remove')}</button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* ============================================================================
 * 13. VISTA 2 — TRACKR-MATCH
 * ========================================================================== */

type Plan = MediaType;
const PLANS: { id: Plan; key: StrKey; icon: typeof Film; accent: string }[] = [
  { id: 'movie', key: 'plan_movie', icon: Film, accent: 'bg-amber-500 text-zinc-950' },
  { id: 'series', key: 'plan_series', icon: Tv, accent: 'bg-violet-500 text-white' },
  { id: 'game', key: 'plan_game', icon: Gamepad2, accent: 'bg-emerald-500 text-zinc-950' },
];

function MatchView({ items, friends, setFriends, plan, setPlan, votes, onVote, onResetDeck, matches, active }: {
  items: TrackrItem[]; friends: string[]; setFriends: (f: string[]) => void; plan: Plan; setPlan: (p: Plan) => void;
  votes: Record<string, Vote>; onVote: (i: TrackrItem, v: Vote) => void; onResetDeck: () => void;
  matches: TrackrItem[]; active: boolean;
}) {
  const { t, lang } = useI18n();
  const deck = useMemo(() => {
    const social = (i: TrackrItem) => i.likedByFriends.filter(f => friends.includes(f)).length;
    return items
      .filter(i => i.type === plan && (plan !== 'game' || i.genres.includes('Co-op')))
      .filter(i => i.myStatus !== 'completed' && i.myStatus !== 'dropped' && !votes[String(i.id)])
      .sort((a, b) => social(b) - social(a) || b.rating - a.rating);
  }, [items, plan, friends, votes]);

  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [leaving, setLeaving] = useState<Vote | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const top = deck[0];
  const next = deck[1];

  const fling = useCallback((v: Vote) => {
    if (!top || leaving) return;
    setLeaving(v);
    setTimeout(() => {
      onVote(top, v);
      setLeaving(null);
      setDrag({ x: 0, y: 0, dragging: false });
    }, 280);
  }, [top, leaving, onVote]);

  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (isTyping(e.target) || document.querySelector('[data-trk-modal]')) return;
      if (e.key === 'ArrowLeft') fling('pass');
      if (e.key === 'ArrowRight') fling('like');
      if (e.key === 'ArrowUp') { e.preventDefault(); fling('super'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, fling]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving) return;
    origin.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, dragging: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!origin.current) return;
    setDrag({ x: e.clientX - origin.current.x, y: e.clientY - origin.current.y, dragging: true });
  };
  const onPointerUp = () => {
    if (!origin.current) return;
    origin.current = null;
    if (drag.x > 110) fling('like');
    else if (drag.x < -110) fling('pass');
    else if (drag.y < -120) fling('super');
    else setDrag({ x: 0, y: 0, dragging: false });
  };

  const transform = leaving
    ? leaving === 'pass' ? 'translate(-140%, 40px) rotate(-24deg)'
      : leaving === 'like' ? 'translate(140%, 40px) rotate(24deg)'
      : 'translate(0, -140%) scale(.9)'
    : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`;

  const present = top ? top.likedByFriends.filter(f => friends.includes(f)) : [];
  const clamp = (n: number) => Math.max(0, Math.min(1, n));

  return (
    <div className="space-y-5">
      <div>
        <Kicker>{t('match_kicker')}</Kicker>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight">Trackr<span className="tx-game">Match</span></h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl bg-surface border border-line p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {FRIENDS.map(f => {
                  const on = friends.includes(f.name);
                  return (
                    <button
                      key={f.name} onClick={() => setFriends(on ? friends.filter(x => x !== f.name) : [...friends, f.name])}
                      className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${on ? '' : 'opacity-40 grayscale'}`}
                    >
                      <Avatar who={f.name} size={44} ring={on} dot={on} />
                      <span className="text-xs font-medium">{f.name}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-subtle text-right">{friends.length ? t('in_session', { n: friends.length + 1 }) : t('pick_tribe')}</span>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">{t('plan_q')}</p>
              <div className="flex gap-2 overflow-x-auto trk-scroll">
                {PLANS.map(p => <Pill key={p.id} active={plan === p.id} onClick={() => setPlan(p.id)} accent={p.accent}><p.icon size={15} />{t(p.key)}</Pill>)}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm" style={{ aspectRatio: '2 / 3' }}>
            {next && (
              <div className="absolute inset-0 rounded-3xl overflow-hidden border border-line bg-surface scale-95 translate-y-3 opacity-60">
                <Poster item={next} />
              </div>
            )}
            {top ? (
              <div
                key={top.id}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                className="absolute inset-0 rounded-3xl overflow-hidden border border-strong bg-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing select-none text-white"
                style={{
                  transform, touchAction: 'none',
                  transition: drag.dragging && !leaving ? 'none' : 'transform .28s cubic-bezier(.2,.8,.2,1), opacity .28s',
                  opacity: leaving ? 0 : 1,
                }}
              >
                <Poster item={top} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute top-6 left-5 px-3 py-1 rounded-lg border-2 border-emerald-400 text-emerald-400 font-black text-xl" style={{ opacity: clamp(drag.x / 110), transform: 'rotate(-12deg)' }}>{t('swipe_match')}</div>
                <div className="absolute top-6 right-5 px-3 py-1 rounded-lg border-2 border-rose-500 text-rose-500 font-black text-xl" style={{ opacity: clamp(-drag.x / 110), transform: 'rotate(12deg)' }}>{t('swipe_pass')}</div>
                <div className="absolute top-1/3 left-0 right-0 text-center" style={{ opacity: clamp(-drag.y / 120) }}>
                  <span className="px-3 py-1 rounded-lg border-2 border-sky-400 text-sky-400 font-black text-xl">{t('swipe_super')}</span>
                </div>
                <div className="absolute top-4 left-4"><TypeBadge type={top.type} /></div>
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2.5">
                  {present.length > 0 && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/10 text-xs">
                      <div className="flex -space-x-1.5">{present.map(f => <Avatar key={f} who={f} size={18} />)}</div>
                      <b>{present.length > 1 ? t('friends_backlog_many', { n: present.length }) : t('friends_backlog_one')}</b>
                    </div>
                  )}
                  <h2 className="text-2xl md:text-3xl font-black leading-tight">{top.title}</h2>
                  <p className="text-sm text-zinc-300">{top.year} · {tDuration(top.metaDuration, lang)}{top.rating > 0 ? ` · ★ ${top.rating.toFixed(1)}` : ''}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {top.genres.map(g => <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-white/10 backdrop-blur-md">{tGenre(g, lang)}</span>)}
                  </div>
                  {top.platforms.length > 0 && <p className="text-xs text-zinc-400 inline-flex items-center gap-1.5"><Play size={12} /> {top.platforms.join(' · ')}</p>}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 rounded-3xl border border-dashed border-strong flex flex-col items-center justify-center text-center p-8 gap-3">
                <Sparkles size={36} className="text-subtle" />
                <p className="font-semibold">{t('deck_empty')}</p>
                <p className="text-sm text-subtle">{t('deck_empty_body')}</p>
                <button onClick={onResetDeck} className="mt-2 h-10 px-4 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5"><RotateCcw size={15} /> {t('reshuffle')}</button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-5">
            <button onClick={() => fling('pass')} disabled={!top} aria-label={t('pass')}
              className="w-16 h-16 rounded-full bg-surface border-2 border-rose-500/60 text-rose-500 flex items-center justify-center shadow-lg hover:bg-rose-500/10 active:scale-90 transition-all disabled:opacity-30">
              <X size={30} strokeWidth={3} />
            </button>
            <button onClick={() => fling('super')} disabled={!top} aria-label={t('super')}
              className="w-12 h-12 rounded-full bg-surface border-2 border-sky-500/60 text-sky-500 flex items-center justify-center shadow-lg hover:bg-sky-500/10 active:scale-90 transition-all disabled:opacity-30">
              <Star size={22} fill="currentColor" />
            </button>
            <button onClick={() => fling('like')} disabled={!top} aria-label={t('align')}
              className="w-16 h-16 rounded-full bg-surface border-2 border-emerald-500/60 flex items-center justify-center shadow-lg hover:bg-emerald-500/10 active:scale-90 transition-all disabled:opacity-30 text-3xl">
              {plan === 'game' ? '🎮' : '🍿'}
            </button>
          </div>
          <p className="hidden md:block text-center text-xs text-subtle">{t('kb_hint')}</p>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-surface border border-line p-4">
            <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Heart size={15} className="text-rose-500" /> {t('session_matches')}</h3>
            {matches.length ? (
              <div className="space-y-2">
                {matches.map(i => (
                  <div key={i.id} className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-surface2 shrink-0"><Poster item={i} /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.title}</p>
                      <p className="text-xs text-subtle">{startWhere(i)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-subtle">{t('no_matches')}</p>}
          </div>
          <div className="rounded-2xl bg-surface border border-line p-4 text-sm text-muted space-y-1.5">
            <p className="font-semibold text-fg">{t('how_title')}</p>
            <p>{t('how_1')}</p>
            <p>{t('how_2')}</p>
            <p>{t('how_3', { n: deck.length })}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MatchCelebration({ item, approvers, onStart, onClose }: { item: TrackrItem; approvers: string[]; onStart: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const confetti = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100,
    dx: `${(Math.random() - 0.5) * 200}px`,
    delay: Math.random() * 0.8,
    dur: 2.2 + Math.random() * 1.8,
    color: ['#f59e0b', '#8b5cf6', '#10b981', '#f43f5e', '#38bdf8', '#facc15'][i % 6],
    w: 6 + Math.random() * 6,
    round: Math.random() > 0.6,
  })), []);
  return (
    <div data-trk-modal className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md overflow-hidden" style={{ animation: 'trk-fade .2s' }} onClick={onClose}>
      {confetti.map((c, i) => (
        <span key={i} className="absolute top-0 pointer-events-none" style={{
          left: `${c.left}%`, width: c.w, height: c.round ? c.w : c.w * 1.6, background: c.color, borderRadius: c.round ? 999 : 2,
          ['--dx' as string]: c.dx, animation: `trk-confetti ${c.dur}s ${c.delay}s cubic-bezier(.3,.6,.4,1) forwards`, transform: 'translateY(-10vh)',
        } as React.CSSProperties} />
      ))}
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-surface border border-strong shadow-2xl text-center" style={{ animation: 'trk-pop .45s ease-out' }}>
        <div className="relative h-56">
          <Poster item={item} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }} />
        </div>
        <div className="p-6 -mt-12 relative">
          <div className="flex justify-center -space-x-3 mb-3">
            <Avatar who="me" size={44} />
            {approvers.map(a => <Avatar key={a} who={a} size={44} />)}
          </div>
          <p className="text-3xl font-black bg-gradient-to-r from-amber-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">{t('match_title')}</p>
          <p className="mt-2 font-semibold">{item.title}</p>
          <p className="mt-1 text-sm text-muted">{t('available_on', { w: startWhere(item) })}</p>
          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="flex-1 h-12 rounded-xl bg-surface2 font-medium">{t('later')}</button>
            <button onClick={onStart} className="flex-1 h-12 rounded-xl bg-emerald-500 text-zinc-950 font-bold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-400 active:scale-95 transition-all">
              <Play size={18} fill="currentColor" /> {t('start')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 14. VISTA 3 — FEED DA TRIBO
 * ========================================================================== */

function FeedView({ feed, onReact }: { feed: FeedEntry[]; onReact: (id: string, r: Reaction) => void }) {
  const { t, lang } = useI18n();
  const [bump, setBump] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <div>
        <Kicker>{t('feed_kicker')}</Kicker>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight">{t('nav_feed')}</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">
        <ol className="lg:col-span-2 relative space-y-4">
          <span aria-hidden className="absolute left-5 top-2 bottom-2 w-px bg-surface2" />
          {feed.map(f => {
            const m = TYPE_META[f.item.type];
            return (
              <li key={f.id} className="relative pl-14" style={{ animation: 'trk-up .3s ease-out' }}>
                <div className="absolute left-0 top-0"><Avatar who={f.who} size={40} /></div>
                <div className="rounded-2xl bg-surface border border-line p-4 hov-strong transition-colors">
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <b>{f.who === 'me' ? t('you') : f.who}</b>{' '}
                        <span className="text-muted">{t(`v_${f.verb}` as StrKey, { x: f.extra ?? '' })}</span>{' '}
                        <b className={m.tx}>{f.item.title}</b>
                        {f.verb === 'completed' && f.extra ? <span className="text-subtle"> ({f.extra})</span> : null}
                      </p>
                      {f.rating ? <div className="mt-1 -ml-0.5"><StarRating value={f.rating} size={14} /></div> : null}
                      <p className="mt-1 text-xs text-subtle inline-flex items-center gap-1.5"><m.icon size={12} /> {t(`type_${f.item.type}` as StrKey)} · {formatAgo(f.ts, lang)}</p>
                    </div>
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface2 shrink-0"><Poster item={f.item} /></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(['🔥', '👏', '🤯'] as Reaction[]).map(r => {
                      const mine = f.mine.includes(r);
                      const k = `${f.id}${r}`;
                      return (
                        <button
                          key={r}
                          onClick={() => { onReact(f.id, r); setBump(k); setTimeout(() => setBump(b => (b === k ? null : b)), 300); }}
                          className={`h-8 px-3 rounded-full text-sm inline-flex items-center gap-1.5 border transition-all active:scale-90 ${
                            mine ? 'bg-surface2 border-strong text-fg' : 'bg-sunken border-line text-muted hov-strong'}`}
                        >
                          <span style={bump === k ? { animation: 'trk-bump .3s' } : undefined}>{r}</span>
                          <span className="tabular-nums text-xs font-semibold">{f.reactions[r]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <aside>
          <div className="rounded-2xl bg-surface border border-line p-4">
            <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Users size={15} /> {t('tribe_now')}</h3>
            <div className="space-y-3">
              {FRIENDS.map(f => (
                <div key={f.name} className="flex items-center gap-3">
                  <Avatar who={f.name} size={36} dot />
                  <div>
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-subtle">{t('consuming')} <span className="text-fg">{f.now}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================================
 * 15. VISTA 4 — PERFIL & SYNC
 * ========================================================================== */

function ProviderMark({ p, size = 40 }: { p: ProviderDef; size?: number }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${p.grad} flex items-center justify-center font-black text-white shrink-0`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {p.mono}
    </div>
  );
}

function ProviderCard({ p, conn, remoteCount, pending, syncing, onConnect, onDisconnect, onChange, onSync, onImport, onExport, onSimulate }: {
  p: ProviderDef; conn?: Connection; remoteCount: number; pending: number; syncing: boolean;
  onConnect: () => void; onDisconnect: () => void; onChange: (patch: Partial<Connection>) => void; onSync: () => void;
  onImport: (files: FileList) => void; onExport: (kind: 'watched' | 'watchlist') => void; onSimulate: () => void;
}) {
  const { t, lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const official = p.api === 'official_gated';

  return (
    <div className="rounded-2xl bg-surface border border-line p-4 md:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ProviderMark p={p} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{p.name}</h3>
            {p.covers.map(c => <TypeBadge key={c} type={c} variant="surface" />)}
            {!official && <span className="px-2 py-0.5 rounded-full text-xs bg-surface2 text-muted">{t('sim_badge')}</span>}
          </div>
          <p className="text-xs text-subtle mt-0.5">{official ? t('cap_official') : t('cap_none')}</p>
        </div>
        {conn ? (
          <button onClick={onDisconnect} className="h-9 px-3 rounded-lg text-xs font-medium bg-surface2 text-muted hov-fg inline-flex items-center gap-1.5 shrink-0">
            <Unlink size={14} /> <span className="hidden sm:inline">{t('disconnect')}</span>
          </button>
        ) : (
          <button onClick={onConnect} className="h-9 px-3 rounded-lg text-xs font-semibold bg-invert inline-flex items-center gap-1.5 shrink-0 active:scale-95">
            <Link2 size={14} /> {t('connect')}
          </button>
        )}
      </div>

      {conn && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-medium">@{conn.username}</span>
            <span className="text-subtle">{t('last_sync', { d: conn.lastSync ? formatAgo(conn.lastSync, lang) : t('never') })}</span>
            <span className={pending ? 'tx-movie font-medium' : 'tx-game'}>{pending ? t('pending', { n: pending }) : t('up_to_date')}</span>
            <span className="text-subtle">{t('remote_count', { n: remoteCount })}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5"><Kicker>{t('direction')}</Kicker></div>
              <Segmented<SyncDirection>
                value={conn.direction} onChange={v => onChange({ direction: v })}
                options={[{ id: 'two_way', label: t('dir_two') }, { id: 'pull', label: t('dir_pull'), icon: ArrowDown }, { id: 'push', label: t('dir_push'), icon: ArrowUp }]}
              />
            </div>
            <div>
              <div className="mb-1.5"><Kicker>{t('conflict')}</Kicker></div>
              <Segmented<ConflictPolicy>
                value={conn.conflict} onChange={v => onChange({ conflict: v })}
                options={[{ id: 'newest', label: t('cf_newest') }, { id: 'trackr', label: t('cf_trackr') }, { id: 'remote', label: t('cf_remote') }]}
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm inline-flex items-center gap-2"><Zap size={15} className="text-yellow-500" /> {t('auto_sync')}</span>
            <button
              role="switch" aria-checked={conn.auto} onClick={() => onChange({ auto: !conn.auto })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${conn.auto ? 'bg-emerald-500' : 'bg-surface2'}`}
            >
              <span className="block w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: conn.auto ? 'translateX(20px)' : 'none' }} />
            </button>
          </label>

          <div className="flex flex-wrap gap-2">
            <button onClick={onSync} disabled={syncing} className="h-10 px-4 rounded-xl bg-emerald-500 text-zinc-950 text-sm font-semibold inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-60">
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> {syncing ? t('syncing') : t('sync_now')}
            </button>
            <button onClick={() => fileRef.current?.click()} className="h-10 px-3 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5">
              <Upload size={15} /> {t('csv_import')}
            </button>
            {p.csv === 'letterboxd' ? (
              <>
                <button onClick={() => onExport('watched')} className="h-10 px-3 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5"><Download size={15} /> {t('export_watched')}</button>
                <button onClick={() => onExport('watchlist')} className="h-10 px-3 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5"><Download size={15} /> {t('export_watchlist')}</button>
              </>
            ) : (
              <button onClick={() => onExport('watched')} className="h-10 px-3 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5"><Download size={15} /> {t('csv_export')}</button>
            )}
            <button onClick={onSimulate} className="h-10 px-3 rounded-xl text-xs text-subtle hov-fg inline-flex items-center gap-1.5"><Sparkles size={14} /> {t('simulate_remote')}</button>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv" multiple className="hidden"
              onChange={e => { if (e.target.files?.length) onImport(e.target.files); e.target.value = ''; }}
            />
          </div>
          <p className="text-xs text-subtle">{p.csv === 'letterboxd' ? t('csv_hint_lb') : t('csv_hint_generic')}</p>
        </>
      )}
    </div>
  );
}

function LoginModal({ p, onConnect, onClose }: { p: ProviderDef; onConnect: (username: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [user, setUser] = useState('');
  const [busy, setBusy] = useState(false);
  const official = p.api === 'official_gated';
  const submit = () => {
    if (!user.trim() || busy) return;
    setBusy(true);
    setTimeout(() => onConnect(user.trim().replace(/^@/, '')), 900);
  };
  return (
    <Sheet onClose={onClose}>
      <div className="p-6 space-y-5">
        <SheetHeader title={<span className="inline-flex items-center gap-3"><ProviderMark p={p} size={32} /> {t('login_title', { p: p.name })}</span>} onClose={onClose} />
        <label className="block">
          <Kicker>{t('login_user', { p: p.name })}</Kicker>
          <div className="relative mt-1.5">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              autoFocus value={user} onChange={e => setUser(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="@username" className="w-full h-11 pl-9 pr-3 rounded-xl bg-sunken border border-line text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
        </label>
        <p className="text-xs text-muted leading-relaxed rounded-xl bg-sunken border border-line p-3 inline-flex gap-2">
          <AlertCircle size={16} className="shrink-0 tx-movie" />
          {official ? t('login_note_oauth') : t('login_note_none', { p: p.name })}
        </p>
        <button onClick={submit} disabled={!user.trim() || busy} className="w-full h-12 rounded-xl bg-invert font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
          {official ? t('login_cta', { p: p.name }) : t('login_sim_cta')}
        </button>
      </div>
    </Sheet>
  );
}

function ExportModal({ p, file, onClose }: { p: ProviderDef; file: { filename: string; content: string }; onClose: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([file.content], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = file.filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* sandbox sem downloads: usar Copiar */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(file.content); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* sem clipboard */ }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="p-6 space-y-4">
        <SheetHeader title={t('export_title', { p: p.name })} onClose={onClose} />
        <p className="text-xs text-muted">{p.csv === 'letterboxd' ? t('export_hint_lb') : t('export_hint_generic')}</p>
        <p className="text-xs font-mono text-subtle">{file.filename}</p>
        <pre className="text-xs font-mono bg-sunken border border-line rounded-xl p-3 overflow-auto whitespace-pre" style={{ maxHeight: '40vh' }}>{file.content}</pre>
        <div className="flex gap-2">
          <button onClick={copy} className="h-11 px-4 rounded-xl bg-surface2 text-sm inline-flex items-center gap-1.5">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? t('copied') : t('copy')}</button>
          <button onClick={download} className="flex-1 h-11 rounded-xl bg-invert text-sm font-semibold inline-flex items-center justify-center gap-1.5"><Download size={15} /> {t('download')}</button>
        </div>
      </div>
    </Sheet>
  );
}

function ProfileView({ items, langPref, setLangPref, themePref, setThemePref, keys, onSaveKeys, conns, remote, syncing, log, providerActions }: {
  items: TrackrItem[]; langPref: LangPref; setLangPref: (l: LangPref) => void; themePref: ThemePref; setThemePref: (t: ThemePref) => void;
  keys: ApiKeys; onSaveKeys: (k: ApiKeys) => void; conns: Partial<Record<ProviderId, Connection>>; remote: Record<ProviderId, RemoteEntry[]>;
  syncing: ProviderId[]; log: SyncReport[];
  providerActions: (p: ProviderDef) => Omit<React.ComponentProps<typeof ProviderCard>, 'p' | 'conn' | 'remoteCount' | 'pending' | 'syncing'>;
}) {
  const { t, lang } = useI18n();
  const [draft, setDraft] = useState(keys);
  const [show, setShow] = useState(false);
  useEffect(() => setDraft(keys), [keys]);

  const pendingFor = (p: ProviderDef) => {
    const c = conns[p.id];
    if (!c) return 0;
    return items.filter(i => p.covers.includes(i.type) && (i.updatedAt ?? 0) > (c.lastSync ?? 0)).length;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-surface border border-line p-5 md:p-6 flex items-center gap-4">
        <Avatar who="me" size={64} ring />
        <div className="min-w-0">
          <Kicker>{t('profile_kicker')}</Kicker>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('nav_profile')}</h1>
          <p className="text-sm text-muted">{t('profile_tagline')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold inline-flex items-center gap-2"><RefreshCw size={18} className="tx-game" /> {t('sync_title')}</h2>
            <p className="text-sm text-muted mt-1">{t('sync_body')}</p>
          </div>
          {PROVIDERS.map(p => (
            <ProviderCard
              key={p.id} p={p} conn={conns[p.id]} remoteCount={remote[p.id].length}
              pending={pendingFor(p)} syncing={syncing.includes(p.id)} {...providerActions(p)}
            />
          ))}
          <div className="rounded-2xl border border-dashed border-strong p-4 flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center shrink-0"><Plus size={18} className="text-subtle" /></div>
            <div>
              <p className="font-semibold">{t('more_soon')}</p>
              <p className="text-xs text-subtle">{t('more_soon_body')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-surface border border-line p-4 space-y-4">
            <h2 className="font-bold inline-flex items-center gap-2"><Settings size={16} /> {t('prefs')}</h2>
            <div>
              <div className="mb-1.5"><Kicker>{t('language')}</Kicker></div>
              <Segmented<LangPref>
                value={langPref} onChange={setLangPref}
                options={[{ id: 'system', label: t('opt_system'), icon: Languages }, { id: 'pt', label: 'PT' }, { id: 'en', label: 'EN' }]}
              />
            </div>
            <div>
              <div className="mb-1.5"><Kicker>{t('theme')}</Kicker></div>
              <Segmented<ThemePref>
                value={themePref} onChange={setThemePref}
                options={[{ id: 'system', label: t('opt_system'), icon: Monitor }, { id: 'dark', label: t('th_dark'), icon: Moon }, { id: 'light', label: t('th_light'), icon: Sun }]}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-line p-4 space-y-3">
            <h2 className="font-bold inline-flex items-center gap-2"><Key size={16} /> {t('api_title')}</h2>
            <p className="text-xs text-muted">{t('api_body')}</p>
            {([['tmdb', 'TMDB API Key (v3)', 'tx-movie'], ['rawg', 'RAWG API Key', 'tx-game']] as const).map(([id, label, cls]) => (
              <label key={id} className="block">
                <span className={`text-xs font-semibold uppercase tracking-widest ${cls}`}>{label}</span>
                <input
                  type={show ? 'text' : 'password'} value={draft[id]} spellCheck={false} autoComplete="off"
                  onChange={e => setDraft({ ...draft, [id]: e.target.value.trim() })} placeholder={t('paste_key')}
                  className="mt-1 w-full h-10 px-3 rounded-xl bg-sunken border border-line text-sm font-mono focus:outline-none focus:border-zinc-500"
                />
              </label>
            ))}
            <div className="flex items-center gap-2">
              <button onClick={() => setShow(s => !s)} className="text-xs text-muted hov-fg inline-flex items-center gap-1.5 mr-auto">
                {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? t('hide_keys') : t('show_keys')}
              </button>
              <button onClick={() => onSaveKeys({ tmdb: '', rawg: '' })} className="h-9 px-3 rounded-lg bg-surface2 text-xs">{t('clear')}</button>
              <button onClick={() => onSaveKeys(draft)} className="h-9 px-4 rounded-lg bg-invert text-xs font-semibold">{t('save')}</button>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-line p-4">
            <h2 className="font-bold mb-3 inline-flex items-center gap-2"><Activity size={16} /> {t('log_title')}</h2>
            {log.length ? (
              <ul className="space-y-2.5">
                {log.slice(0, 8).map(r => {
                  const p = PROVIDERS.find(x => x.id === r.provider)!;
                  return (
                    <li key={`${r.provider}-${r.at}`} className="text-xs">
                      <p className="font-medium">{t('sync_result', { p: p.name, a: r.pulled.length, u: r.updated.length, b: r.pushed.length, c: r.conflicts.length })}</p>
                      <p className="text-subtle">{formatAgo(r.at, lang)}{r.conflicts.length ? ` · ⚠ ${r.conflicts.join(', ')}` : ''}</p>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-subtle">{t('log_empty')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 16. APP SHELL
 * ========================================================================== */

const NAV: { id: ViewId; label: StrKey; short: StrKey; icon: typeof Film }[] = [
  { id: 'hub', label: 'nav_hub', short: 'nav_hub_short', icon: LayoutGrid },
  { id: 'match', label: 'nav_match', short: 'nav_match_short', icon: Heart },
  { id: 'feed', label: 'nav_feed', short: 'nav_feed_short', icon: Activity },
  { id: 'profile', label: 'nav_profile', short: 'nav_profile_short', icon: User },
];

export default function TrackrApp() {
  const [prefs, setPrefs] = useState(() => loadJson<{ lang: LangPref; theme: ThemePref }>(LS.prefs, { lang: 'system', theme: 'system' }));
  const systemDark = useSystemDark();
  const lang: Lang = prefs.lang !== 'system' ? prefs.lang
    : typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const theme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;
  const t = useMemo(() => makeT(lang), [lang]);
  const i18n = useMemo(() => ({ t, lang }), [t, lang]);
  const setPref = (patch: Partial<typeof prefs>) => setPrefs(p => { const n = { ...p, ...patch }; saveJson(LS.prefs, n); return n; });

  const [items, setItems] = useState<TrackrItem[]>(MOCK_LIBRARY);
  const [view, setView] = useState<ViewId>('hub');
  const [collapsed, setCollapsed] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>(() => loadJson(LS.keys, { tmdb: '', rawg: '' }));
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<TrackrItem['id'] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedEntry[]>(SEED_FEED);

  const [friends, setFriends] = useState<string[]>(['Diogo', 'Sara']);
  const [plan, setPlan] = useState<Plan>('movie');
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [matches, setMatches] = useState<TrackrItem[]>([]);
  const [celebrate, setCelebrate] = useState<{ item: TrackrItem; approvers: string[] } | null>(null);

  // Sync
  const [conns, setConns] = useState<Partial<Record<ProviderId, Connection>>>(() => loadJson(LS.conns, {}));
  const [remote, setRemote] = useState<Record<ProviderId, RemoteEntry[]>>(seedRemote);
  const [syncing, setSyncing] = useState<ProviderId[]>([]);
  const [syncLog, setSyncLog] = useState<SyncReport[]>([]);
  const [loginFor, setLoginFor] = useState<ProviderDef | null>(null);
  const [exportFile, setExportFile] = useState<{ p: ProviderDef; file: { filename: string; content: string } } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const live = !!(keys.tmdb || keys.rawg);
  const detail = items.find(i => i.id === detailId) ?? null;
  const anyModal = addOpen || !!detail || !!celebrate || !!loginFor || !!exportFile;

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const pushFeed = (verb: FeedVerb, item: TrackrItem, extra?: string, rating?: number) =>
    setFeed(f => [{ id: `me-${Date.now()}-${Math.random()}`, who: 'me', verb, extra, item, rating, ts: Date.now(), reactions: zeroReactions(), mine: [] }, ...f]);

  const updateItem = (id: TrackrItem['id'], patch: Partial<TrackrItem>) => {
    const before = items.find(i => i.id === id);
    setItems(list => list.map(i => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
    if (before && patch.myStatus === 'completed' && before.myStatus !== 'completed') {
      pushFeed('completed', before, undefined, patch.myRating ?? before.myRating);
      notify(t('toast_completed', { t: before.title }));
    }
  };

  const addItem = (i: TrackrItem) => {
    if (items.some(x => libKey(x) === libKey(i))) return notify(t('toast_exists'));
    const fresh: TrackrItem = { ...i, id: i.apiSource === 'local_mock' ? `${i.id}-${Date.now()}` : i.id, myStatus: 'backlog', progress: 0, updatedAt: Date.now() };
    setItems(list => [fresh, ...list]);
    pushFeed('added', fresh);
    notify(t('toast_added', { t: i.title }));
  };

  const removeItem = (id: TrackrItem['id']) => {
    const it = items.find(i => i.id === id);
    setItems(list => list.filter(i => i.id !== id));
    setDetailId(null);
    if (it) notify(t('toast_removed', { t: it.title }));
  };

  const saveKeys = (k: ApiKeys) => {
    setKeys(k);
    saveJson(LS.keys, k);
    notify(k.tmdb || k.rawg ? t('toast_keys') : t('toast_mock'));
  };

  const vote = useCallback((item: TrackrItem, v: Vote) => {
    setVotes(prev => ({ ...prev, [String(item.id)]: v }));
    if (v === 'pass') return;
    const approvers = item.likedByFriends.filter(f => friends.includes(f));
    const isMatch = friends.length > 0 && (v === 'super' ? approvers.length >= 1 : approvers.length === friends.length);
    if (isMatch) {
      setMatches(m => [item, ...m]);
      setCelebrate({ item, approvers });
      pushFeed('match', item, approvers.join(' & '));
    } else {
      notify(v === 'super' ? t('toast_super') : t('toast_vote'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, notify, t]);

  /* ---------- Sync actions ---------- */

  const setConn = (id: ProviderId, c: Connection | undefined) => setConns(prev => {
    const next = { ...prev };
    if (c) next[id] = c; else delete next[id];
    saveJson(LS.conns, next);
    return next;
  });

  const runSync = useCallback((p: ProviderDef) => {
    const conn = conns[p.id];
    if (!conn || syncing.includes(p.id)) return;
    setSyncing(s => [...s, p.id]);
    // Simula latência de rede; em produção isto é um POST /sync/{provider} ao backend.
    setTimeout(() => {
      const at = Date.now();
      const res = reconcile(itemsRef.current, remote[p.id], p, conn, at);
      setItems(res.items);
      setRemote(r => ({ ...r, [p.id]: res.remote }));
      setConn(p.id, { ...conn, lastSync: at });
      setSyncLog(l => [res.report, ...l]);
      setSyncing(s => s.filter(x => x !== p.id));
      if (res.report.pulled.length) {
        const first = res.items.find(i => i.title === res.report.pulled[0]);
        if (first) pushFeed('synced', first, p.name);
      }
      notify(t('sync_result', { p: p.name, a: res.report.pulled.length, u: res.report.updated.length, b: res.report.pushed.length, c: res.report.conflicts.length }));
    }, 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conns, remote, syncing, notify, t]);

  // Sync automático: alterações locais pendentes disparam sync após 3s de inatividade.
  useEffect(() => {
    const due = PROVIDERS.filter(p => {
      const c = conns[p.id];
      return c?.auto && c.lastSync && !syncing.includes(p.id)
        && items.some(i => p.covers.includes(i.type) && (i.updatedAt ?? 0) > (c.lastSync ?? 0));
    });
    if (!due.length) return;
    const timer = setTimeout(() => due.forEach(runSync), 3000);
    return () => clearTimeout(timer);
  }, [items, conns, syncing, runSync]);

  const providerActions = (p: ProviderDef) => ({
    onConnect: () => setLoginFor(p),
    onDisconnect: () => setConn(p.id, undefined),
    onChange: (patch: Partial<Connection>) => { const c = conns[p.id]; if (c) setConn(p.id, { ...c, ...patch }); },
    onSync: () => runSync(p),
    onImport: async (files: FileList) => {
      try {
        const loaded = await Promise.all(Array.from(files).map(async f => ({ name: f.name, text: await f.text() })));
        const res = importCsvFiles(loaded, itemsRef.current, p, Date.now());
        if (!res.added && !res.updated) return notify(t('csv_err'));
        setItems(res.items);
        notify(t('csv_done', { p: p.name, a: res.added, u: res.updated }));
      } catch {
        notify(t('csv_err'));
      }
    },
    onExport: (kind: 'watched' | 'watchlist') => setExportFile({ p, file: buildExport(items, p, kind) }),
    onSimulate: () => {
      // Atividade feita "fora" do Trackr: altera ou acrescenta uma entrada remota.
      const at = Date.now();
      setRemote(r => {
        const list = [...r[p.id]];
        const pick = list[Math.floor(Math.random() * list.length)];
        if (pick && Math.random() > 0.4) {
          const idx = list.indexOf(pick);
          list[idx] = { ...pick, status: 'completed', rating: Math.max(1, Math.min(5, (pick.rating ?? 3) + (Math.random() > 0.5 ? 1 : -1))), updatedAt: at };
        } else {
          const extras: Record<ProviderId, RemoteEntry> = {
            letterboxd: { title: 'Anatomy of a Fall', year: 2023, type: 'movie', status: 'completed', rating: 4, updatedAt: at },
            serializd: { title: 'Slow Horses', year: 2022, type: 'series', status: 'in_progress', updatedAt: at },
            logg: { title: 'Outer Wilds', year: 2019, type: 'game', status: 'backlog', updatedAt: at },
          };
          if (!list.some(x => libKey(x) === libKey(extras[p.id]))) list.unshift(extras[p.id]);
        }
        return { ...r, [p.id]: list };
      });
      notify(t('toast_remote', { p: p.name }));
    },
  });

  // Atalhos globais (desktop)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (celebrate) setCelebrate(null);
        else if (exportFile) setExportFile(null);
        else if (loginFor) setLoginFor(null);
        else if (detailId !== null) setDetailId(null);
        else if (addOpen) setAddOpen(false);
        return;
      }
      if (isTyping(e.target) || anyModal || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); setView('hub'); setTimeout(() => searchRef.current?.focus(), 0); }
      else if (e.key === 'n') setAddOpen(true);
      else if (e.key === ',') setView('profile');
      else if (['1', '2', '3', '4'].includes(e.key)) setView(NAV[Number(e.key) - 1].id);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [anyModal, celebrate, exportFile, loginFor, detailId, addOpen]);

  const ApiChip = ({ full = true }: { full?: boolean }) => (
    <button
      onClick={() => setView('profile')}
      className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors ${full ? 'px-3 py-1.5' : 'p-2'} ${
        live ? 'bd-game soft-game tx-game' : 'border-strong bg-surface text-muted hov-fg'}`}
      title={t('api_title')}
    >
      {live ? <Wifi size={14} /> : <WifiOff size={14} />}
      {full && (live ? t('api_live') : t('api_mock'))}
    </button>
  );

  const connectedCount = Object.keys(conns).length;

  return (
    <I18n.Provider value={i18n}>
      <div
        className="trk min-h-screen flex antialiased" data-theme={theme} lang={lang === 'pt' ? 'pt-PT' : 'en'}
        style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      >
        <style>{GLOBAL_CSS}</style>

        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-line bg-app transition-all duration-300 z-30" style={{ width: collapsed ? 80 : 256 }}>
          <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'px-5'}`}><Logo compact={collapsed} /></div>
          <nav className="px-3 space-y-1">
            {NAV.map((n, idx) => {
              const on = view === n.id;
              return (
                <button
                  key={n.id} onClick={() => setView(n.id)} title={collapsed ? t(n.label) : undefined}
                  className={`w-full h-11 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${collapsed ? 'justify-center' : 'px-3'} ${
                    on ? 'bg-surface2 text-fg' : 'text-muted hov-surface hov-fg'}`}
                >
                  <n.icon size={19} className={on ? 'tx-game' : ''} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{t(n.label)}</span>
                      {n.id === 'profile' && connectedCount > 0 && <RefreshCw size={13} className="tx-game" />}
                      <kbd className="text-xs text-subtle">{idx + 1}</kbd>
                    </>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setAddOpen(true)} title={collapsed ? t('track_item') : undefined}
              className={`w-full h-11 mt-3 rounded-xl flex items-center gap-3 text-sm font-semibold bg-invert active:scale-95 transition-all ${collapsed ? 'justify-center' : 'px-3'}`}
            >
              <Plus size={19} /> {!collapsed && <><span className="flex-1 text-left">{t('track_item')}</span><kbd className="text-xs opacity-60">N</kbd></>}
            </button>
          </nav>

          {!collapsed && (
            <div className="mx-3 mt-6 p-4 rounded-2xl bg-surface border border-line space-y-2.5">
              <Kicker>{t('by_cat')}</Kicker>
              {(Object.keys(TYPE_META) as MediaType[]).map(ty => {
                const m = TYPE_META[ty];
                return (
                  <div key={ty} className="flex items-center gap-2 text-sm">
                    <m.icon size={15} className={m.tx} />
                    <span className="flex-1 text-muted">{t(`types_${ty}` as StrKey)}</span>
                    <span className="font-semibold tabular-nums">{items.filter(i => i.type === ty).length}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto p-3 space-y-2">
            {!collapsed && (
              <div className="px-3 py-2 text-xs text-subtle space-y-1">
                <p className="inline-flex items-center gap-1.5 text-muted font-medium"><Keyboard size={13} /> {t('shortcuts')}</p>
                <p><kbd className="text-fg">/</kbd> {t('sc_search')} · <kbd className="text-fg">N</kbd> {t('sc_add')} · <kbd className="text-fg">,</kbd> {t('sc_profile')}</p>
              </div>
            )}
            <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
              <ApiChip full={!collapsed} />
              <button
                onClick={() => setPref({ theme: theme === 'dark' ? 'light' : 'dark' })}
                className="p-2 rounded-full text-muted hov-fg hov-surface" aria-label={t('theme')}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={() => setPref({ lang: lang === 'pt' ? 'en' : 'pt' })} className="p-2 rounded-full text-xs font-bold text-muted hov-fg hov-surface" aria-label={t('language')}>
                {lang === 'pt' ? 'EN' : 'PT'}
              </button>
              <button onClick={() => setCollapsed(c => !c)} className={`p-2 rounded-full text-muted hov-fg hov-surface ${collapsed ? '' : 'ml-auto'}`} aria-label={t('collapse')}>
                {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar mobile */}
          <header className="md:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-app-blur backdrop-blur-xl border-b border-line">
            <Logo />
            <div className="flex items-center gap-2">
              <ApiChip full={false} />
              <button onClick={() => setPref({ theme: theme === 'dark' ? 'light' : 'dark' })} className="p-2 rounded-full bg-surface border border-line" aria-label={t('theme')}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-10 pb-32 md:pb-10">
            {view === 'hub' && (
              <HubView
                items={items} keys={keys} searchRef={searchRef}
                onOpen={setDetailId} onRate={(id, v) => updateItem(id, { myRating: v || undefined })}
                onAdd={addItem} onOpenAdd={() => setAddOpen(true)}
              />
            )}
            {view === 'match' && (
              <MatchView
                items={items} friends={friends} setFriends={setFriends} plan={plan} setPlan={setPlan}
                votes={votes} onVote={vote} onResetDeck={() => setVotes({})} matches={matches} active={!anyModal}
              />
            )}
            {view === 'feed' && (
              <FeedView
                feed={feed}
                onReact={(id, r) => setFeed(list => list.map(f => {
                  if (f.id !== id) return f;
                  const mine = f.mine.includes(r);
                  return { ...f, mine: mine ? f.mine.filter(x => x !== r) : [...f.mine, r], reactions: { ...f.reactions, [r]: f.reactions[r] + (mine ? -1 : 1) } };
                }))}
              />
            )}
            {view === 'profile' && (
              <ProfileView
                items={items} langPref={prefs.lang} setLangPref={l => setPref({ lang: l })} themePref={prefs.theme} setThemePref={th => setPref({ theme: th })}
                keys={keys} onSaveKeys={saveKeys} conns={conns} remote={remote} syncing={syncing} log={syncLog} providerActions={providerActions}
              />
            )}
          </main>
        </div>

        {/* Bottom Tab Bar mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-blur backdrop-blur-xl border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-5 h-16 items-center">
            {NAV.slice(0, 2).map(n => <TabButton key={n.id} active={view === n.id} label={t(n.short)} icon={n.icon} onClick={() => setView(n.id)} />)}
            <div className="flex justify-center">
              <button
                onClick={() => setAddOpen(true)} aria-label={t('track_item')}
                className="w-14 h-14 -mt-7 rounded-2xl bg-invert flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
                style={{ boxShadow: '0 0 0 4px var(--bg), 0 20px 40px rgba(0,0,0,.35)' }}
              >
                <Plus size={26} strokeWidth={2.5} />
              </button>
            </div>
            {NAV.slice(2).map(n => <TabButton key={n.id} active={view === n.id} label={t(n.short)} icon={n.icon} onClick={() => setView(n.id)} />)}
          </div>
        </nav>

        {/* Camadas */}
        {addOpen && <AddModal items={items} keys={keys} onAdd={addItem} onClose={() => setAddOpen(false)} />}
        {detail && <DetailModal item={detail} onUpdate={p => updateItem(detail.id, p)} onRemove={() => removeItem(detail.id)} onClose={() => setDetailId(null)} />}
        {loginFor && (
          <LoginModal
            p={loginFor} onClose={() => setLoginFor(null)}
            onConnect={username => {
              setConn(loginFor.id, { username, connectedAt: Date.now(), direction: 'two_way', conflict: 'newest', auto: true });
              setLoginFor(null);
            }}
          />
        )}
        {exportFile && <ExportModal p={exportFile.p} file={exportFile.file} onClose={() => setExportFile(null)} />}
        {celebrate && (
          <MatchCelebration
            item={celebrate.item} approvers={celebrate.approvers} onClose={() => setCelebrate(null)}
            onStart={() => {
              updateItem(celebrate.item.id, { myStatus: 'in_progress' });
              notify(t('toast_start', { t: celebrate.item.title }));
              setCelebrate(null);
            }}
          />
        )}

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-50 px-4 py-2.5 rounded-full bg-invert text-sm font-semibold shadow-2xl text-center" style={{ animation: 'trk-up .25s ease-out', maxWidth: 'calc(100vw - 32px)' }}>
            {toast}
          </div>
        )}
      </div>
    </I18n.Provider>
  );
}

function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Film; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`h-full flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors active:scale-90 ${active ? 'text-fg' : 'text-subtle'}`}>
      <Icon size={22} className={active ? 'tx-game' : ''} />
      {label}
    </button>
  );
}
