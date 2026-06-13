-- ============================================================================
-- Spot.it — 0001_schema.sql  (FROZEN CONTRACT: tables + relations + indexes)
-- Postgres + PostGIS. Aligns with src/types/contracts.ts and CONTRACTS.md.
-- auth.users is managed by Supabase — never recreated.
-- ============================================================================

create extension if not exists postgis with schema "extensions";

-- ── profiles : 1:1 avec auth.users ; taste = poids du bandit (sparse jsonb) ──
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'consumer' check (role in ('consumer','merchant')),
  display_name text,
  intent      text,                                   -- intention shopping déclarée
  -- taste : { "cat:mode": 0.0, "brand:sandro": 0.0, "price_band:50-100": 0.0,
  --           "offer_type:discount": 0.0, "dist_band:<400": 0.0, "sponsored": 0.0, "bias": 0.0 }
  taste       jsonb  not null default '{}'::jsonb,
  -- consentements RGPD (partage OFF par défaut, cf. design README)
  consent     jsonb  not null default
              '{"location": false, "personalization": true, "share_data": false}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ── merchants : le propriétaire qui paie (1:1 avec un auth.user merchant) ──
create table if not exists public.merchants (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  name           text not null,
  billing_status text not null default 'active',
  created_at     timestamptz not null default now()
);

-- ── stores : point géographique + catégorie. merchant 1:N stores ──
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name        text not null,
  category    text not null,                          -- mode|tech|maison|beaute
  location    extensions.geography(Point,4326) not null,
  address     text,
  sponsored   boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists stores_geo_idx      on public.stores using gist (location);
create index if not exists stores_merchant_idx on public.stores (merchant_id);
create index if not exists stores_active_idx    on public.stores (is_active) where is_active;

-- ── offers : rattachée à un store. Colonnes canoniques = entrées du bandit. ──
create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  -- affichage (cf. app/data.jsx)
  brand       text not null,
  title       text not null,                          -- "-20% sur la nouvelle collection"
  teaser      text,
  why_template text,                                  -- fallback "Pourquoi" si pas d'agent
  grad        text[]  not null default '{}',          -- duotone placeholder [c1, c2]
  ink         text,
  wordmark    jsonb   not null default '{}'::jsonb,
  description text,
  -- FEATURES CANONIQUES (vecteur one-hot du bandit) — voir CONTRACTS.md §2
  category    text not null,                          -- mode|tech|maison|beaute
  price_band  text not null default '20-50' check (price_band in ('0-20','20-50','50-100','100+')),
  offer_type  text not null default 'discount' check (offer_type in ('discount','gift','voucher','exclusive','bogo')),
  sponsored   boolean not null default false,
  features    jsonb   not null default '{}'::jsonb,   -- extension libre
  is_active   boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists offers_store_idx  on public.offers (store_id);
create index if not exists offers_active_idx on public.offers (is_active) where is_active;
create index if not exists offers_cat_idx    on public.offers (category);

-- ── campaigns : ciblage payant (audience, rayon, créneaux, budget) ──
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  offer_id    uuid references public.offers(id) on delete set null,
  audience    jsonb  not null default '{}'::jsonb,    -- { categories:[], price_bands:[] }
  radius_m    integer not null default 400,
  daypart     jsonb  not null default '{}'::jsonb,    -- { days:[], hours:[start,end] }
  budget_cents integer not null default 0,
  spend_cents  integer not null default 0,
  status      text not null default 'active' check (status in ('draft','active','paused','ended')),
  created_at  timestamptz not null default now()
);
create index if not exists campaigns_store_idx on public.campaigns (store_id);

-- ── swipe_events : LE signal d'apprentissage. Brut = PRIVÉ au consumer. ──
create table if not exists public.swipe_events (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  offer_id       uuid not null references public.offers(id) on delete cascade,
  action         text not null check (action in ('accept','reject')),
  offer_snapshot jsonb not null,                      -- vecteur x au moment du swipe
  context        jsonb not null default '{}'::jsonb,  -- geo, time-of-day, session
  ts             timestamptz not null default now()
);
create index if not exists swipe_user_idx  on public.swipe_events (user_id);
create index if not exists swipe_offer_idx on public.swipe_events (offer_id);

-- ── wishlist : user N:M offers ──
create table if not exists public.wishlist (
  user_id  uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

-- ── recommendations_log : traçabilité des décisions agents (owner = consumer) ──
create table if not exists public.recommendations_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  offer_ids   uuid[] not null,
  rationale   jsonb  not null,                        -- inputs/outputs, scores, prompt id
  model       text   not null,                        -- modèle RÉELLEMENT utilisé (pas Opus par défaut)
  created_at  timestamptz not null default now()
);
create index if not exists reclog_user_idx on public.recommendations_log (user_id);

-- ── store_kpis : rollup agrégé pour le dashboard (jamais d'events bruts exposés) ──
create table if not exists public.store_kpis (
  store_id    uuid primary key references public.stores(id) on delete cascade,
  impressions bigint not null default 0,
  clicks      bigint not null default 0,
  visits      bigint not null default 0,
  conversions bigint not null default 0,
  spend_cents bigint not null default 0,
  revenue_cents bigint not null default 0,
  updated_at  timestamptz not null default now()
);
