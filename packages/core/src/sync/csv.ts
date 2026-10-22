import type { MediaStatus, MediaType, TrackrItem } from '../domain/types';
import { MEDIA_STATUSES, MEDIA_TYPES, libKey } from '../domain/media';
import { fromRemote } from './reconcile';
import type { ProviderDef } from './types';

/** RFC 4180-ish parser: quoted cells, escaped quotes, CRLF/LF. First row is the header. */
export function parseCsv(text: string): Record<string, string>[] {
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

export const toCsv = (header: string[], rows: unknown[][]) =>
  [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

/** Imports CSV files (Letterboxd export or the generic TRACKR format) into the library. */
export function importCsvFiles(files: { name: string; text: string }[], items: TrackrItem[], p: ProviderDef, at: number) {
  const next = [...items];
  let added = 0;
  let updated = 0;
  for (const f of files) {
    const fname = f.name.toLowerCase();
    for (const row of parseCsv(f.text)) {
      const title = row.Name ?? row.Title ?? row.title ?? row.name;
      if (!title) continue;
      const rowType = row.Type as MediaType;
      const type: MediaType = MEDIA_TYPES.includes(rowType) ? rowType : p.covers[0];
      const status: MediaStatus = MEDIA_STATUSES.includes(row.Status as MediaStatus) ? row.Status as MediaStatus
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

export interface ExportFile {
  filename: string;
  content: string;
}

export function buildExport(items: TrackrItem[], p: ProviderDef, kind: 'watched' | 'watchlist', now = Date.now()): ExportFile {
  const own = items.filter(i => p.covers.includes(i.type));
  const stamp = new Date(now).toISOString().slice(0, 10);
  if (p.csv === 'letterboxd') {
    // Columns accepted by the Letterboxd importer (letterboxd.com/import)
    if (kind === 'watchlist') {
      const rows = own.filter(i => i.myStatus === 'backlog').map(i => [i.title, i.year]);
      return { filename: `trackr-letterboxd-watchlist-${stamp}.csv`, content: toCsv(['Title', 'Year'], rows) };
    }
    const rows = own.filter(i => i.myStatus === 'completed')
      .map(i => [i.title, i.year, i.myRating ?? '', new Date(i.updatedAt ?? now).toISOString().slice(0, 10), i.notes ?? '']);
    return { filename: `trackr-letterboxd-watched-${stamp}.csv`, content: toCsv(['Title', 'Year', 'Rating', 'WatchedDate', 'Review'], rows) };
  }
  const rows = own.map(i => [i.title, i.year, i.type, i.myStatus, i.myRating ?? '', i.progress ?? '', i.notes ?? '']);
  return { filename: `trackr-${p.id}-${stamp}.csv`, content: toCsv(['Title', 'Year', 'Type', 'Status', 'Rating', 'Progress', 'Notes'], rows) };
}
