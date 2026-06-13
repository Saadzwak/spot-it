// ============================================================================
// Spot.it — bandit / apprentissage en ligne  (FROZEN CONTRACT)
// Modèle linéaire par feature-VALEUR + SGD logistique + epsilon-greedy.
// ⚠️ Doit rester le MIROIR EXACT de public.apply_swipe (0003_rpc.sql):
//    mêmes clés de features, même règle w_i += η·(y−p)·x_i, même η=0.4.
// ============================================================================

import type { Offer, Taste, FeatureVector, Category, PriceBand, OfferType, DistBand } from '../types/contracts';

export const DEFAULT_ETA = 0.4;
export const BIAS = 'bias';
export const SPONSORED = 'sponsored';

// ── Clés de features (une dimension par VALEUR) ──
export const catKey = (c: Category | string) => `cat:${c}`;
export const priceBandKey = (b: PriceBand | string) => `price_band:${b}`;
export const offerTypeKey = (t: OfferType | string) => `offer_type:${t}`;
export const distBandKey = (b: DistBand | string) => `dist_band:${b}`;

/** brand → slug ASCII stable (accents/espaces retirés). Doit matcher le seed. */
export function brandSlug(brand: string): string {
  return brand
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export const brandKey = (brand: string) => `brand:${brandSlug(brand)}`;

/** Bande de distance dynamique (depuis la position user). */
export function distBandOf(distanceM?: number): DistBand | null {
  if (distanceM == null) return null;
  if (distanceM < 400) return '<400';
  if (distanceM < 800) return '400-800';
  if (distanceM < 1500) return '800-1500';
  return '1500+';
}

/**
 * Offre → vecteur one-hot x (clés actives = 1).
 * distanceM optionnel : si fourni, ajoute dist_band (sinon offer.distanceM).
 */
export function offerToFeatures(offer: Offer, distanceM?: number): FeatureVector {
  const x: FeatureVector = {};
  x[catKey(offer.category)] = 1;
  x[brandKey(offer.brand)] = 1;
  x[priceBandKey(offer.priceBand)] = 1;
  x[offerTypeKey(offer.offerType)] = 1;
  if (offer.sponsored) x[SPONSORED] = 1;
  const db = distBandOf(distanceM ?? offer.distanceM);
  if (db) x[distBandKey(db)] = 1;
  return x;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** z = bias + Σ w_i·x_i ; score(offer) = σ(z) ∈ (0,1) — utilisé pour le RANG. */
export function score(taste: Taste, x: FeatureVector): number {
  let z = taste[BIAS] ?? 0;
  for (const k in x) z += (taste[k] ?? 0) * x[k];
  return sigmoid(z);
}

/**
 * Update SGD logistique côté client (miroir de apply_swipe).
 * Renvoie un NOUVEAU taste (immutable). y = accept?1:0.
 * w_i ← w_i + η·(y−p)·x_i ; bias ← bias + η·(y−p).
 */
export function applySwipeLocal(taste: Taste, x: FeatureVector, accepted: boolean, eta = DEFAULT_ETA): Taste {
  const y = accepted ? 1 : 0;
  const p = score(taste, x);          // pré-update
  const err = y - p;
  const next: Taste = { ...taste };
  for (const k in x) next[k] = round6((next[k] ?? 0) + eta * err * x[k]);
  next[BIAS] = round6((next[BIAS] ?? 0) + eta * err);
  return next;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Seed cold-start depuis les choix d'onboarding (clés → +1.0). */
export function seedFromOnboarding(picks: string[]): Taste {
  const t: Taste = {};
  for (const k of picks) t[k] = 1.0;
  return t;
}

// ── "Pourquoi pour toi" : argmax sur les features actives (hors bias/sponsored) ──
const REASON_CAT: Record<string, string> = {
  mode: 'Parce que vous aimez la mode',
  tech: 'Parce que la tech vous parle',
  maison: 'Pour votre intérieur',
  beaute: 'Vous explorez la beauté en ce moment',
};
const REASON_OFFER: Record<string, string> = {
  discount: 'Vous adorez les bonnes remises',
  gift: 'Un cadeau offert, ça vous parle',
  voucher: 'Les bons d’achat, votre truc',
  exclusive: 'Vous aimez les offres exclusives',
  bogo: 'Deux pour le prix d’un, pile pour vous',
};

/** Retourne la raison FR dominante pour cette offre selon le profil courant. */
export function reasonFor(taste: Taste, offer: Offer, distanceM?: number): string {
  const x = offerToFeatures(offer, distanceM);
  let bestKey: string | null = null;
  let bestVal = -Infinity;
  for (const k in x) {
    if (k === SPONSORED || k === BIAS) continue;
    const contrib = (taste[k] ?? 0) * x[k];
    if (contrib > bestVal) { bestVal = contrib; bestKey = k; }
  }
  if (!bestKey || bestVal <= 0) return offer.whyTemplate ?? 'Repéré près de vous';
  if (bestKey.startsWith('cat:')) return REASON_CAT[offer.category] ?? 'Dans vos goûts';
  if (bestKey.startsWith('brand:')) return `Parce que vous suivez ${offer.brand}`;
  if (bestKey.startsWith('offer_type:')) return REASON_OFFER[offer.offerType] ?? 'Une offre pour vous';
  if (bestKey.startsWith('price_band:')) return 'Pile dans votre budget';
  if (bestKey === 'dist_band:<400') return 'À deux pas de vous';
  if (bestKey.startsWith('dist_band:')) return 'À quelques minutes à pied';
  return offer.whyTemplate ?? 'Repéré près de vous';
}

// ── Exploration vs exploitation : epsilon-greedy bas (ε₀=0.15 → ε_min=0.05) ──
export const EPSILON = { start: 0.15, min: 0.05, decay: 0.9 } as const;
export function epsilonAt(swipeCount: number): number {
  return Math.max(EPSILON.min, EPSILON.start * Math.pow(EPSILON.decay, swipeCount));
}

/** Trie les offres par score décroissant. (Le tri est l'effet visible en démo.) */
export function rankOffers(taste: Taste, offers: Offer[], distanceById?: Record<string, number>): Offer[] {
  return [...offers].sort((a, b) =>
    score(taste, offerToFeatures(b, distanceById?.[b.id])) -
    score(taste, offerToFeatures(a, distanceById?.[a.id])));
}

/**
 * Construit le deck : exploit (top trié) avec, proba ε, une offre d'exploration
 * insérée près du sommet. `rand` injectable pour des démos reproductibles.
 */
export function buildDeck(
  taste: Taste, offers: Offer[], swipeCount: number,
  rand: () => number = Math.random, distanceById?: Record<string, number>,
): Offer[] {
  const ranked = rankOffers(taste, offers, distanceById);
  if (ranked.length < 3 || rand() >= epsilonAt(swipeCount)) return ranked;
  // explore : remonter une offre aléatoire de la queue vers la position 2
  const tailStart = Math.min(3, ranked.length - 1);
  const idx = tailStart + Math.floor(rand() * (ranked.length - tailStart));
  const [pick] = ranked.splice(idx, 1);
  ranked.splice(1, 0, pick);
  return ranked;
}
