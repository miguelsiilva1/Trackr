import type { ProviderDef } from './types';

export const PROVIDERS: ProviderDef[] = [
  { id: 'letterboxd', name: 'Letterboxd', domain: 'letterboxd.com', covers: ['movie'], mono: 'Lb', colors: ['#ff8000', '#40bcf4'], api: 'official_gated', csv: 'letterboxd' },
  { id: 'serializd', name: 'Serializd', domain: 'serializd.com', covers: ['series'], mono: 'Sz', colors: ['#8b5cf6', '#d946ef'], api: 'none', csv: 'generic' },
  { id: 'logg', name: 'Logg', domain: 'Logg: Game Tracker', covers: ['game'], mono: 'Lg', colors: ['#34d399', '#06b6d4'], api: 'none', csv: 'generic' },
];

export const providerById = (id: string) => PROVIDERS.find(p => p.id === id);
