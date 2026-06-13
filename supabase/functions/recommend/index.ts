// ============================================================================
// Spot.it — Edge Function: recommend
//
// POST (authenticated) → RecommendResponse (contracts.ts)
//
// Pipeline:
//   1. Verify caller JWT (401 if missing/invalid)
//   2. Catalogue: nearby_stores + offers (PostGIS) — fallback to all active
//   3. DÉCISION: claude-haiku-4-5 → JSON ranking
//   4. GÉNÉRATION: claude-sonnet-4-6 → reasons (FR)
//   5. Write recommendations_log (service role)
//   6. Return RecommendResponse
//
// MOCK FALLBACK (no ANTHROPIC_API_KEY): local feature scoring + reasonFor.
//   Same response shape, mocked:true.
// ============================================================================
// deno-lint-ignore-file no-explicit-any

import { corsOPTIONS, corsJSON } from '../_shared/cors.ts';
import { adminClient, userClient } from '../_shared/supabase.ts';
import { hasApiKey, callAnthropic, extractJSON } from '../_shared/anthropic.ts';
import {
  offerToFeatures, score, reasonFor, Taste, OfferRow,
} from '../_shared/features.ts';

// ── Types mirroring contracts.ts (no cross-boundary import in Deno) ───────────
interface RecommendRequest {
  lat: number;
  lng: number;
  intent?: string;
  taste?: Taste;
  candidateOfferIds?: string[];
  context?: { timeOfDay?: string; sessionId?: string };
}
interface RankedOffer { offerId: string; score: number; rank: number; }
interface OfferReason { offerId: string; reasonFr: string; }
interface RecommendResponse {
  ranking: RankedOffer[];
  reasons: OfferReason[];
  generatedAt: string;
  model: { decision: string; generation: string };
  mocked?: boolean;
}

// ── Offer DB row (joined from stores+offers+nearby_stores) ───────────────────
interface OfferCatalogueRow extends OfferRow {
  store_id: string;
  title: string;
  teaser: string | null;
  why_template: string | null;
}

// ── Catalogue fetch ───────────────────────────────────────────────────────────
async function fetchNearbyOffers(
  supaAdmin: ReturnType<typeof adminClient>,
  lat: number,
  lng: number,
  candidateIds?: string[],
): Promise<OfferCatalogueRow[]> {
  // 1. Try nearby stores at progressively wider radii until we have ≥3 offers.
  for (const radius of [400, 1000, 2000, 5000]) {
    const { data: stores, error } = await supaAdmin
      .rpc('nearby_stores', { lat, lng, radius_m: radius });
    if (error || !stores || stores.length === 0) continue;

    const storeIds = (stores as { id: string; dist_m: number }[]).map((s) => s.id);
    const distByStore = Object.fromEntries(
      (stores as { id: string; dist_m: number }[]).map((s) => [s.id, s.dist_m]),
    );

    let q = supaAdmin
      .from('offers')
      .select('id, store_id, brand, category, price_band, offer_type, sponsored, title, teaser, why_template')
      .eq('is_active', true)
      .in('store_id', storeIds);

    if (candidateIds && candidateIds.length > 0) {
      q = q.in('id', candidateIds);
    }

    const { data: offers, error: oErr } = await q;
    if (oErr || !offers || offers.length === 0) continue;

    // Attach dist_m from nearby_stores result
    return (offers as OfferCatalogueRow[]).map((o) => ({
      ...o,
      dist_m: distByStore[o.store_id] ?? undefined,
    }));
  }

  // 2. Fallback: all active offers (no geo filter)
  let q = supaAdmin
    .from('offers')
    .select('id, store_id, brand, category, price_band, offer_type, sponsored, title, teaser, why_template')
    .eq('is_active', true);
  if (candidateIds && candidateIds.length > 0) {
    q = q.in('id', candidateIds);
  }
  const { data: offers } = await q;
  return (offers ?? []) as OfferCatalogueRow[];
}

// ── Mock ranking (no API key) ─────────────────────────────────────────────────
function mockRanking(offers: OfferCatalogueRow[], taste: Taste): {
  ranking: RankedOffer[];
  reasons: OfferReason[];
} {
  const scored = offers.map((o) => {
    const x = offerToFeatures(o, o.dist_m);
    return { offer: o, s: score(taste, x) };
  });
  scored.sort((a, b) => b.s - a.s);

  const ranking: RankedOffer[] = scored.map((item, idx) => ({
    offerId: item.offer.id,
    score: Math.round(item.s * 10000) / 10000,
    rank: idx + 1,
  }));

  const reasons: OfferReason[] = scored.map((item) => ({
    offerId: item.offer.id,
    reasonFr: reasonFor(taste, item.offer, item.offer.dist_m),
  }));

  return { ranking, reasons };
}

// ── Agent DÉCISION — claude-haiku-4-5 → structured JSON ranking ───────────────
async function agentDecision(
  offers: OfferCatalogueRow[],
  taste: Taste,
  request: RecommendRequest,
): Promise<{ ranking: RankedOffer[]; model: string }> {
  const MODEL = 'claude-haiku-4-5';

  // Build a compact catalogue for the prompt (no PII)
  const catalogue = offers.map((o) => ({
    id: o.id,
    brand: o.brand,
    category: o.category,
    price_band: o.price_band,
    offer_type: o.offer_type,
    sponsored: o.sponsored,
    dist_m: Math.round(o.dist_m ?? 9999),
  }));

  const systemPrompt = `You are the Décision agent for Spot.it, a Paris-based offer discovery app.
Your job: rank the candidate offers for this user by predicted acceptance probability.
Return ONLY valid JSON matching the schema, no commentary.`;

  const userPrompt = `User taste weights (JSON):
${JSON.stringify(taste)}

Candidate offers (${catalogue.length}):
${JSON.stringify(catalogue)}

Context: lat=${request.lat}, lng=${request.lng}, intent=${request.intent ?? 'none'}, timeOfDay=${request.context?.timeOfDay ?? 'unknown'}

Rank all ${catalogue.length} offers by decreasing predicted acceptance. Assign score ∈ (0,1).`;

  const rankingSchema = {
    type: 'object',
    properties: {
      ranking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            offer_id: { type: 'string' },
            score: { type: 'number' },
            rank: { type: 'integer' },
          },
          required: ['offer_id', 'score', 'rank'],
        },
      },
    },
    required: ['ranking'],
  };

  const response = await callAnthropic({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    output_config: {
      format: {
        type: 'json_schema',
        json_schema: { name: 'ranking', schema: rankingSchema, strict: true },
      },
    },
  });

  const parsed = extractJSON<{ ranking: Array<{ offer_id: string; score: number; rank: number }> }>(response);

  const ranking: RankedOffer[] = parsed.ranking.map((r) => ({
    offerId: r.offer_id,
    score: r.score,
    rank: r.rank,
  }));

  return { ranking, model: MODEL };
}

// ── Agent GÉNÉRATION — claude-sonnet-4-6 → reasons FR ────────────────────────
async function agentGeneration(
  offers: OfferCatalogueRow[],
  ranking: RankedOffer[],
  taste: Taste,
  request: RecommendRequest,
): Promise<{ reasons: OfferReason[]; model: string }> {
  const MODEL = 'claude-sonnet-4-6';

  // Build map for context
  const offerMap = Object.fromEntries(offers.map((o) => [o.id, o]));
  const top = ranking.slice(0, 10); // generate reasons for top 10

  const systemPrompt = `You are the Génération agent for Spot.it. Your job: generate short, warm, personalised "Pourquoi pour toi" (Why for you) reasons in French for each ranked offer. Each reason must be ≤ 12 words, conversational, and reflect the user's taste. Return ONLY valid JSON.`;

  const offerContext = top.map((r) => {
    const o = offerMap[r.offerId];
    return o
      ? { offer_id: r.offerId, brand: o.brand, category: o.category, offer_type: o.offer_type, title: o.title, why_template: o.why_template }
      : { offer_id: r.offerId };
  });

  const userPrompt = `User taste: ${JSON.stringify(taste)}
Intent: ${request.intent ?? 'none'}

Offers to explain:
${JSON.stringify(offerContext)}

Return JSON: { "reasons": [{ "offer_id": "...", "reason_fr": "..." }, ...] }`;

  const reasonSchema = {
    type: 'object',
    properties: {
      reasons: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            offer_id: { type: 'string' },
            reason_fr: { type: 'string' },
          },
          required: ['offer_id', 'reason_fr'],
        },
      },
    },
    required: ['reasons'],
  };

  const response = await callAnthropic({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    output_config: {
      format: {
        type: 'json_schema',
        json_schema: { name: 'reasons', schema: reasonSchema, strict: true },
      },
    },
  });

  const parsed = extractJSON<{ reasons: Array<{ offer_id: string; reason_fr: string }> }>(response);

  // For offers not returned by the model, fall back to local reasonFor
  const reasonMap = Object.fromEntries(parsed.reasons.map((r) => [r.offer_id, r.reason_fr]));
  const reasons: OfferReason[] = ranking.map((r) => ({
    offerId: r.offerId,
    reasonFr: reasonMap[r.offerId] ?? reasonFor(taste, offerMap[r.offerId] ?? { id: r.offerId, brand: '', category: 'mode', price_band: '20-50', offer_type: 'discount', sponsored: false }, offerMap[r.offerId]?.dist_m),
  }));

  return { reasons, model: MODEL };
}

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

    // 2. Parse request body
    let body: RecommendRequest;
    try {
      body = await req.json() as RecommendRequest;
    } catch {
      return corsJSON({ error: 'Invalid JSON body' }, 400);
    }
    const { lat, lng, intent, taste: reqTaste, candidateOfferIds, context: ctx } = body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return corsJSON({ error: 'lat and lng are required numbers' }, 400);
    }

    // 3. Resolve taste: request > profiles.taste > {}
    const supaAdmin = adminClient();
    let taste: Taste = reqTaste ?? {};
    if (!reqTaste || Object.keys(reqTaste).length === 0) {
      const { data: profile } = await supaAdmin
        .from('profiles')
        .select('taste')
        .eq('id', user.id)
        .single();
      taste = (profile?.taste as Taste) ?? {};
    }

    // 4. Fetch candidate offers
    const offers = await fetchNearbyOffers(supaAdmin, lat, lng, candidateOfferIds);
    if (offers.length === 0) {
      return corsJSON({ error: 'No active offers found' }, 404);
    }

    // 5. DÉCISION + GÉNÉRATION (real or mock)
    let ranking: RankedOffer[];
    let reasons: OfferReason[];
    let decisionModel: string;
    let generationModel: string;
    let mocked: boolean | undefined;

    if (!hasApiKey()) {
      // ── MOCK PATH (no key) ────────────────────────────────────────────────
      const mock = mockRanking(offers, taste);
      ranking = mock.ranking;
      reasons = mock.reasons;
      decisionModel = 'mock:local-scorer';
      generationModel = 'mock:reason-for';
      mocked = true;
    } else {
      // ── LIVE PATH ─────────────────────────────────────────────────────────
      const decisionResult = await agentDecision(offers, taste, body);
      ranking = decisionResult.ranking;
      decisionModel = decisionResult.model;

      const genResult = await agentGeneration(offers, ranking, taste, body);
      reasons = genResult.reasons;
      generationModel = genResult.model;
    }

    // 6. Write recommendations_log (service role — RLS only allows consumer SELECT)
    const offerIds = ranking.map((r) => r.offerId);
    await supaAdmin.from('recommendations_log').insert({
      user_id: user.id,
      offer_ids: offerIds,
      rationale: {
        lat, lng, intent, context: ctx,
        taste_keys: Object.keys(taste),
        candidate_count: offers.length,
        mocked: mocked ?? false,
      },
      model: mocked ? 'mock' : `${decisionModel}+${generationModel}`,
    });

    // 7. Return RecommendResponse
    const response: RecommendResponse = {
      ranking,
      reasons,
      generatedAt: new Date().toISOString(),
      model: { decision: decisionModel, generation: generationModel },
      ...(mocked ? { mocked: true } : {}),
    };

    return corsJSON(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[recommend] Error:', message);
    return corsJSON({ error: 'Internal server error', detail: message }, 500);
  }
});
