// ============================================================================
// Spot.it merchant — mock data (mirrors supabase/seed.sql KPI values)
// Used when hasSupabase() is false (M0 / demo mode).
// Tout est déterministe → la démo est stable, aucune dépendance réseau.
// ============================================================================

import type { StoreKpis, OfferStat, Category, PriceBand } from '@/types/contracts';
import { OFFERS } from '@/data/offers.seed';

// ── Demo anchor store (Sandro c0000000-…0001) ────────────────────────────────
export const DEMO_STORE_ID = 'c0000000-0000-0000-0000-000000000001';
export const DEMO_MERCHANT_ID = 'b0000000-0000-0000-0000-000000000001';

// ── Période d'analyse ─────────────────────────────────────────────────────────
export type Period = '7j' | '30j';

// ── KPIs par période (courant + précédent → variation) ───────────────────────
// 7j courant = miroir de seed.sql store_kpis row 1 (Sandro).
// Le précédent est légèrement plus bas → variations positives et crédibles.
interface KpiPair { current: StoreKpis; previous: StoreKpis }

function kpis(
  impressions: number, clicks: number, visits: number,
  conversions: number, spendCents: number, revenueCents: number,
): StoreKpis {
  return {
    storeId: DEMO_STORE_ID,
    impressions, clicks, visits, conversions, spendCents, revenueCents,
    updatedAt: new Date().toISOString(),
  };
}

export const MOCK_KPIS_BY_PERIOD: Record<Period, KpiPair> = {
  '7j': {
    current:  kpis(4820, 312, 88, 19, 18200, 142600),
    previous: kpis(4310, 268, 71, 14, 17400, 109800),
  },
  '30j': {
    current:  kpis(19840, 1284, 372, 86, 74600, 612400),
    previous: kpis(18120, 1196, 348, 79, 71200, 548900),
  },
};

// Conservé pour compat (mode démo, période par défaut 7j).
export const MOCK_STORE_KPIS: StoreKpis = MOCK_KPIS_BY_PERIOD['7j'].current;

// ── Séries journalières d'impressions ─────────────────────────────────────────
// 7 points (Lun→Dim) + 30 points (jour glissant). Bandes Views, pas de lib.
export const MOCK_DAILY_IMPRESSIONS: { label: string; value: number }[] = [
  { label: 'Lun', value: 580 },
  { label: 'Mar', value: 720 },
  { label: 'Mer', value: 690 },
  { label: 'Jeu', value: 810 },
  { label: 'Ven', value: 940 },
  { label: 'Sam', value: 640 },
  { label: 'Dim', value: 440 },
];

// 30 jours — ramp doux avec creux week-end (déterministe).
const SERIES_30: number[] = [
  410, 520, 560, 540, 610, 470, 360,
  520, 640, 600, 680, 740, 560, 430,
  560, 700, 660, 720, 810, 600, 470,
  600, 720, 690, 760, 880, 650, 500,
  640, 760,
];
export const MOCK_DAILY_IMPRESSIONS_30: { label: string; value: number }[] =
  SERIES_30.map((value, i) => ({ label: i % 7 === 0 ? `J${i + 1}` : '', value }));

export function dailySeriesFor(period: Period): { label: string; value: number }[] {
  return period === '7j' ? MOCK_DAILY_IMPRESSIONS : MOCK_DAILY_IMPRESSIONS_30;
}

// ── OfferStat[] — using seed slug ids (matches OFFERS from offers.seed.ts) ───
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
export const MOCK_MERCHANT_OFFERS = OFFERS;

// ── ROI helper (× retour : revenue / spend) ───────────────────────────────────
export function calcRoiMultiplier(spendCents: number, revenueCents: number): number {
  if (spendCents <= 0) return 0;
  return Math.round((revenueCents / spendCents) * 10) / 10;
}

// ── Répartition d'audience par ARCHÉTYPE d'acheteur (agrégat, RGPD) ───────────
// Aucune donnée perso : pourcentages agrégés de l'audience touchée.
// Archétypes alignés sur src/data/onboarding.ts (WALLET_ARCHETYPES).
export interface ArchetypeShare { id: string; label: string; emoji: string; pct: number }
export const MOCK_ARCHETYPE_SHARES: ArchetypeShare[] = [
  { id: 'malin',     label: 'L’œil du bon plan',      emoji: '🦅', pct: 0.38 },
  { id: 'depensier', label: 'Dépense sans compter',   emoji: '💸', pct: 0.27 },
  { id: 'standing',  label: 'Question de standing',   emoji: '👑', pct: 0.21 },
  { id: 'radin',     label: 'Radin sur pâte',         emoji: '🧀', pct: 0.14 },
];

// Libellés FR des tranches de prix (affichage agrégats).
export const PRICE_BAND_LABELS: Record<PriceBand, string> = {
  '0-20':   '0–20 €',
  '20-50':  '20–50 €',
  '50-100': '50–100 €',
  '100+':   '100 € +',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  mode:   'Mode',
  tech:   'Tech',
  maison: 'Maison',
  beaute: 'Beauté',
};
