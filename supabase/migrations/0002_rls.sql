-- ============================================================================
-- Spot.it — 0002_rls.sql  (FROZEN CONTRACT: RLS + role hook + ownership helper)
-- Patterns vérifiés: (select auth.uid()) scalar, TO authenticated, helper
-- SECURITY DEFINER en schéma privé, jointures réécrites en IN (subquery).
-- ============================================================================

-- ── Rôle dans le JWT (cheap policy checks) ; source de vérité = profiles.role ──
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable set search_path = '' as $$
declare claims jsonb; v_role text;
begin
  select role into v_role from public.profiles where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(coalesce(v_role,'consumer')));
  event  := jsonb_set(event, '{claims}', claims);
  return event;
end; $$;
-- Dashboard: Authentication > Hooks > Customize Access Token (JWT).
-- grant execute on function public.custom_access_token_hook to supabase_auth_admin;
-- revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ── Helper d'ownership (schéma privé, jamais exposé) ──
create schema if not exists private;
create or replace function private.owns_store(p_store_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    join public.merchants m on m.id = s.merchant_id
    where s.id = p_store_id and m.user_id = (select auth.uid())
  );
$$;

-- ── Enable RLS partout ──
alter table public.profiles            enable row level security;
alter table public.merchants           enable row level security;
alter table public.stores              enable row level security;
alter table public.offers              enable row level security;
alter table public.campaigns           enable row level security;
alter table public.swipe_events        enable row level security;
alter table public.wishlist            enable row level security;
alter table public.recommendations_log enable row level security;
alter table public.store_kpis          enable row level security;

-- ── Catalogue public (lecture) : tout user connecté voit l'actif ──
create policy stores_read_active on public.stores for select to authenticated using (is_active);
create policy offers_read_active on public.offers for select to authenticated using (is_active);

-- ── Consumer : son propre profil ──
create policy profile_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profile_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profile_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ── Consumer : ses swipes / wishlist (bruts privés) ──
create policy swipe_select on public.swipe_events for select to authenticated using ((select auth.uid()) = user_id);
create policy swipe_insert on public.swipe_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wishlist_all on public.wishlist for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── Consumer : ses recommandations (lecture seule ; écriture = service role) ──
create policy reclog_owner_select on public.recommendations_log
  for select to authenticated using ((select auth.uid()) = user_id);

-- ── Merchant : ses merchants ──
create policy merchant_owner_all on public.merchants for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── Merchant : ses stores / offers / campaigns (offre via la chaîne store) ──
create policy stores_owner_all on public.stores for all to authenticated
  using ( merchant_id in (select m.id from public.merchants m where m.user_id = (select auth.uid())) )
  with check ( merchant_id in (select m.id from public.merchants m where m.user_id = (select auth.uid())) );

create policy offers_owner_all on public.offers for all to authenticated
  using ((select private.owns_store(store_id))) with check ((select private.owns_store(store_id)));

create policy campaigns_owner_all on public.campaigns for all to authenticated
  using ((select private.owns_store(store_id))) with check ((select private.owns_store(store_id)));

-- ── Merchant : KPIs agrégés de SES stores (jamais les events bruts) ──
create policy kpis_owner_select on public.store_kpis for select to authenticated
  using ((select private.owns_store(store_id)));

-- NB: PAS de policy SELECT sur swipe_events pour les merchants — RLS filtre des
-- lignes, pas des agrégats. Analytics via store_kpis ou merchant_offer_stats (0003).
