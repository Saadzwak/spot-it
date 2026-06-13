// ============================================================================
// Spot.it — Supabase client factory for Edge Functions (Deno)
// ============================================================================
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/**
 * Admin client (service role): bypasses RLS.
 * Use for writes that the user cannot do via RLS
 * (e.g. recommendations_log inserts).
 */
export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * User client: runs as the caller identified by the Authorization header.
 * Use for getUser() (JWT verification) and catalogue reads under RLS.
 */
export function userClient(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  return createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
