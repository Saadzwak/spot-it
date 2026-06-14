// ============================================================================
// Spot.it merchant — data hooks
// Chaque hook dégrade proprement : voie live si hasSupabase(), mock sinon.
// Ne jette jamais — toutes les erreurs retombent sur le mock. UI optimiste.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { hasSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { StoreKpis, OfferStat, Offer, Category } from '@/types/contracts';
import {
  MOCK_OFFER_STATS,
  MOCK_MERCHANT_OFFERS,
  MOCK_KPIS_BY_PERIOD,
  MOCK_ARCHETYPE_SHARES,
  MOCK_CAMPAIGNS,
  DEMO_STORE_ID,
  type Period,
  type MerchantCampaign,
} from './mock';
import { audienceByCategory, audienceByPriceBand, type Slice } from './insights';
import { categories } from '@/design/tokens';
import type { OfferDraft } from './components/OfferCardPreview';
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

// ── useStoreKpis(period) ──────────────────────────────────────────────────────
// Renvoie les KPIs courants + la période précédente (→ variation) + statut live.
// Live: SELECT store_kpis + abonnement realtime UPDATE (prev non dispo → null).
// Mock: MOCK_KPIS_BY_PERIOD[period] (courant + précédent).

export function useStoreKpis(period: Period = '7j'): {
  kpis: StoreKpis | null;
  prev: StoreKpis | null;
  loading: boolean;
  live: boolean;
} {
  const live = hasSupabase();
  // En live : KPIs réels via state + realtime. En mock : rien ici.
  const [liveKpis, setLiveKpis] = useState<StoreKpis | null>(null);
  const [liveLoading, setLiveLoading] = useState(live);

  useEffect(() => {
    if (!live) return;
    const supabase = getSupabase();
    if (!supabase) { setLiveLoading(false); return; }

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('store_kpis')
          .select('store_id,impressions,clicks,visits,conversions,spend_cents,revenue_cents,updated_at')
          .eq('store_id', DEMO_STORE_ID)
          .single();
        if (!mounted) return;
        if (!error && data) setLiveKpis(mapStoreKpisRow(data as StoreKpisRow));
        setLiveLoading(false);
      } catch {
        if (mounted) setLiveLoading(false);
      }
    })();

    const channel = supabase
      .channel('store_kpis_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_kpis', filter: `store_id=eq.${DEMO_STORE_ID}` },
        (payload) => {
          if (mounted && payload.new) {
            try { setLiveKpis(mapStoreKpisRow(payload.new as StoreKpisRow)); } catch { /* ignore */ }
          }
        },
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [live]);

  // Mode démo : données dérivées AU RENDU (aucun effet requis → jamais vide,
  // robuste web/SSR), et la période se reflète immédiatement.
  if (!live) {
    const pair = MOCK_KPIS_BY_PERIOD[period];
    return { kpis: pair.current, prev: pair.previous, loading: false, live: false };
  }
  // Live : fallback mock tant que la donnée réelle n'est pas arrivée (jamais vide).
  return {
    kpis: liveKpis ?? MOCK_KPIS_BY_PERIOD[period].current,
    prev: null,
    loading: liveLoading && !liveKpis,
    live: true,
  };
}

// ── useOfferStats ─────────────────────────────────────────────────────────────

export function useOfferStats(): { stats: OfferStat[]; loading: boolean } {
  const live = hasSupabase();
  const [liveStats, setLiveStats] = useState<OfferStat[] | null>(null);

  useEffect(() => {
    if (!live) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('merchant_offer_stats', { p_store_id: DEMO_STORE_ID });
        if (!mounted) return;
        if (!error && data && !(Array.isArray(data) && data.length === 0)) {
          setLiveStats((data as OfferStatRow[]).map(mapOfferStatRow));
        } else {
          setLiveStats(MOCK_OFFER_STATS);
        }
      } catch {
        if (mounted) setLiveStats(MOCK_OFFER_STATS);
      }
    })();
    return () => { mounted = false; };
  }, [live]);

  // Démo : mock au rendu. Live : mock en fallback tant que la donnée n'arrive pas.
  if (!live) return { stats: MOCK_OFFER_STATS, loading: false };
  return { stats: liveStats ?? MOCK_OFFER_STATS, loading: liveStats === null };
}

// ── useMerchantOffers ─────────────────────────────────────────────────────────

export function useMerchantOffers(): { offers: Offer[]; loading: boolean } {
  const live = hasSupabase();
  const [liveOffers, setLiveOffers] = useState<Offer[] | null>(null);

  useEffect(() => {
    if (!live) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select(`
            id, brand, title, teaser, category, price_band, offer_type,
            sponsored, grad, ink, wordmark, description, why_template,
            is_active,
            stores!inner(merchant_id)
          `)
          .eq('stores.merchant_id', 'b0000000-0000-0000-0000-000000000001');
        if (!mounted) return;
        if (error || !data || data.length === 0) {
          setLiveOffers(MOCK_MERCHANT_OFFERS);
        } else {
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
          setLiveOffers(mapped);
        }
      } catch {
        if (mounted) setLiveOffers(MOCK_MERCHANT_OFFERS);
      }
    })();
    return () => { mounted = false; };
  }, [live]);

  if (!live) return { offers: MOCK_MERCHANT_OFFERS, loading: false };
  return { offers: liveOffers ?? MOCK_MERCHANT_OFFERS, loading: liveOffers === null };
}

// ── useOfferLookup ────────────────────────────────────────────────────────────
export function useOfferLookup(): Map<string, Offer> {
  const { offers } = useMerchantOffers();
  return useMemo(() => {
    const map = new Map<string, Offer>();
    for (const o of offers) map.set(o.id, o);
    for (const o of OFFERS) if (!map.has(o.id)) map.set(o.id, o);
    return map;
  }, [offers]);
}

// ── useAudienceInsights ────────────────────────────────────────────────────────
// Agrégats RGPD-safe : top offres, répartition catégorie / tranche prix / archétype.
export function useAudienceInsights(): {
  topOffers: { stat: OfferStat; offer: Offer }[];
  byCategory: Slice[];
  byPriceBand: Slice[];
  archetypes: { id: string; label: string; emoji: string; pct: number }[];
  loading: boolean;
} {
  const { stats, loading: ls } = useOfferStats();
  const lookup = useOfferLookup();

  return useMemo(() => {
    const topOffers = [...stats]
      .sort((a, b) => b.acceptRate - a.acceptRate)
      .map((stat) => ({ stat, offer: lookup.get(stat.offerId) }))
      .filter((x): x is { stat: OfferStat; offer: Offer } => Boolean(x.offer))
      .slice(0, 6);

    const byCategory = audienceByCategory(stats, lookup).map((s) => ({
      ...s,
      color: categories[s.id as keyof typeof categories]?.hue,
    }));
    const byPriceBand = audienceByPriceBand(stats, lookup);

    return { topOffers, byCategory, byPriceBand, archetypes: MOCK_ARCHETYPE_SHARES, loading: ls };
  }, [stats, lookup, ls]);
}

// ── Persistance offre (best-effort en live, optimiste côté UI) ─────────────────
// Renvoie l'id (existant ou nouveau slug temporaire). N'échoue jamais.
export async function saveOfferRemote(draft: OfferDraft, id?: string): Promise<void> {
  const supabase = hasSupabase() ? getSupabase() : null;
  if (!supabase) return;
  try {
    const payload = {
      brand: draft.brand,
      title: draft.title,
      category: draft.category,
      price_band: draft.priceBand,
      offer_type: draft.offerType,
      sponsored: draft.sponsored,
      image: draft.image ?? null,
    };
    if (id) await supabase.from('offers').update(payload).eq('id', id);
    else await supabase.from('offers').insert({ ...payload, store_id: DEMO_STORE_ID });
  } catch { /* optimiste : on ignore l'échec réseau */ }
}

export async function setOfferActiveRemote(id: string, active: boolean): Promise<void> {
  const supabase = hasSupabase() ? getSupabase() : null;
  if (!supabase) return;
  try { await supabase.from('offers').update({ is_active: active }).eq('id', id); }
  catch { /* ignore */ }
}

export async function deleteOfferRemote(id: string): Promise<void> {
  const supabase = hasSupabase() ? getSupabase() : null;
  if (!supabase) return;
  try { await supabase.from('offers').delete().eq('id', id); }
  catch { /* ignore */ }
}

// ── useCampaigns ────────────────────────────────────────────────────────────
// Liste des campagnes + pause/reprise (optimiste) + création best-effort.
interface CampaignRow {
  id: string;
  audience: { categories?: Category[] } | null;
  radius_m: number;
  budget_cents: number;
  spend_cents: number;
  status: string;
}

export function useCampaigns(): {
  campaigns: MerchantCampaign[];
  loading: boolean;
  setStatus: (id: string, status: 'active' | 'paused') => void;
  add: (draft: { categories: Category[]; radiusM: number; budgetCents: number }) => Promise<void>;
} {
  const live = hasSupabase();
  // Démo : liste mock dès le 1er rendu (lazy init, aucun effet requis).
  const [campaigns, setCampaigns] = useState<MerchantCampaign[]>(() => (live ? [] : MOCK_CAMPAIGNS));
  const [loading, setLoading] = useState(live);

  useEffect(() => {
    if (!live) return;
    const supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('id,audience,radius_m,budget_cents,spend_cents,status')
          .eq('store_id', DEMO_STORE_ID)
          .order('created_at', { ascending: false });
        if (!mounted) return;
        if (error || !data || data.length === 0) setCampaigns(MOCK_CAMPAIGNS);
        else setCampaigns((data as CampaignRow[]).map((r) => ({
          id: String(r.id),
          categories: r.audience?.categories ?? [],
          radiusM: r.radius_m,
          budgetCents: r.budget_cents,
          spendCents: r.spend_cents,
          status: r.status === 'paused' ? 'paused' : 'active',
        })));
        setLoading(false);
      } catch {
        if (mounted) { setCampaigns(MOCK_CAMPAIGNS); setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, [live]);

  const setStatus = useCallback((id: string, status: 'active' | 'paused') => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))); // optimiste
    const supabase = hasSupabase() ? getSupabase() : null;
    if (supabase) { void supabase.from('campaigns').update({ status }).eq('id', id).then(() => {}, () => {}); }
  }, []);

  const add = useCallback(async (draft: { categories: Category[]; radiusM: number; budgetCents: number }) => {
    const optimistic: MerchantCampaign = {
      id: `camp-${Date.now()}`,
      categories: draft.categories,
      radiusM: draft.radiusM,
      budgetCents: draft.budgetCents,
      spendCents: 0,
      status: 'active',
    };
    setCampaigns((prev) => [optimistic, ...prev]); // optimiste
    const supabase = hasSupabase() ? getSupabase() : null;
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('campaigns')
        .insert({
          store_id: DEMO_STORE_ID,
          audience: { categories: draft.categories },
          radius_m: draft.radiusM,
          budget_cents: draft.budgetCents,
          spend_cents: 0,
          status: 'active',
        })
        .select('id')
        .single();
      if (data?.id) {
        setCampaigns((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, id: String(data.id) } : c)));
      }
    } catch { /* optimiste : on garde l'id local */ }
  }, []);

  return { campaigns, loading, setStatus, add };
}

// ── useMerchantSession ─────────────────────────────────────────────────────────
// Démo : session synthétique pré-remplie. Live : auth Supabase email/mot de passe.
export interface MerchantSession { email: string; demo: boolean }

export function useMerchantSession(): {
  session: MerchantSession | null;
  loading: boolean;
  live: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
} {
  const live = hasSupabase();
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!live) { setSession({ email: 'merchant@demo.spotit', demo: true }); setLoading(false); return; }
    const supabase = getSupabase();
    if (!supabase) { setSession({ email: 'merchant@demo.spotit', demo: true }); setLoading(false); return; }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const email = data.session?.user?.email;
      setSession(email ? { email, demo: false } : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      const email = s?.user?.email;
      setSession(email ? { email, demo: false } : null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [live]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Backend indisponible' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) { try { await supabase.auth.signOut(); } catch { /* ignore */ } }
  }, []);

  return { session, loading, live, signIn, signOut };
}
