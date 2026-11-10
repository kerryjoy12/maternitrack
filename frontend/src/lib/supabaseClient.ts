/**
 * frontend/src/lib/supabaseClient.ts
 * ────────────────────────────────────
 * Singleton Supabase browser client for the Vite/React frontend.
 *
 * Uses the public anon key — safe to ship to the browser.
 * RLS policies on Supabase tables control what data each user can see.
 *
 * Usage:
 *   import { supabase } from '../lib/supabaseClient';
 *   const channel = supabase.channel('my-channel');
 */
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Check frontend/.env — real-time features will be disabled.'
  );
}

function createNoopSupabaseClient(): SupabaseClient {
  const noopChannel = {
    on() {
      return this;
    },
    subscribe(callback?: (status: string) => void) {
      callback?.('CLOSED');
      return this;
    },
  };

  return {
    auth: {
      setSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined,
          },
        },
      }),
    },
    channel: () => noopChannel as unknown as SupabaseClient['channel'] extends (...args: any[]) => infer T ? T : never,
    removeChannel: async () => null,
  } as unknown as SupabaseClient;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // We manage our own session persistence via Django JWT in AuthContext.
        // Supabase session is used solely for Realtime channel auth.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createNoopSupabaseClient();
