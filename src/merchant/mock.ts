// ============================================================================
// Spot.it merchant — mock data (mirrors supabase/seed.sql KPI values)
// Used when hasSupabase() is false (M0 / demo mode).
// ============================================================================

import type { StoreKpis, OfferStat } from '@/types/contracts';
import { OFFERS } from '@/data/offers.seed';

// ── Demo anchor store (Sandro c0000000-…0001) ────────────────────────────────
// We pick the first store as the primary dashboard focus, matching seed.sql row 1.
export const DEMO_STORE_ID = 'c0000000-0000-0000-0000-000000000001';
export const DEMO_MERCHANT_ID = 'b0000000-0000-0000-0000-000000000001';

// ── Aggregated KPIs (sum of all seed.sql rows, Sandro as primary) ────────────
// Matching seed.sql store_kpis row 1 (Sandro):
//   impressions=4820, clicks=312, visits=88, conversions=19
//   spend_cents=18200, revenue_cents=142600
export const MOCK_STORE_KPIS: StoreKpis = {
  storeId: DEMO_STORE_ID,
  impressions: 4820,
  clicks: 312,
  visits: 88,
  conversions: 19,
  spendCents: 18200,
  revenueCents: 142600,
  updatedAt: new Date().toISOString(),
};

// ── 7-point daily impressions series (Mon→Sun, current week) ─────────────────
// Plausible ramp with a weekend dip — sums to roughly the KPI total (7 days).
export const MOCK_DAILY_IMPRESSIONS: { label: string; value: number }[] = [
  { label: 'Lun', value: 580 },
  { label: 'Mar', value: 720 },
  { label: 'Mer', value: 690 },
  { label: 'Jeu', value: 810 },
  { label: 'Ven', value: 940 },
  { label: 'Sam', value: 640 },
  { label: 'Dim', value: 440 },
];

// ── OfferStat[] — using seed slug ids (matches OFFERS from offers.seed.ts) ───
// Realistic accept/reject numbers seeded proportionally.
export const MOCK_OFFER_STATS: OfferStat[] = [
  { offerId: 'sandro',      accepts: 142, rejects:  58, acceptRate: 0.71 },
  { offerId: 'frankie',     accepts:  96, rejects:  44, acceptRate: 0.69 },
  { offerId: 'lbm',         accepts: 128, rejects:  62, acceptRate: 0.67 },
  { offerId: 'axel',        accepts:  88, rejects:  52, acceptRate: 0.63 },
  { offerId: 'veja',        accepts:  76, rejects:  48, acceptRate: 0.61 },
  { offerId: 'nike-rivoli', accepts: 104, rejects:  72, acceptRate: 0.59 },
  { offerId: 'carhartt',    accepts:  64, rejects:  48, acceptRate: 0.57 },
  { offerId: 'sephora',     accepts:  82, rejects:  68, acceptRate: 0.55 },
  { offerId: 'newbalance',  accepts:  58, rejects:  52, acceptRate: 0.53 },
  { offerId: 'boulanger',   accepts:  48, rejects:  46, acceptRate: 0.51 },
  { offerId: 'mdm',         accepts:  36, rejects:  40, acceptRate: 0.47 },
  { offerId: 'aesop',       accepts:  30, rejects:  42, acceptRate: 0.42 },
];

// ── Offers belonging to the demo merchant (all seed offers) ──────────────────
// In mock mode the entire catalog belongs to the one demo merchant.
export const MOCK_MERCHANT_OFFERS = OFFERS;

// ── ROI helper ────────────────────────────────────────────────────────────────
// Returns the revenue-to-spend multiplier (e.g. 7.8 means "7,8× retour").
// Labelled as "ROI ×" in the UI to avoid confusing % and ×.
export function calcRoiMultiplier(spendCents: number, revenueCents: number): number {
  if (spendCents <= 0) return 0;
  return Math.round((revenueCents / spendCents) * 10) / 10;
}
