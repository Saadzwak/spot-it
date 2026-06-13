// onboarding.ts — options de goûts (étape 1) → clés de features pour le seed cold-start.
// Sélectionner des tags pré-incline le profil (seedFromOnboarding → poids +1.0).
import { catKey, offerTypeKey, priceBandKey, brandKey } from '@/learning/features';

export interface TasteTag {
  id: string;
  label: string;
  emoji: string;
  picks: string[]; // clés de features (cf. CONTRACTS §2)
}

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

export const INTENT_SUGGESTIONS = [
  'Une veste mi-saison',
  'Des sneakers blanches',
  'Un cadeau beauté',
  'Un casque audio',
  'De quoi cosy mon salon',
];
