import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOCK_LIBRARY, REMOTE_EXTRAS, importCsvFiles, libKey, providerById, reconcile, seedFeed, seedGlobalFeed, seedRemote, zeroReactions,
  type ApiKeys, type Connection, type FeedEntry, type FeedVerb, type LangPref, type MediaType, type ProviderId,
  type Reaction, type RemoteEntry, type StrKey, type SyncReport, type ThemePref, type TrackrItem, type Vote,
} from '@trackr/core';

export interface Me {
  name: string;
  bio: string;
  /** Profile photo as a data URI, so it survives restarts on every platform. */
  photo?: string;
}

export interface Toast {
  id: number;
  key: StrKey;
  vars?: Record<string, string | number>;
}

interface TrackrState {
  prefs: { lang: LangPref; theme: ThemePref };
  me: Me;
  keys: ApiKeys;
  items: TrackrItem[];
  /** Account the device library belongs to; null while it was never linked to one. */
  libraryOwner: string | null;
  /** Tribe feed (you + friends). */
  feed: FeedEntry[];
  /** Everyone on TRACKR. */
  globalFeed: FeedEntry[];
  // Match session (not persisted)
  friends: string[];
  plan: MediaType;
  votes: Record<string, Vote>;
  matches: TrackrItem[];
  celebrate: { item: TrackrItem; approvers: string[] } | null;
  // Sync
  conns: Partial<Record<ProviderId, Connection>>;
  remote: Record<ProviderId, RemoteEntry[]>;
  syncing: ProviderId[];
  syncLog: SyncReport[];
  toast: Toast | null;

  setPrefs: (patch: Partial<TrackrState['prefs']>) => void;
  setMe: (patch: Partial<Me>) => void;
  saveKeys: (k: ApiKeys) => void;
  updateItem: (id: TrackrItem['id'], patch: Partial<TrackrItem>) => void;
  addItem: (i: TrackrItem) => void;
  removeItem: (id: TrackrItem['id']) => void;
  react: (feedId: string, r: Reaction) => void;
  setFriends: (f: string[]) => void;
  setPlan: (p: MediaType) => void;
  vote: (item: TrackrItem, v: Vote) => void;
  resetDeck: () => void;
  closeCelebration: () => void;
  startCelebrated: () => void;
  connect: (id: ProviderId, username: string) => void;
  disconnect: (id: ProviderId) => void;
  patchConn: (id: ProviderId, patch: Partial<Connection>) => void;
  runSync: (id: ProviderId) => void;
  importCsv: (id: ProviderId, files: { name: string; text: string }[]) => void;
  simulateRemote: (id: ProviderId) => void;
  notify: (key: StrKey, vars?: Toast['vars']) => void;
}

const SYNC_LATENCY_MS = 1100;

export const useTrackr = create<TrackrState>()(
  persist(
    (set, get) => {
      const pushFeed = (verb: FeedVerb, item: TrackrItem, extra?: string, rating?: number) =>
        set(s => ({
          feed: [{ id: `me-${Date.now()}-${Math.random()}`, who: 'me', verb, extra, item, rating, ts: Date.now(), reactions: zeroReactions(), mine: [] }, ...s.feed],
        }));

      return {
        prefs: { lang: 'system', theme: 'system' },
        me: { name: '', bio: '' },
        keys: { tmdb: '', rawg: '' },
        items: MOCK_LIBRARY,
        libraryOwner: null,
        feed: seedFeed(),
        globalFeed: seedGlobalFeed(),
        friends: ['Diogo', 'Sara'],
        plan: 'movie',
        votes: {},
        matches: [],
        celebrate: null,
        conns: {},
        remote: seedRemote(),
        syncing: [],
        syncLog: [],
        toast: null,

        notify: (key, vars) => set({ toast: { id: Date.now(), key, vars } }),

        setPrefs: patch => set(s => ({ prefs: { ...s.prefs, ...patch } })),
        setMe: patch => set(s => ({ me: { ...s.me, ...patch } })),

        saveKeys: k => {
          set({ keys: k });
          get().notify(k.tmdb || k.rawg ? 'toast_keys' : 'toast_mock');
        },

        updateItem: (id, patch) => {
          const before = get().items.find(i => i.id === id);
          set(s => ({ items: s.items.map(i => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)) }));
          if (before && patch.myStatus === 'completed' && before.myStatus !== 'completed') {
            pushFeed('completed', before, undefined, patch.myRating ?? before.myRating);
            get().notify('toast_completed', { t: before.title });
          }
        },

        addItem: i => {
          if (get().items.some(x => libKey(x) === libKey(i))) return get().notify('toast_exists');
          const fresh: TrackrItem = {
            ...i, id: i.apiSource === 'local_mock' ? `${i.id}-${Date.now()}` : i.id, myStatus: 'backlog', progress: 0, updatedAt: Date.now(),
          };
          set(s => ({ items: [fresh, ...s.items] }));
          pushFeed('added', fresh);
          get().notify('toast_added', { t: i.title });
        },

        removeItem: id => {
          const it = get().items.find(i => i.id === id);
          set(s => ({ items: s.items.filter(i => i.id !== id) }));
          if (it) get().notify('toast_removed', { t: it.title });
        },

        react: (feedId, r) => {
          const toggle = (f: FeedEntry) => {
            if (f.id !== feedId) return f;
            const mine = f.mine.includes(r);
            return { ...f, mine: mine ? f.mine.filter(x => x !== r) : [...f.mine, r], reactions: { ...f.reactions, [r]: f.reactions[r] + (mine ? -1 : 1) } };
          };
          set(s => ({ feed: s.feed.map(toggle), globalFeed: s.globalFeed.map(toggle) }));
        },

        setFriends: friends => set({ friends }),
        setPlan: plan => set({ plan }),
        resetDeck: () => set({ votes: {} }),
        closeCelebration: () => set({ celebrate: null }),

        vote: (item, v) => {
          set(s => ({ votes: { ...s.votes, [String(item.id)]: v } }));
          if (v === 'pass') return;
          const { friends } = get();
          const approvers = item.likedByFriends.filter(f => friends.includes(f));
          const isMatch = friends.length > 0 && (v === 'super' ? approvers.length >= 1 : approvers.length === friends.length);
          if (isMatch) {
            set(s => ({ matches: [item, ...s.matches], celebrate: { item, approvers } }));
            pushFeed('match', item, approvers.join(' & '));
          } else {
            get().notify(v === 'super' ? 'toast_super' : 'toast_vote');
          }
        },

        startCelebrated: () => {
          const c = get().celebrate;
          if (!c) return;
          get().updateItem(c.item.id, { myStatus: 'in_progress' });
          get().notify('toast_start', { t: c.item.title });
          set({ celebrate: null });
        },

        connect: (id, username) => set(s => ({
          conns: { ...s.conns, [id]: { username, connectedAt: Date.now(), direction: 'two_way', conflict: 'newest', auto: true } },
        })),

        disconnect: id => set(s => {
          const conns = { ...s.conns };
          delete conns[id];
          return { conns };
        }),

        patchConn: (id, patch) => set(s => {
          const c = s.conns[id];
          return c ? { conns: { ...s.conns, [id]: { ...c, ...patch } } } : {};
        }),

        runSync: id => {
          const p = providerById(id);
          const conn = get().conns[id];
          if (!p || !conn || get().syncing.includes(id)) return;
          set(s => ({ syncing: [...s.syncing, id] }));
          // Simulated network latency; in production this is POST /sync/:provider on apps/api.
          setTimeout(() => {
            const at = Date.now();
            const res = reconcile(get().items, get().remote[id], p, conn, at);
            set(s => ({
              items: res.items,
              remote: { ...s.remote, [id]: res.remote },
              conns: { ...s.conns, [id]: { ...conn, ...s.conns[id], lastSync: at } },
              syncLog: [res.report, ...s.syncLog].slice(0, 30),
              syncing: s.syncing.filter(x => x !== id),
            }));
            const firstPulled = res.items.find(i => i.title === res.report.pulled[0]);
            if (firstPulled) pushFeed('synced', firstPulled, p.name);
            get().notify('sync_result', {
              p: p.name, a: res.report.pulled.length, u: res.report.updated.length, b: res.report.pushed.length, c: res.report.conflicts.length,
            });
          }, SYNC_LATENCY_MS);
        },

        importCsv: (id, files) => {
          const p = providerById(id);
          if (!p) return;
          const res = importCsvFiles(files, get().items, p, Date.now());
          if (!res.added && !res.updated) return get().notify('csv_err');
          set({ items: res.items });
          get().notify('csv_done', { p: p.name, a: res.added, u: res.updated });
        },

        simulateRemote: id => {
          const p = providerById(id);
          if (!p) return;
          const at = Date.now();
          const list = [...get().remote[id]];
          const pick = list[Math.floor(Math.random() * list.length)];
          if (pick && Math.random() > 0.4) {
            list[list.indexOf(pick)] = {
              ...pick, status: 'completed', updatedAt: at,
              rating: Math.max(1, Math.min(5, (pick.rating ?? 3) + (Math.random() > 0.5 ? 1 : -1))),
            };
          } else if (!list.some(x => libKey(x) === libKey(REMOTE_EXTRAS[id]))) {
            list.unshift({ ...REMOTE_EXTRAS[id], updatedAt: at });
          }
          set(s => ({ remote: { ...s.remote, [id]: list } }));
          get().notify('toast_remote', { p: p.name });
        },
      };
    },
    {
      name: 'trackr.store.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({
        prefs: s.prefs, me: s.me, keys: s.keys, items: s.items, libraryOwner: s.libraryOwner, feed: s.feed, globalFeed: s.globalFeed, conns: s.conns, remote: s.remote, syncLog: s.syncLog,
      }),
    },
  ),
);
