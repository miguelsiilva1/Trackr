import { libKey, type TrackrItem } from '@trackr/core';
import { supabase } from '@/lib/supabase';

const TABLE = 'library_items';

function client() {
  if (!supabase) throw new Error('backend not configured');
  return supabase;
}

/** The signed-in user's own library (RLS also exposes friends' rows, so filter by owner). */
export async function fetchCloudLibrary(userId: string): Promise<TrackrItem[]> {
  const { data, error } = await client().from(TABLE).select('item').eq('user_id', userId);
  if (error) throw error;
  return data.map(r => r.item as TrackrItem);
}

export async function upsertCloudItems(userId: string, items: TrackrItem[]) {
  if (!items.length) return;
  const rows = items.map(i => ({
    user_id: userId, key: libKey(i), item: i, updated_at: new Date(i.updatedAt ?? Date.now()).toISOString(),
  }));
  const { error } = await client().from(TABLE).upsert(rows);
  if (error) throw error;
}

export async function deleteCloudItems(userId: string, keys: string[]) {
  if (!keys.length) return;
  const { error } = await client().from(TABLE).delete().eq('user_id', userId).in('key', keys);
  if (error) throw error;
}
