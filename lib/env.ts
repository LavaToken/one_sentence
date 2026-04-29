/**
 * Server-side environment variable validation.
 * Import this at the top of any API route handler that needs these values.
 * It throws at call time (not module load time) so Next.js builds without
 * env vars still compile; but every real request will get a clear error
 * instead of a cryptic undefined-related crash.
 *
 * NEVER import this file from any client component.
 */

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export function getServerEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),
    adminSecret: requireEnv("ADMIN_SECRET"),
    siteUrl: requireEnv("NEXT_PUBLIC_SITE_URL"),
  };
}
