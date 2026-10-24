import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** True only when both public env vars are present at build time. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase client, or `null` when the app is not configured.
 *
 * The game must stay fully playable offline, so every caller has to handle the
 * `null` case and fall back to the local save service.
 *
 * SECURITY: this file is bundled into the browser. Only the public `anon` key
 * may ever be referenced here — never a `service_role` key.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
