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
        // Only merge device data that is anonymous or already this account's; never upload another account's library.
        const { items, libraryOwner } = useTrackr.getState();
        synced = mergeLibraries(!libraryOwner || libraryOwner === userId ? items : [], cloud);
        useTrackr.setState({ items: synced, libraryOwner: userId });
        await upsertCloudItems(userId, diffLibraries(cloud, synced).upserts);
        useTrackr.getState().notify('acc_synced');
      } catch (e) {
        return fail(e);
      }
      if (cancelled) return;

      const push = async () => {
        // Sign-out empties the device library; that must never be pushed as a mass delete.
        if (useAccount.getState().profile?.id !== userId) return;
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
