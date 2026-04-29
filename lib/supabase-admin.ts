/**
 * SERVER-ONLY Supabase admin client using the SERVICE ROLE key.
 *
 * The service role key BYPASSES Row Level Security entirely. This file must
 * never be imported by a client component or any file inside /components or
 * /app that is not a route handler (route.ts).
 *
 * Valid import sites:
 *   app/api/checkout/route.ts
 *   app/api/webhook/stripe/route.ts
 *   app/api/admin/remove/route.ts
 *   lib/queries.ts  (server-only helper)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase service role credentials are not configured " +
        "(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  _serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}
