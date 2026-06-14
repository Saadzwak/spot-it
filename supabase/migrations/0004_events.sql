-- ============================================================================
-- Spot.it — 0004_events.sql — Event Tracker (analytics produit)
-- Clics offres/boutiques, ouvertures de pages, intentions, QR, conversions.
-- ============================================================================
create table if not exists public.events (
  id        bigint generated always as identity primary key,
  device_id text not null,
  user_id   uuid references auth.users(id) on delete set null,
  type      text not null,                       -- ex: offer_open, offer_select, intent_submit, qr_generated, simulate_walk
  props     jsonb not null default '{}'::jsonb,  -- { offerId, intent, count, ... }
  ts        timestamptz not null default now()
);
create index if not exists events_type_idx   on public.events (type);
create index if not exists events_device_idx on public.events (device_id);
create index if not exists events_ts_idx      on public.events (ts);

alter table public.events enable row level security;

-- Démo : tout client (anon/authentifié) peut INSÉRER ses events ; pas de SELECT
-- côté client (lecture réservée au service role / RPC dashboard).
drop policy if exists events_insert_any on public.events;
create policy events_insert_any on public.events for insert to anon, authenticated with check (true);

-- Agrégat conversions par offre (présentée -> QR généré), service-definer pour le dashboard.
create or replace function public.offer_conversions()
returns table (offer_id text, qr_count bigint, views bigint)
language sql security definer stable set search_path = '' as $$
  select (props->>'offerId') as offer_id,
         count(*) filter (where type='qr_generated') as qr_count,
         count(*) filter (where type='offer_open')  as views
  from public.events
  where props ? 'offerId'
  group by (props->>'offerId');
$$;
