import { describe, expect, it } from 'vitest';
import { buildExport, importCsvFiles, parseCsv, toCsv } from './csv';
import { PROVIDERS } from './providers';
import { MOCK_LIBRARY } from '../mocks/library';

const letterboxd = PROVIDERS.find(p => p.id === 'letterboxd')!;
const serializd = PROVIDERS.find(p => p.id === 'serializd')!;

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and CRLF', () => {
    const rows = parseCsv('Name,Year,Review\r\n"Dune, Part Two",2024,"He said ""wow"""\r\n');
    expect(rows).toEqual([{ Name: 'Dune, Part Two', Year: '2024', Review: 'He said "wow"' }]);
  });

  it('round-trips with toCsv', () => {
    const csv = toCsv(['Title', 'Notes'], [['A, B', 'line "q"']]);
    expect(parseCsv(csv)).toEqual([{ Title: 'A, B', Notes: 'line "q"' }]);
  });
});

describe('importCsvFiles', () => {
  it('maps a Letterboxd watchlist to backlog and ratings to completed', () => {
    const files = [
      { name: 'watchlist.csv', text: 'Date,Name,Year,Letterboxd URI\n2026-01-01,Aftersun,2022,https://boxd.it/x' },
      { name: 'ratings.csv', text: 'Date,Name,Year,Letterboxd URI,Rating\n2026-01-02,Oppenheimer,2023,https://boxd.it/y,3.5' },
    ];
    const { items, added, updated } = importCsvFiles(files, MOCK_LIBRARY, letterboxd, 42);
    expect(added).toBe(1);
    expect(updated).toBe(1);
    expect(items.find(i => i.title === 'Aftersun')).toMatchObject({ myStatus: 'backlog', type: 'movie' });
    expect(items.find(i => i.title === 'Oppenheimer')).toMatchObject({ myStatus: 'completed', myRating: 3.5, updatedAt: 42 });
  });

  it('never downgrades a completed title from a watchlist file', () => {
    const files = [{ name: 'watchlist.csv', text: 'Name,Year\nInterstellar,2014' }];
    const { items } = importCsvFiles(files, MOCK_LIBRARY, letterboxd, 1);
    expect(items.find(i => i.title === 'Interstellar')?.myStatus).toBe('completed');
  });
});

describe('buildExport', () => {
  it('builds the Letterboxd importer format for watched films', () => {
    const { filename, content } = buildExport(MOCK_LIBRARY, letterboxd, 'watched', Date.UTC(2026, 9, 22));
    expect(filename).toBe('trackr-letterboxd-watched-2026-10-22.csv');
    expect(content.split('\n')[0]).toBe('Title,Year,Rating,WatchedDate,Review');
    expect(content).toContain('Interstellar,2014,5,');
    expect(content).not.toContain('Oppenheimer');
  });

  it('builds the generic format with only covered types', () => {
    const { content } = buildExport(MOCK_LIBRARY, serializd, 'watched');
    const rows = parseCsv(content);
    expect(rows.every(r => r.Type === 'series')).toBe(true);
    expect(rows).toHaveLength(MOCK_LIBRARY.filter(i => i.type === 'series').length);
  });
});
