// ============================================================================
// Spot.it — shared TYPE contracts  (FROZEN)
// Mirror of supabase/migrations/0001_schema.sql + the recommend Edge Function.
// Every sub-agent imports from here. Change here = change the contract (commit).
// ============================================================================

export type Category = 'mode' | 'tech' | 'maison' | 'beaute';
export type PriceBand = '0-20' | '20-50' | '50-100' | '100+';
export type OfferType = 'discount' | 'gift' | 'voucher' | 'exclusive' | 'bogo';
export type DistBand = '<400' | '400-800' | '800-1500' | '1500+';
export type SwipeAction = 'accept' | 'reject';

export interface Wordmark {
  text?: string;
  spacing?: number;
  weight?: number;
  italic?: boolean;
  serif?: boolean;
  size?: number;
}

/** Offre — face app (miroir de la table offers + champs d'affichage de data.jsx). */
export interface Offer {
  id: string;
  storeId?: string;
  brand: string;
  title: string;            // texte de l'offre : "-20% sur la nouvelle collection"
  teaser?: string;
  // ── features canoniques (entrées du bandit, cf. CONTRACTS.md §2) ──
  category: Category;
  priceBand: PriceBand;
  offerType: OfferType;
  sponsored: boolean;
  // ── affichage ──
  whyTemplate?: string;     // "Pourquoi" de secours si pas d'agent / réseau
  grad: [string, string];   // duotone fallback (si pas d'image)
  ink: string;
  wordmark: Wordmark;
  image?: string;           // URL photo réelle (produit/boutique) — sinon fallback duotone
  address?: string;
  description?: string;
  // ── géo ──
  lat?: number;
  lng?: number;
  distanceM?: number;       // dynamique (depuis position user) ; seed peut précalculer
  walkMin?: number;
  // ── tags libres pour des sélections curées (ex. 'fathers-day') ──
  tags?: string[];
}

/** Profil de goûts = poids sparse par feature-VALEUR (one-hot). */
export type Taste = Record<string, number>;

/** Vecteur d'offre one-hot : clés actives → 1. (cf. src/learning/features.ts) */
export type FeatureVector = Record<string, number>;

export interface Consent {
  location: boolean;
  personalization: boolean;
  share_data: boolean;      // OFF par défaut (design README)
}

export interface Profile {
  id: string;
  role: 'consumer' | 'merchant';
  displayName?: string;
  intent?: string;
  taste: Taste;
  consent: Consent;
}

// ── Edge Function `recommend` (POST) — clé Anthropic côté serveur uniquement ──
export interface RecommendRequest {
  lat: number;
  lng: number;
  intent?: string;
  taste?: Taste;                 // optionnel ; le serveur peut lire profiles.taste
  candidateOfferIds?: string[];  // optionnel : restreindre le pool
  context?: { timeOfDay?: string; sessionId?: string };
}
export interface RankedOffer { offerId: string; score: number; rank: number; }
export interface OfferReason { offerId: string; reasonFr: string; }
export interface RecommendResponse {
  ranking: RankedOffer[];        // Agent Décision (Haiku, JSON structuré)
  reasons: OfferReason[];        // Agent Génération (Sonnet)
  generatedAt: string;           // ISO
  model: { decision: string; generation: string };
  mocked?: boolean;              // true si pas de clé → réponse stub
}

// ── KPIs dashboard magasin (miroir de store_kpis + merchant_offer_stats) ──
export interface StoreKpis {
  storeId: string;
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  spendCents: number;
  revenueCents: number;
  updatedAt: string;
}
export interface OfferStat { offerId: string; accepts: number; rejects: number; acceptRate: number; }
