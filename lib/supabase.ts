import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const publicSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _publicClient: SupabaseClient | null = null;

/**
 * Browser/server-safe Supabase client using the ANON key.
 * Respects Row Level Security. Safe to import in client components.
 * Lazily instantiated so builds without env vars still compile.
 */
function getPublicClient(): SupabaseClient {
  if (_publicClient) return _publicClient;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase public credentials missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return _publicClient;
}

/**
 * Proxy that defers createClient until first method call so module-level
 * imports work at build time even when env vars are absent.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getPublicClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
