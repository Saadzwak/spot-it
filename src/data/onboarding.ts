// onboarding.ts — questions d'onboarding ancrées psycho d'achat.
// Chaque réponse → clés de features (seedFromOnboarding → poids +1.0).
// Axes (recherche conso) : goûts • porte-monnaie (dépensier↔radin) •
// style d'achat (impulsif↔calculateur↔flâneur) • intention.
import { catKey, offerTypeKey, priceBandKey, brandKey } from '@/learning/features';

export interface TasteTag { id: string; label: string; emoji: string; picks: string[]; }
export interface Archetype { id: string; label: string; emoji: string; sub: string; picks: string[]; }

// Étape 1 — goûts (multi-select)
export const TASTE_TAGS: TasteTag[] = [
  { id: 'sneakers', label: 'Sneakers & streetwear', emoji: '👟', picks: [catKey('mode'), brandKey('Nike'), priceBandKey('50-100')] },
  { id: 'mode', label: 'Mode & créateurs', emoji: '🧥', picks: [catKey('mode')] },
  { id: 'beaute', label: 'Beauté & soin', emoji: '✨', picks: [catKey('beaute')] },
  { id: 'tech', label: 'Tech & son', emoji: '🎧', picks: [catKey('tech')] },
  { id: 'maison', label: 'Maison & déco', emoji: '🛋️', picks: [catKey('maison')] },
  { id: 'deals', label: 'Bons plans & remises', emoji: '🔥', picks: [offerTypeKey('discount'), priceBandKey('0-20'), priceBandKey('20-50')] },
  { id: 'gifts', label: 'Cadeaux offerts', emoji: '🎁', picks: [offerTypeKey('gift')] },
  { id: 'exclu', label: 'Exclusivités boutique', emoji: '💎', picks: [offerTypeKey('exclusive')] },
];

// Étape 2 — profil porte-monnaie (single-select, noms taquins mais pas ridicules)
export const WALLET_ARCHETYPES: Archetype[] = [
  { id: 'depensier', label: 'Je dépense sans compter', emoji: '💸', sub: 'Le coup de cœur d’abord, le prix après',
    picks: [offerTypeKey('exclusive'), priceBandKey('100+'), priceBandKey('50-100')] },
  { id: 'malin', label: 'L’œil du bon plan', emoji: '🦅', sub: 'Toujours le bon deal au bon moment',
    picks: [offerTypeKey('discount'), offerTypeKey('gift'), priceBandKey('20-50'), priceBandKey('50-100')] },
  { id: 'econome', label: 'Économe dans l’âme', emoji: '🐿️', sub: 'Je traque le meilleur prix, toujours',
    picks: [offerTypeKey('discount'), offerTypeKey('voucher'), priceBandKey('0-20'), priceBandKey('20-50')] },
  { id: 'standing', label: 'Question de standing', emoji: '👑', sub: 'La qualité et l’exclu, rien d’autre',
    picks: [offerTypeKey('exclusive'), priceBandKey('100+')] },
];

// Étape 3 — style d'achat (single-select)
export const BUYING_STYLES: Archetype[] = [
  { id: 'impulsif', label: 'Coup de cœur, j’achète', emoji: '⚡', sub: 'Tu vois, tu aimes, tu prends',
    picks: [offerTypeKey('discount'), offerTypeKey('gift')] },
  { id: 'calculateur', label: 'Je calcule tout', emoji: '🧮', sub: 'Tu compares avant de te lancer',
    picks: [offerTypeKey('voucher'), offerTypeKey('exclusive')] },
  { id: 'flaneur', label: 'Je flâne pour le plaisir', emoji: '🛍️', sub: 'L’expérience compte autant que l’achat',
    picks: [] },
];

export const INTENT_SUGGESTIONS = [
  'Des sneakers blanches',
  'Une veste mi-saison',
  'Un cadeau beauté',
  'Un casque audio',
  'De quoi cosy mon salon',
  'Un parfum',
];
