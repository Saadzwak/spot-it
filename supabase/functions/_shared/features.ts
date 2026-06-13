// ============================================================================
// Spot.it — bandit feature math (Deno port of src/learning/features.ts)
// MUST remain a mirror: same feature keys, same SGD, same η=0.4.
// ============================================================================

export type Taste = Record<string, number>;
export type FeatureVector = Record<string, number>;

export const DEFAULT_ETA = 0.4;
export const BIAS = 'bias';
export const SPONSORED = 'sponsored';

// ── Key helpers ──────────────────────────────────────────────────────────────
export const catKey = (c: string) => `cat:${c}`;
export const priceBandKey = (b: string) => `price_band:${b}`;
export const offerTypeKey = (t: string) => `offer_type:${t}`;
export const distBandKey = (b: string) => `dist_band:${b}`;

/** brand → ASCII slug (mirrors features.ts brandSlug). */
export function brandSlug(brand: string): string {
  // NFD decomposition then strip combining characters (U+0300–U+036F range)
  return brand
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
export const brandKey = (brand: string) => `brand:${brandSlug(brand)}`;

export type DistBand = '<400' | '400-800' | '800-1500' | '1500+';

export function distBandOf(distanceM?: number): DistBand | null {
  if (distanceM == null) return null;
  if (distanceM < 400) return '<400';
  if (distanceM < 800) return '400-800';
  if (distanceM < 1500) return '800-1500';
  return '1500+';
}

export interface OfferRow {
  id: string;
  brand: string;
  category: string;
  price_band: string;
  offer_type: string;
  sponsored: boolean;
  dist_m?: number; // from nearby_stores join
}

/** Offer → one-hot feature vector. dist_m overrides offer.dist_m. */
export function offerToFeatures(offer: OfferRow, distanceM?: number): FeatureVector {
  const x: FeatureVector = {};
  x[catKey(offer.category)] = 1;
  x[brandKey(offer.brand)] = 1;
  x[priceBandKey(offer.price_band)] = 1;
  x[offerTypeKey(offer.offer_type)] = 1;
  if (offer.sponsored) x[SPONSORED] = 1;
  const dm = distanceM ?? offer.dist_m;
  const db = distBandOf(dm);
  if (db) x[distBandKey(db)] = 1;
  return x;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Score = σ(bias + Σ w_i·x_i) ∈ (0,1). */
export function score(taste: Taste, x: FeatureVector): number {
  let z = taste[BIAS] ?? 0;
  for (const k in x) z += (taste[k] ?? 0) * x[k];
  return sigmoid(z);
}

// ── "Pourquoi pour toi" (mirrors reasonFor in features.ts) ───────────────────
const REASON_CAT: Record<string, string> = {
  mode:   'Parce que vous aimez la mode',
  tech:   'Parce que la tech vous parle',
  maison: 'Pour votre intérieur',
  beaute: 'Vous explorez la beauté en ce moment',
};
const REASON_OFFER: Record<string, string> = {
  discount: 'Vous adorez les bonnes remises',
  gift:     'Un cadeau offert, ça vous parle',
  voucher:  "Les bons d'achat, votre truc",
  exclusive: 'Vous aimez les offres exclusives',
  bogo:     "Deux pour le prix d'un, pile pour vous",
};

export function reasonFor(taste: Taste, offer: OfferRow, distanceM?: number): string {
  const x = offerToFeatures(offer, distanceM);
  let bestKey: string | null = null;
  let bestVal = -Infinity;
  for (const k in x) {
    if (k === SPONSORED || k === BIAS) continue;
    const contrib = (taste[k] ?? 0) * x[k];
    if (contrib > bestVal) { bestVal = contrib; bestKey = k; }
  }
  if (!bestKey || bestVal <= 0) return 'Repéré près de vous';
  if (bestKey.startsWith('cat:')) return REASON_CAT[offer.category] ?? 'Dans vos goûts';
  if (bestKey.startsWith('brand:')) return `Parce que vous suivez ${offer.brand}`;
  if (bestKey.startsWith('offer_type:')) return REASON_OFFER[offer.offer_type] ?? 'Une offre pour vous';
  if (bestKey.startsWith('price_band:')) return 'Pile dans votre budget';
  if (bestKey === 'dist_band:<400') return 'À deux pas de vous';
  if (bestKey.startsWith('dist_band:')) return 'À quelques minutes à pied';
  return 'Repéré près de vous';
}
