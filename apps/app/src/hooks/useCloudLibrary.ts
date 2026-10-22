import { useEffect } from 'react';
import { diffLibraries, errMsg, mergeLibraries } from '@trackr/core';
import { useTrackr } from '@/store/useTrackr';
import { useAccount } from '@/store/useAccount';
import { deleteCloudItems, fetchCloudLibrary, upsertCloudItems } from '@/services/cloudLibrary';

const PUSH_DEBOUNCE_MS = 800;

const hydrated = () => new Promise<void>(resolve => {
  if (useTrackr.persist.hasHydrated()) resolve();
  else useTrackr.persist.onFinishHydration(() => resolve());
});

/**
 * While signed in, keeps the cloud library equal to the device library:
 * merges both on sign-in, then pushes every local change after a short pause.
 */
export function useCloudLibrary() {
  const userId = useAccount(s => s.profile?.id);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (e: unknown) => useTrackr.getState().notify('acc_cloud_err', { e: errMsg(e) });

    const start = async () => {
      await hydrated();
      let synced: ReturnType<typeof useTrackr.getState>['items'];
      try {
        const cloud = await fetchCloudLibrary(userId);
        if (cancelled) return;
        synced = mergeLibraries(useTrackr.getState().items, cloud);
        useTrackr.setState({ items: synced });
        await upsertCloudItems(userId, diffLibraries(cloud, synced).upserts);
        useTrackr.getState().notify('acc_synced');
      } catch (e) {
        return fail(e);
      }
      if (cancelled) return;

      const push = async () => {
        const next = useTrackr.getState().items;
        const { upserts, deletes } = diffLibraries(synced, next);
        try {
          await upsertCloudItems(userId, upserts);
          await deleteCloudItems(userId, deletes);
          synced = next;
        } catch (e) {
          fail(e);
        }
      };
      unsubscribe = useTrackr.subscribe((s, prev) => {
        if (s.items === prev.items) return;
        clearTimeout(timer);
        timer = setTimeout(push, PUSH_DEBOUNCE_MS);
      });
    };

    void start();
    return () => {
      cancelled = true;
      unsubscribe?.();
      clearTimeout(timer);
    };
  }, [userId]);
}
