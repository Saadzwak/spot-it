// recommend.ts — pont vers le cerveau (Edge Function) avec REPLI LOCAL.
// M0 (sans backend) : ranking + "Pourquoi" calculés localement via le bandit.
// Backend activé : appelle la fonction `recommend` ; en cas d'erreur → repli local.
import type { Offer, RecommendRequest, RecommendResponse, Taste, FeatureVector, SwipeAction } from '@/types/contracts';
import { rankOffers, offerToFeatures, score, reasonFor } from '@/learning/features';
import { getSupabase } from '@/lib/supabase';
import { hasSupabase } from '@/lib/env';
import { DEMO_USER } from '@/data/offers.seed';

export function localRecommend(taste: Taste, offers: Offer[]): RecommendResponse {
  const ranked = rankOffers(taste, offers);
  return {
    ranking: ranked.map((o, i) => ({ offerId: o.id, score: score(taste, offerToFeatures(o)), rank: i })),
    reasons: ranked.map((o) => ({ offerId: o.id, reasonFr: reasonFor(taste, o) })),
    generatedAt: new Date().toISOString(),
    model: { decision: 'local-bandit', generation: 'local-template' },
    mocked: true,
  };
}

export async function getRecommendations(
  taste: Taste,
  offers: Offer[],
  req: Partial<RecommendRequest> = {},
): Promise<RecommendResponse> {
  const sb = getSupabase();
  if (hasSupabase() && sb) {
    try {
      const body: RecommendRequest = {
        lat: req.lat ?? DEMO_USER.lat,
        lng: req.lng ?? DEMO_USER.lng,
        intent: req.intent,
        taste,
        candidateOfferIds: req.candidateOfferIds,
        context: req.context,
      };
      const { data, error } = await sb.functions.invoke('recommend', { body });
      if (!error && data) return data as RecommendResponse;
    } catch {
      /* repli local ci-dessous */
    }
  }
  return localRecommend(taste, offers);
}

/** Persiste un swipe côté serveur (apply_swipe) si backend + session ; sinon no-op. */
export async function persistSwipeRemote(
  offerId: string, action: SwipeAction, x: FeatureVector,
): Promise<void> {
  const sb = getSupabase();
  if (!hasSupabase() || !sb) return;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.rpc('apply_swipe', { p_user: user.id, p_offer: offerId, p_action: action, p_x: x });
  } catch {
    /* best-effort : l'état local reste la source de vérité en démo */
  }
}
