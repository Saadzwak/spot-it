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

// ── Per-offer performance (impressions/clicks/visits/conversions/CTR) ─────────
export interface OfferPerformance {
  offerId: string;
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  ctr: number; // clicks / impressions
}

export const MOCK_OFFER_PERFORMANCE: Record<string, OfferPerformance> = {
  'veja-campo':          { offerId: 'veja-campo',          impressions: 1240, clicks: 186, visits: 62, conversions: 14, ctr: 0.150 },
  'veja-volley':         { offerId: 'veja-volley',         impressions:  890, clicks: 107, visits: 34, conversions:  8, ctr: 0.120 },
  'salar-alveomesh':     { offerId: 'salar-alveomesh',     impressions:  640, clicks:  70, visits: 22, conversions:  5, ctr: 0.109 },
  'etna-suede':          { offerId: 'etna-suede',          impressions:  510, clicks:  56, visits: 18, conversions:  4, ctr: 0.110 },
  'gt-nolyn':            { offerId: 'gt-nolyn',            impressions:  480, clicks:  53, visits: 17, conversions:  4, ctr: 0.110 },
  'nike-af1-kobe':       { offerId: 'nike-af1-kobe',       impressions: 1580, clicks: 237, visits: 82, conversions: 21, ctr: 0.150 },
  'nike-am90-laser':     { offerId: 'nike-am90-laser',     impressions: 1420, clicks: 199, visits: 65, conversions: 18, ctr: 0.140 },
  'nike-amplus-fff':     { offerId: 'nike-amplus-fff',     impressions: 1100, clicks: 132, visits: 41, conversions: 11, ctr: 0.120 },
  'nike-ava-x':          { offerId: 'nike-ava-x',          impressions:  860, clicks:  94, visits: 30, conversions:  7, ctr: 0.109 },
  'nike-mercurial-vapor17': { offerId: 'nike-mercurial-vapor17', impressions: 720, clicks: 79, visits: 25, conversions: 6, ctr: 0.110 },
  'uniqlo-parka-ultra-light': { offerId: 'uniqlo-parka-ultra-light', impressions: 980, clicks: 118, visits: 38, conversions: 10, ctr: 0.120 },
  'cos-manteau-oversize':{ offerId: 'cos-manteau-oversize', impressions: 740, clicks:  81, visits: 26, conversions:  6, ctr: 0.109 },
  'carhartt-wip-detroit-jacket': { offerId: 'carhartt-wip-detroit-jacket', impressions: 860, clicks: 112, visits: 37, conversions: 9, ctr: 0.130 },
  'apple-airpods-pro-2': { offerId: 'apple-airpods-pro-2', impressions: 1680, clicks: 235, visits: 76, conversions: 18, ctr: 0.140 },
  'samsung-galaxy-s25':  { offerId: 'samsung-galaxy-s25',  impressions: 1540, clicks: 215, visits: 70, conversions: 16, ctr: 0.140 },
  'dior-sauvage-coffret':{ offerId: 'dior-sauvage-coffret', impressions: 1020, clicks: 143, visits: 45, conversions: 12, ctr: 0.140 },
  'weber-q2200-plancha': { offerId: 'weber-q2200-plancha', impressions:  680, clicks:  68, visits: 21, conversions:  5, ctr: 0.100 },
  'lecreuset-cocotte-24cm': { offerId: 'lecreuset-cocotte-24cm', impressions: 590, clicks: 59, visits: 19, conversions: 4, ctr: 0.100 },
};

export function offerPerformanceFor(offerId: string): OfferPerformance {
  return MOCK_OFFER_PERFORMANCE[offerId] ?? {
    offerId,
    impressions: 0, clicks: 0, visits: 0, conversions: 0, ctr: 0,
  };
}

// ── Modèle de dépense (fixed + variable) ─────────────────────────────────────
export interface SpendModel {
  fixedCents: number;    // abonnement mensuel
  variableCents: number; // dépense CPC/CPM au volume
  totalCents: number;    // somme
  fixedLabel: string;
  variableLabel: string;
}

export interface SpendDayData {
  label: string;
  fixed: number;   // en centimes
  variable: number; // en centimes
}

export const MOCK_SPEND_MODEL_7J: SpendModel = {
  fixedCents: 4900,
  variableCents: 13300,
  totalCents: 18200,
  fixedLabel: 'Forfait hebdo (socle)',
  variableLabel: 'Sponsoring (CPC · clics)',
};

export const MOCK_SPEND_MODEL_30J: SpendModel = {
  fixedCents: 19600,
  variableCents: 55000,
  totalCents: 74600,
  fixedLabel: 'Forfait mensuel (socle)',
  variableLabel: 'Sponsoring (CPC · clics)',
};

// Séries journalières de dépense (fixed + variable) — 7j et 30j
export const MOCK_SPEND_DAILY_7J: SpendDayData[] = [
  { label: 'Lun', fixed: 700, variable: 1420 },
  { label: 'Mar', fixed: 700, variable: 1880 },
  { label: 'Mer', fixed: 700, variable: 1740 },
  { label: 'Jeu', fixed: 700, variable: 2140 },
  { label: 'Ven', fixed: 700, variable: 2580 },
  { label: 'Sam', fixed: 700, variable: 1640 },
  { label: 'Dim', fixed: 700, variable: 1900 },
];

const SPEND_VAR_30: number[] = [
  980, 1280, 1380, 1320, 1520, 1160,  860,
  1280, 1620, 1500, 1700, 1880, 1400, 1060,
  1400, 1780, 1660, 1820, 2060, 1520, 1180,
  1520, 1820, 1740, 1920, 2240, 1660, 1260,
  1620, 1940,
];
export const MOCK_SPEND_DAILY_30J: SpendDayData[] = SPEND_VAR_30.map((variable, i) => ({
  label: i % 7 === 0 ? `J${i + 1}` : '',
  fixed: 653, // 19600 / 30 ≈ 653
  variable,
}));

export function spendModelFor(period: Period): SpendModel {
  return period === '7j' ? MOCK_SPEND_MODEL_7J : MOCK_SPEND_MODEL_30J;
}

export function spendSeriesFor(period: Period): SpendDayData[] {
  return period === '7j' ? MOCK_SPEND_DAILY_7J : MOCK_SPEND_DAILY_30J;
}

// ── Campagnes (mode démo) ─────────────────────────────────────────────────────
export interface MerchantCampaign {
  id: string;
  categories: Category[];
  radiusM: number;
  budgetCents: number;
  spendCents: number;
  status: 'active' | 'paused';
  // Extended detail fields (optional — not set for optimistic adds)
  archetypes?: string[];
  priceBands?: PriceBand[];
  dayparts?: string[];
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export const MOCK_CAMPAIGNS: MerchantCampaign[] = [
  {
    id: 'camp-1',
    categories: ['mode'],
    radiusM: 800,
    budgetCents: 5000,
    spendCents: 3120,
    status: 'active',
    archetypes: ['malin', 'depensier'],
    priceBands: ['50-100', '100+'],
    dayparts: ['matin', 'soir'],
    impressions: 2840,
    clicks: 213,
    conversions: 11,
  },
  {
    id: 'camp-2',
    categories: ['mode', 'beaute'],
    radiusM: 1500,
    budgetCents: 8000,
    spendCents: 1450,
    status: 'paused',
    archetypes: ['standing'],
    priceBands: ['100+'],
    dayparts: ['midi', 'weekend'],
    impressions: 980,
    clicks: 68,
    conversions: 3,
  },
  {
    id: 'camp-3',
    categories: ['tech'],
    radiusM: 400,
    budgetCents: 3000,
    spendCents: 2780,
    status: 'active',
    archetypes: ['malin', 'depensier', 'standing'],
    priceBands: ['100+'],
    dayparts: ['matin', 'midi', 'soir'],
    impressions: 1680,
    clicks: 151,
    conversions: 7,
  },
];

export const ARCHETYPE_LABELS: Record<string, string> = {
  malin: "L'œil du bon plan",
  depensier: 'Dépense sans compter',
  standing: 'Question de standing',
  radin: 'Radin sur pâte',
};

export function campaignLabel(c: Pick<MerchantCampaign, 'categories' | 'radiusM'>): string {
  const cats = c.categories.map((k) => CATEGORY_LABELS[k]).join(' · ');
  const radiusStr = c.radiusM >= 1000 ? `${(c.radiusM / 1000).toLocaleString('fr-FR')} km` : `${c.radiusM} m`;
  return `${cats || 'Toutes catégories'} — ${radiusStr}`;
}
