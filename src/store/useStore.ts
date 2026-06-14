// useStore.ts — état global Spot.it (zustand + persist).
// Cœur de M0 : profil de goûts (bandit), deck à swiper, wishlist, consentement.
// Le bandit tourne 100% local (instantané) ; persistance backend best-effort.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Offer, Taste, Consent } from '@/types/contracts';
import {
  offerToFeatures, applySwipeLocal, reasonFor, buildDeck, seedFromOnboarding,
} from '@/learning/features';
import OFFERS from '@/data/offers.seed';
import { persistSwipeRemote } from '@/agents/recommend';
import { anchorOffers } from '@/geo/anchor';

const DEFAULT_CONSENT: Consent = { location: false, personalization: true, share_data: false };

interface SpotState {
  // profil
  onboarded: boolean;
  intent?: string;
  consent: Consent;
  taste: Taste;
  swipeCount: number;
  // catalogue + deck
  offers: Offer[];
  remainingIds: string[];
  deck: Offer[];
  userLoc: { lat: number; lng: number } | null;
  matchedIds: string[] | null; // sélection agent : null = pas de filtre, [] = rien ne correspond
  intentHeadline: string | null;
  // signaux
  wishlist: string[];
  liked: string[];
  redeemed: string[]; // bons générés (QR "En profiter") — historique
  lastReason: string | null;
  lastSwipe: { offerId: string; accepted: boolean } | null;

  // actions
  hydrateOffers: (offers?: Offer[]) => void;
  setUserLoc: (coords: { lat: number; lng: number }) => void;
  applyIntent: (picks: string[], summary?: string) => void;
  setMatched: (ids: string[] | null, headline?: string | null) => void;
  completeOnboarding: (picks: string[], intent?: string, consent?: Partial<Consent>) => void;
  rebuildDeck: () => void;
  swipe: (offerId: string, accepted: boolean) => void;
  toggleWishlist: (offerId: string) => void;
  markRedeemed: (offerId: string) => void;
  setConsent: (patch: Partial<Consent>) => void;
  reset: () => void;
}

export const useStore = create<SpotState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      intent: undefined,
      consent: DEFAULT_CONSENT,
      taste: {},
      swipeCount: 0,
      offers: OFFERS,
      remainingIds: OFFERS.map((o) => o.id),
      deck: [],
      userLoc: null,
      matchedIds: null,
      intentHeadline: null,
      wishlist: [],
      liked: [],
      redeemed: [],
      lastReason: null,
      lastSwipe: null,

      hydrateOffers: (offers) => {
        const list = offers && offers.length ? offers : OFFERS;
        set({ offers: list, remainingIds: list.map((o) => o.id) });
        get().rebuildDeck();
      },

      setUserLoc: (coords) => {
        const anchored = anchorOffers(OFFERS, coords);
        set({ userLoc: coords, offers: anchored, remainingIds: anchored.map((o) => o.id) });
        get().rebuildDeck();
      },

      // Découvrir : l'utilisateur déclare une envie → booste les features + FILTRE.
      applyIntent: (picks, summary) => {
        const t = { ...get().taste };
        for (const k of picks) t[k] = (t[k] ?? 0) + 1.0;
        const cats = picks.filter((p) => p.startsWith('cat:')).map((p) => p.slice(4));
        const matchedIds = cats.length
          ? get().offers.filter((o) => cats.includes(o.category)).map((o) => o.id)
          : null; // pas de catégorie déduite → on garde tout (ex. "décide pour moi")
        set({ taste: t, intent: summary ?? get().intent, matchedIds });
        get().rebuildDeck();
      },

      // Sélection faite par l'agent de curation (Claude) : ids exacts à montrer.
      setMatched: (ids, headline) => {
        set({ matchedIds: ids, intentHeadline: headline ?? get().intentHeadline });
        get().rebuildDeck();
      },

      completeOnboarding: (picks, intent, consent) => {
        set({
          onboarded: true,
          intent,
          taste: { ...seedFromOnboarding(picks), bias: 0 },
          consent: { ...get().consent, ...consent },
          swipeCount: 0,
          remainingIds: get().offers.map((o) => o.id),
        });
        get().rebuildDeck();
      },

      rebuildDeck: () => {
        const { offers, remainingIds, taste, swipeCount } = get();
        const pool = offers.filter((o) => remainingIds.includes(o.id));
        set({ deck: buildDeck(taste, pool, swipeCount) });
      },

      swipe: (offerId, accepted) => {
        const { offers, taste, swipeCount, remainingIds, wishlist } = get();
        const offer = offers.find((o) => o.id === offerId);
        if (!offer) return;
        const x = offerToFeatures(offer);
        const nextTaste = applySwipeLocal(taste, x, accepted);

        let remaining = remainingIds.filter((id) => id !== offerId);
        if (remaining.length === 0) remaining = offers.map((o) => o.id); // recycle (démo)

        const nextLiked = accepted ? Array.from(new Set([...get().liked, offerId])) : get().liked;
        // accept droite = ajoute aussi à la wishlist (geste "j'aime")
        const nextWishlist = accepted && !wishlist.includes(offerId) ? [...wishlist, offerId] : wishlist;

        set({
          taste: nextTaste,
          swipeCount: swipeCount + 1,
          remainingIds: remaining,
          liked: nextLiked,
          wishlist: nextWishlist,
          lastReason: reasonFor(nextTaste, offer),
          lastSwipe: { offerId, accepted },
        });
        get().rebuildDeck();
        void persistSwipeRemote(offerId, accepted ? 'accept' : 'reject', x);
      },

      toggleWishlist: (offerId) => {
        const { wishlist } = get();
        set({
          wishlist: wishlist.includes(offerId)
            ? wishlist.filter((id) => id !== offerId)
            : [...wishlist, offerId],
        });
      },

      markRedeemed: (offerId) =>
        set({ redeemed: Array.from(new Set([...get().redeemed, offerId])) }),

      setConsent: (patch) => set({ consent: { ...get().consent, ...patch } }),

      reset: () =>
        set({
          onboarded: false, intent: undefined, consent: DEFAULT_CONSENT, taste: {},
          swipeCount: 0, offers: OFFERS, remainingIds: OFFERS.map((o) => o.id),
          deck: [], wishlist: [], liked: [], redeemed: [], lastReason: null, lastSwipe: null,
        }),
    }),
    {
      name: 'spotit-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded, intent: s.intent, consent: s.consent,
        taste: s.taste, swipeCount: s.swipeCount, wishlist: s.wishlist, liked: s.liked, redeemed: s.redeemed,
      }),
      onRehydrateStorage: () => (state) => { state?.rebuildDeck(); },
    },
  ),
);

/** Sélecteur : la carte du dessus du deck (ou null). */
export const selectTopCard = (s: SpotState): Offer | null => s.deck[0] ?? null;
