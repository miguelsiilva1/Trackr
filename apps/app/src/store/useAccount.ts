import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useTrackr } from './useTrackr';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
}

interface AccountState {
  /** `off` = no backend configured. */
  status: 'off' | 'loading' | 'signed_out' | 'signed_in';
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves `confirm_email` when the project requires email confirmation before the first sign-in. */
  signUp: (email: string, password: string, username: string) => Promise<'signed_in' | 'confirm_email'>;
  signOut: () => Promise<void>;
}

export const useAccount = create<AccountState>()(set => {
  const load = async (session: Session | null) => {
    if (!supabase || !session) return set({ status: 'signed_out', profile: null });
    const { data, error } = await supabase.from('profiles').select('id, username, display_name').eq('id', session.user.id).single();
    if (error) return set({ status: 'signed_out', profile: null });
    set({ status: 'signed_in', profile: { id: data.id, username: data.username, displayName: data.display_name } });
  };

  // Fires once with the stored session, then on every sign-in/out. Supabase calls must not run inside the callback itself.
  supabase?.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      // Clear only once the session is really gone and the profile is null, so the cloud hook has stopped.
      void load(session).then(() => {
        if (event === 'SIGNED_OUT') useTrackr.setState({ items: [], libraryOwner: null });
      });
    }, 0);
  });

  return {
    status: supabase ? 'loading' : 'off',
    profile: null,

    signIn: async (email, password) => {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    signUp: async (email, password, username) => {
      const { data, error } = await supabase!.auth.signUp({
        email, password, options: { data: { username, display_name: username } },
      });
      if (error) throw error;
      return data.session ? 'signed_in' : 'confirm_email';
    },

    signOut: async () => {
      // On success the SIGNED_OUT event clears the device library: it lives in the account now.
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
    },
  };
});
