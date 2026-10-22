import { describe, expect, it } from 'vitest';
import { MOCK_LIBRARY } from '../mocks/library';
import { fetchItemDetails, mockAchievements, mockSeasons } from './details';

const byTitle = (title: string) => MOCK_LIBRARY.find(i => i.title === title)!;

describe('mock details', () => {
  it('splits the episode count from metaDuration across seasons', () => {
    const seasons = mockSeasons(byTitle('Severance')); // 2 temporadas · 19 ep
    expect(seasons.map(s => s.episodes.length)).toEqual([10, 9]);
    expect(seasons[0].episodes.every(e => e.rating >= 3.6 && e.rating <= 4.9)).toBe(true);
  });

  it('is deterministic per title', () => {
    expect(mockSeasons(byTitle('Arcane'))).toEqual(mockSeasons(byTitle('Arcane')));
    expect(mockAchievements(byTitle('Hades'), 'en')).toEqual(mockAchievements(byTitle('Hades'), 'en'));
  });

  it('orders achievements from common to rare', () => {
    const percents = mockAchievements(byTitle('Hades'), 'pt').map(a => a.percent);
    expect([...percents].sort((a, b) => b - a)).toEqual(percents);
  });

  it('falls back to mock data without keys', async () => {
    const d = await fetchItemDetails(byTitle('Hades'), { tmdb: '', rawg: '' }, 'pt');
    expect(d.source).toBe('mock');
    expect(d.achievements?.length).toBeGreaterThan(0);
    expect(d.seasons).toBeUndefined();
  });
});
