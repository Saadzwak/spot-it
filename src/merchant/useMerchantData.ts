// ============================================================================
// Spot.it merchant — data hooks
// Each hook degrades gracefully: live path when hasSupabase(), mock otherwise.
// Never throws — catches all errors, falls back to mock data.
// ============================================================================

import { useState, useEffect } from 'react';
import { hasSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { StoreKpis, OfferStat, Offer } from '@/types/contracts';
import {
  MOCK_STORE_KPIS,
  MOCK_OFFER_STATS,
  MOCK_MERCHANT_OFFERS,
  DEMO_STORE_ID,
} from './mock';
import { OFFERS } from '@/data/offers.seed';

// ── snake_case → camelCase mappers (Postgres rows are snake_case) ─────────────

interface StoreKpisRow {
  store_id: string;
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  spend_cents: number;
  revenue_cents: number;
  updated_at: string;
}

function mapStoreKpisRow(row: StoreKpisRow): StoreKpis {
  return {
    storeId:      row.store_id,
    impressions:  row.impressions,
    clicks:       row.clicks,
    visits:       row.visits,
    conversions:  row.conversions,
    spendCents:   row.spend_cents,
    revenueCents: row.revenue_cents,
    updatedAt:    row.updated_at,
  };
}

interface OfferStatRow {
  offer_id: string;
  accepts: number;
  rejects: number;
  accept_rate: number;
}

function mapOfferStatRow(row: OfferStatRow): OfferStat {
  return {
    offerId:    row.offer_id,
    accepts:    Number(row.accepts),
    rejects:    Number(row.rejects),
    acceptRate: Number(row.accept_rate),
  };
}

// ── useStoreKpis ─────────────────────────────────────────────────────────────
// Returns current KPIs for the demo store.
// Live: selects store_kpis + subscribes to realtime UPDATE.
// Mock: returns MOCK_STORE_KPIS, no subscription.

export function useStoreKpis(): { kpis: StoreKpis | null; loading: boolean; live: boolean } {
  const [kpis, setKpis] = useState<StoreKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const live = hasSupabase();

  useEffect(() => {
    if (!live) {
      setKpis(MOCK_STORE_KPIS);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setKpis(MOCK_STORE_KPIS);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Initial fetch
    const fetchKpis = async () => {
      try {
        const { data, error } = await supabase
          .from('store_kpis')
          .select('store_id,impressions,clicks,visits,conversions,spend_cents,revenue_cents,updated_at')
          .eq('store_id', DEMO_STORE_ID)
          .single();
        if (mounted) {
          if (error || !data) {
            setKpis(MOCK_STORE_KPIS);
          } else {
            setKpis(mapStoreKpisRow(data as StoreKpisRow));
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setKpis(MOCK_STORE_KPIS);
          setLoading(false);
        }
      }
    };

    fetchKpis();

    // Realtime subscription for UPDATE events
    const channel = supabase
      .channel('store_kpis_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_kpis',
          filter: `store_id=eq.${DEMO_STORE_ID}`,
        },
        (payload) => {
          if (mounted && payload.new) {
            try {
              setKpis(mapStoreKpisRow(payload.new as StoreKpisRow));
            } catch {
              // Ignore malformed payload
            }
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [live]);

  return { kpis, loading, live };
}

// ── useOfferStats ─────────────────────────────────────────────────────────────
// Returns OfferStat[] for the demo store.
// Live: calls merchant_offer_stats(store_id) RPC.
// Mock: returns MOCK_OFFER_STATS.

export function useOfferStats(): { stats: OfferStat[]; loading: boolean } {
  const [stats, setStats] = useState<OfferStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase()) {
      setStats(MOCK_OFFER_STATS);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setStats(MOCK_OFFER_STATS);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('merchant_offer_stats', {
          p_store_id: DEMO_STORE_ID,
        });
        if (mounted) {
          if (error || !data || (Array.isArray(data) && data.length === 0)) {
            setStats(MOCK_OFFER_STATS);
          } else {
            setStats((data as OfferStatRow[]).map(mapOfferStatRow));
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setStats(MOCK_OFFER_STATS);
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading };
}

// ── useMerchantOffers ─────────────────────────────────────────────────────────
// Returns the Offer[] belonging to the demo merchant.
// Live: queries offers joined through stores owned by DEMO_MERCHANT_ID.
// Mock: returns the full seed catalog (all offers belong to demo merchant in seed).

export function useMerchantOffers(): { offers: Offer[]; loading: boolean } {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase()) {
      setOffers(MOCK_MERCHANT_OFFERS);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setOffers(MOCK_MERCHANT_OFFERS);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchOffers = async () => {
      try {
        // Join offers → stores → check merchant ownership via store's merchant_id
        const { data, error } = await supabase
          .from('offers')
          .select(`
            id, brand, title, teaser, category, price_band, offer_type,
            sponsored, grad, ink, wordmark, description, why_template,
            is_active,
            stores!inner(merchant_id)
          `)
          .eq('stores.merchant_id', 'b0000000-0000-0000-0000-000000000001');

        if (mounted) {
          if (error || !data || data.length === 0) {
            setOffers(MOCK_MERCHANT_OFFERS);
          } else {
            // Map DB rows to Offer shape
            const mapped: Offer[] = (data as Array<Record<string, unknown>>).map((row) => ({
              id:           String(row.id),
              brand:        String(row.brand),
              title:        String(row.title),
              teaser:       row.teaser ? String(row.teaser) : undefined,
              category:     row.category as Offer['category'],
              priceBand:    String(row.price_band) as Offer['priceBand'],
              offerType:    String(row.offer_type) as Offer['offerType'],
              sponsored:    Boolean(row.sponsored),
              grad:         (row.grad as [string, string]) ?? ['#17130F', '#5C544C'],
              ink:          String(row.ink ?? '#FFFFFF'),
              wordmark:     (row.wordmark as Offer['wordmark']) ?? {},
              description:  row.description ? String(row.description) : undefined,
              whyTemplate:  row.why_template ? String(row.why_template) : undefined,
            }));
            setOffers(mapped);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setOffers(MOCK_MERCHANT_OFFERS);
          setLoading(false);
        }
      }
    };

    fetchOffers();

    return () => {
      mounted = false;
    };
  }, []);

  return { offers, loading };
}

// ── useOfferLookup ────────────────────────────────────────────────────────────
// Builds a lookup map from offerId → Offer for joining stats with display data.
export function useOfferLookup(): Map<string, Offer> {
  const { offers } = useMerchantOffers();
  // In mock mode: also index by slug id (the seed uses string slugs, not UUIDs)
  const map = new Map<string, Offer>();
  for (const o of offers) {
    map.set(o.id, o);
  }
  // Also index by slug for mock OfferStat ids
  for (const o of OFFERS) {
    if (!map.has(o.id)) map.set(o.id, o);
  }
  return map;
}
