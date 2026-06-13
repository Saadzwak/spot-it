-- ============================================================================
-- Spot.it — 0003_rpc.sql  (FROZEN CONTRACT: geo queries + bandit reconcile + KPIs)
-- ============================================================================

-- ── Magasins proches (~400 m). geography ⇒ ST_DWithin en MÈTRES, index-aware. ──
create or replace function public.nearby_stores(lat double precision, lng double precision, radius_m double precision default 400)
returns table (id uuid, name text, category text, sponsored boolean, dist_m double precision)
language sql stable set search_path = '' as $$
  select s.id, s.name, s.category, s.sponsored,
         extensions.st_distance(s.location, extensions.st_point(lng, lat)::extensions.geography) as dist_m
  from public.stores s
  where s.is_active
    and extensions.st_dwithin(s.location, extensions.st_point(lng, lat)::extensions.geography, radius_m)
  order by s.location operator(extensions.<->) extensions.st_point(lng, lat)::extensions.geography;
$$;

-- ── Magasins dans la fenêtre carte (bbox) — cast geography→geometry + && ──
create or replace function public.stores_in_view(min_lng double precision, min_lat double precision, max_lng double precision, max_lat double precision)
returns table (id uuid, name text, category text, sponsored boolean,
               lat double precision, lng double precision)
language sql stable set search_path = '' as $$
  select s.id, s.name, s.category, s.sponsored,
         extensions.st_y(s.location::extensions.geometry) as lat,
         extensions.st_x(s.location::extensions.geometry) as lng
  from public.stores s
  where s.is_active
    and (s.location::extensions.geometry) operator(extensions.&&)
        extensions.st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326);
$$;

-- ── apply_swipe : insert event + update taste (SGD logistique) en UNE transaction ──
--    w_i ← w_i + η·(y − p)·x_i ,  p = σ(bias + Σ w_i·x_i) ,  y = accept?1:0
create or replace function public.apply_swipe(
  p_user uuid, p_offer uuid, p_action text, p_x jsonb, p_eta numeric default 0.4
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  w jsonb; k text; xv numeric;
  z double precision := 0; p double precision; y numeric; err numeric;
begin
  if (select auth.uid()) is distinct from p_user then
    raise exception 'forbidden: caller is not p_user';
  end if;
  y := case when p_action = 'accept' then 1 else 0 end;

  select coalesce(taste, '{}'::jsonb) into w from public.profiles where id = p_user;
  if w is null then w := '{}'::jsonb; end if;

  z := coalesce((w->>'bias')::double precision, 0);
  for k, xv in select key, (value#>>'{}')::numeric from jsonb_each(p_x) loop
    z := z + coalesce((w->>k)::double precision, 0) * xv;
  end loop;

  p   := 1.0 / (1.0 + exp(-z));
  err := y - p;

  for k, xv in select key, (value#>>'{}')::numeric from jsonb_each(p_x) loop
    w := jsonb_set(w, array[k],
           to_jsonb(round((coalesce((w->>k)::numeric, 0) + p_eta * err * xv), 6)), true);
  end loop;
  w := jsonb_set(w, array['bias'],
         to_jsonb(round((coalesce((w->>'bias')::numeric, 0) + p_eta * err), 6)), true);

  insert into public.swipe_events(user_id, offer_id, action, offer_snapshot)
  values (p_user, p_offer, p_action, p_x);

  update public.profiles set taste = w where id = p_user;
  return w;
end; $$;

-- ── merchant_offer_stats : agrégats GROUP BY scopés au propriétaire du store ──
create or replace function public.merchant_offer_stats(p_store_id uuid)
returns table (offer_id uuid, accepts bigint, rejects bigint, accept_rate numeric)
language sql security definer stable set search_path = '' as $$
  select e.offer_id,
         count(*) filter (where e.action='accept') as accepts,
         count(*) filter (where e.action='reject') as rejects,
         round(avg((e.action='accept')::int)::numeric, 4) as accept_rate
  from public.swipe_events e
  join public.offers o on o.id = e.offer_id
  where o.store_id = p_store_id
    and private.owns_store(p_store_id)
  group by e.offer_id;
$$;
revoke execute on function public.merchant_offer_stats(uuid) from anon;
