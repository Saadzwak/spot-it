// ============================================================================
// Spot.it — Edge Function: profil
//
// POST (authenticated) { user_id?: string } → { taste, swipe_count, updated }
//
// Recomputes a consumer's taste from their swipe_events using the deterministic
// SGD mirror (same math as apply_swipe RPC and applySwipeLocal in features.ts).
// Writes the result back to profiles.taste.
//
// TODO (LLM path): When ANTHROPIC_API_KEY is present and swipe_count ≥ threshold,
// call claude-haiku-4-5 to synthesise free-text intent from accepted-offer patterns
// and store it in profiles.intent. For now this path is a no-op stub; the
// deterministic recompute always runs.
//
// This function runs mock-first (no key required). Designed to be called:
//   • On-demand (e.g. after onboarding, or by the dashboard)
//   • Via cron / scheduled Edge Function invocation (future)
// ============================================================================
// deno-lint-ignore-file no-explicit-any

import { corsOPTIONS, corsJSON } from '../_shared/cors.ts';
import { adminClient, userClient } from '../_shared/supabase.ts';
import { offerToFeatures, score, sigmoid, Taste, FeatureVector, OfferRow, DEFAULT_ETA, BIAS } from '../_shared/features.ts';

// ── SGD recompute from raw swipe_events ──────────────────────────────────────
// Mirrors apply_swipe (0003_rpc.sql) and applySwipeLocal (features.ts).
// w_i ← w_i + η·(y − p)·x_i,   bias ← bias + η·(y − p)
function recomputeTaste(
  events: Array<{ action: string; offer_snapshot: Record<string, number> }>,
): Taste {
  let taste: Taste = {};
  for (const event of events) {
    const x: FeatureVector = event.offer_snapshot;
    const y = event.action === 'accept' ? 1 : 0;
    const p = score(taste, x);
    const err = y - p;
    const eta = DEFAULT_ETA;
    const next: Taste = { ...taste };
    for (const k in x) {
      next[k] = round6((next[k] ?? 0) + eta * err * x[k]);
    }
    next[BIAS] = round6((next[BIAS] ?? 0) + eta * err);
    taste = next;
  }
  return taste;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return corsOPTIONS();

  try {
    // 1. Verify JWT
    const supaUser = userClient(req);
    const { data: { user }, error: authErr } = await supaUser.auth.getUser();
    if (authErr || !user) {
      return corsJSON({ error: 'Unauthorized' }, 401);
    }

    // 2. Parse body (user_id optional: defaults to caller)
    let body: { user_id?: string } = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const targetUserId = body.user_id ?? user.id;

    // 3. Only the caller themselves may trigger a recompute (or service-level calls).
    //    We do not expose other users' swipe data.
    if (targetUserId !== user.id) {
      return corsJSON({ error: 'Forbidden: can only recompute own profile' }, 403);
    }

    const supaAdmin = adminClient();

    // 4. Fetch all swipe_events for this user (ordered by ts asc for SGD replay)
    const { data: events, error: evErr } = await supaAdmin
      .from('swipe_events')
      .select('action, offer_snapshot')
      .eq('user_id', targetUserId)
      .order('ts', { ascending: true });

    if (evErr) {
      console.error('[profil] swipe_events fetch error:', evErr.message);
      return corsJSON({ error: 'Failed to fetch swipe events' }, 500);
    }

    const swipeEvents = (events ?? []) as Array<{
      action: string;
      offer_snapshot: Record<string, number>;
    }>;

    // 5. Deterministic SGD recompute
    // Guard: if no swipe_events yet, preserve the existing seeded taste rather than
    // overwriting with an empty {} (which would destroy the cold-start onboarding bias).
    if (swipeEvents.length === 0) {
      const { data: existing } = await supaAdmin
        .from('profiles')
        .select('taste')
        .eq('id', targetUserId)
        .single();
      return corsJSON({
        user_id: targetUserId,
        swipe_count: 0,
        taste: existing?.taste ?? {},
        updated: false,
        mocked: false,
        note: 'No swipe events yet — existing taste preserved.',
      });
    }

    const taste = recomputeTaste(swipeEvents);

    // 6. Write back to profiles.taste
    const { error: upErr } = await supaAdmin
      .from('profiles')
      .update({ taste })
      .eq('id', targetUserId);

    if (upErr) {
      console.error('[profil] profiles update error:', upErr.message);
      return corsJSON({ error: 'Failed to update profile' }, 500);
    }

    // 7. TODO (LLM path) ──────────────────────────────────────────────────────
    // When ANTHROPIC_API_KEY is set and swipeEvents.length >= 20:
    //   • call claude-haiku-4-5 with a summary of the user's accepted offers
    //   • extract free-text intent (e.g. "mode urbaine, sneakers, budget 50-100€")
    //   • update profiles.intent with the LLM output
    // This is left as a stub — the function is fully operational without it.
    // ─────────────────────────────────────────────────────────────────────────

    return corsJSON({
      user_id: targetUserId,
      swipe_count: swipeEvents.length,
      taste,
      updated: true,
      mocked: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[profil] Error:', message);
    return corsJSON({ error: 'Internal server error', detail: message }, 500);
  }
});
