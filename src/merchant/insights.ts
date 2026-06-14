// ============================================================================
// Spot.it merchant — agrégats d'audience (RGPD : JAMAIS de donnée perso).
// Fonctions pures dérivant des distributions à partir des OfferStat + Offers.
// Marche en mock comme en réel (les mêmes stats agrégées alimentent l'UI).
// ============================================================================

import type { OfferStat, Offer, Category, PriceBand } from '@/types/contracts';

export interface Slice { id: string; label: string; value: number; pct: number; color?: string }

// Pondère chaque offre par ses acceptations (proxy de l'intérêt audience),
// puis agrège selon une clé (catégorie, tranche de prix…).
function distribute<K extends string>(
  stats: OfferStat[],
  lookup: Map<string, Offer>,
  keyOf: (o: Offer) => K,
  labelOf: (k: K) => string,
  order?: K[],
): Slice[] {
  const acc = new Map<K, number>();
  for (const s of stats) {
    const offer = lookup.get(s.offerId);
    if (!offer) continue;
    const k = keyOf(offer);
    acc.set(k, (acc.get(k) ?? 0) + s.accepts);
  }
  const total = Array.from(acc.values()).reduce((a, b) => a + b, 0) || 1;
  const keys = order ? order.filter((k) => acc.has(k)) : Array.from(acc.keys());
  return keys
    .map((k) => {
      const value = acc.get(k) ?? 0;
      return { id: k, label: labelOf(k), value, pct: value / total };
    })
    .sort((a, b) => b.value - a.value);
}

const CAT_LABEL: Record<Category, string> = {
  mode: 'Mode', tech: 'Tech', maison: 'Maison', beaute: 'Beauté',
};
const PB_LABEL: Record<PriceBand, string> = {
  '0-20': '0–20 €', '20-50': '20–50 €', '50-100': '50–100 €', '100+': '100 € +',
};
const PB_ORDER: PriceBand[] = ['0-20', '20-50', '50-100', '100+'];

export function audienceByCategory(stats: OfferStat[], lookup: Map<string, Offer>): Slice[] {
  return distribute(stats, lookup, (o) => o.category, (k) => CAT_LABEL[k]);
}

export function audienceByPriceBand(stats: OfferStat[], lookup: Map<string, Offer>): Slice[] {
  // Conserve l'ordre croissant des tranches pour la lecture.
  const raw = distribute(stats, lookup, (o) => o.priceBand, (k) => PB_LABEL[k], PB_ORDER);
  return PB_ORDER
    .map((k) => raw.find((s) => s.id === k))
    .filter((s): s is Slice => Boolean(s));
}
