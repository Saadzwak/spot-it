-- ============================================================================
-- Spot.it — seed.sql
-- Applied by `npx supabase db reset` after migrations/.
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING / ON CONFLICT DO UPDATE.
--
-- DEMO USERS
--   merchant : merchant@demo.spotit  / demo1234
--   consumer : consumer@demo.spotit  / demo1234
--
-- CAVEAT — auth.users seeding
--   We insert directly into auth.users with encrypted_password (bcrypt via
--   pgcrypto). This works with the GoTrue version bundled in Supabase CLI
--   local dev (Postgres 15). Required gotchas applied:
--     • confirmation_token / recovery_token / email_change / email_change_token_new
--       set to '' (not NULL) — GoTrue panics on NULL string tokens at sign-in.
--     • auth.identities rows added (provider='email') — GoTrue >= 2.x requires
--       an identities row to authenticate email/password.
--     • aud='authenticated', role='authenticated', email_confirmed_at=now().
--   If sign-in fails after `supabase db reset`, wipe seed users and re-insert via
--   `npx supabase auth` or the Studio UI — the app logic does not care how the
--   users were created, only that the UUIDs match.
-- ============================================================================

-- ── Fixed UUIDs (reference these everywhere) ─────────────────────────────────
-- DEMO_MERCHANT_USER_ID  = 'a0000000-0000-0000-0000-000000000001'
-- DEMO_MERCHANT_ID       = 'b0000000-0000-0000-0000-000000000001'
-- DEMO_CONSUMER_USER_ID  = 'a0000000-0000-0000-0000-000000000002'
--
-- Store UUIDs (one per brand):
-- sandro       c0000000-0000-0000-0000-000000000001
-- sephora      c0000000-0000-0000-0000-000000000002
-- mdm          c0000000-0000-0000-0000-000000000003
-- frankie      c0000000-0000-0000-0000-000000000004
-- boulanger    c0000000-0000-0000-0000-000000000005
-- lbm          c0000000-0000-0000-0000-000000000006
-- aesop        c0000000-0000-0000-0000-000000000007
-- axel         c0000000-0000-0000-0000-000000000008
-- veja         c0000000-0000-0000-0000-000000000009
-- nike-rivoli  c0000000-0000-0000-0000-00000000000a
-- newbalance   c0000000-0000-0000-0000-00000000000b
-- carhartt     c0000000-0000-0000-0000-00000000000c
--
-- Offer UUIDs (match seed slug ids):
-- sandro       d0000000-0000-0000-0000-000000000001
-- sephora      d0000000-0000-0000-0000-000000000002
-- mdm          d0000000-0000-0000-0000-000000000003
-- frankie      d0000000-0000-0000-0000-000000000004
-- boulanger    d0000000-0000-0000-0000-000000000005
-- lbm          d0000000-0000-0000-0000-000000000006
-- aesop        d0000000-0000-0000-0000-000000000007
-- axel         d0000000-0000-0000-0000-000000000008
-- veja         d0000000-0000-0000-0000-000000000009
-- nike-rivoli  d0000000-0000-0000-0000-00000000000a
-- newbalance   d0000000-0000-0000-0000-00000000000b
-- carhartt     d0000000-0000-0000-0000-00000000000c

-- ── 0. Require pgcrypto for password hashing ─────────────────────────────────
create extension if not exists pgcrypto;

-- ── 1. Demo auth.users ────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at,
  last_sign_in_at, phone, phone_confirmed_at,
  banned_until, reauthentication_token, is_sso_user, deleted_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'merchant@demo.spotit',
    crypt('demo1234', gen_salt('bf')),
    now(), now(),
    '', '',  -- must NOT be NULL (GoTrue panics)
    '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Merchant"}'::jsonb,
    false, now(), now(),
    now(), null, null,
    null, '', false, null
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'consumer@demo.spotit',
    crypt('demo1234', gen_salt('bf')),
    now(), now(),
    '', '',
    '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo User"}'::jsonb,
    false, now(), now(),
    now(), null, null,
    null, '', false, null
  )
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  updated_at = now();

-- ── 2. auth.identities (required by GoTrue >= 2.x for email sign-in) ─────────
insert into auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'email',
    '{"sub":"a0000000-0000-0000-0000-000000000001","email":"merchant@demo.spotit"}'::jsonb,
    now(), now(), now()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'email',
    '{"sub":"a0000000-0000-0000-0000-000000000002","email":"consumer@demo.spotit"}'::jsonb,
    now(), now(), now()
  )
on conflict (provider, provider_id) do nothing;

-- ── 3. profiles ───────────────────────────────────────────────────────────────
-- Consumer: partially seeded taste → mode/streetwear bias so demo converges fast.
-- brandSlug rules applied (from features.ts: NFD strip → lower → non-alnum→'-'):
--   "The Frankie Shop" → "the-frankie-shop"
--   "Maisons du Monde" → "maisons-du-monde"
--   "Le Bon Marché"    → "le-bon-marche"
--   "Carhartt WIP"     → "carhartt-wip"
--   "Axel Arigato"     → "axel-arigato"
--   "New Balance"      → "new-balance"
-- NOTE: profiles table has no updated_at column — use DO NOTHING for safe idempotency.
insert into public.profiles (id, role, display_name, taste, consent)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'merchant',
    'Demo Merchant',
    '{}'::jsonb,
    '{"location":true,"personalization":true,"share_data":false}'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'consumer',
    'Demo User',
    '{"cat:mode":1.0,"offer_type:discount":0.6,"price_band:50-100":0.5,"brand:sandro":0.4,"brand:the-frankie-shop":0.3,"brand:axel-arigato":0.3,"brand:veja":0.2,"brand:nike":0.2,"brand:new-balance":0.2,"brand:carhartt-wip":0.2,"dist_band:<400":0.3,"bias":0.1}'::jsonb,
    '{"location":true,"personalization":true,"share_data":false}'::jsonb
  )
on conflict (id) do nothing;

-- ── 4. merchants ──────────────────────────────────────────────────────────────
insert into public.merchants (id, user_id, name, billing_status)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Demo Merchant Group',
  'active'
)
on conflict (id) do nothing;

-- ── 5. stores (one per brand, geography = ST_Point(lng, lat)) ─────────────────
-- All stores are owned by the single demo merchant.
-- Coordinates from offers.seed.ts (exact lat/lng per offer).
insert into public.stores (id, merchant_id, name, category, location, address, sponsored, is_active)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Sandro – Rue de Rennes',
    'mode',
    extensions.st_point(2.3290, 48.8520)::extensions.geography,
    '50 rue de Rennes, 75006',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Sephora – Champs-Élysées',
    'beaute',
    extensions.st_point(2.3079, 48.8698)::extensions.geography,
    '66 av. des Champs, 75008',
    true, true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Maisons du Monde – Haussmann',
    'maison',
    extensions.st_point(2.3317, 48.8729)::extensions.geography,
    '10 bd Haussmann, 75009',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'The Frankie Shop – Vert-Bois',
    'mode',
    extensions.st_point(2.3578, 48.8662)::extensions.geography,
    '5 rue du Vert-Bois, 75003',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000001',
    'Boulanger – Forum des Halles',
    'tech',
    extensions.st_point(2.3470, 48.8623)::extensions.geography,
    'Forum des Halles, 75001',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000001',
    'Le Bon Marché – Rive Gauche',
    'mode',
    extensions.st_point(2.3245, 48.8510)::extensions.geography,
    '24 rue de Sèvres, 75007',
    true, true
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000001',
    'Aesop – Saint-Honoré',
    'beaute',
    extensions.st_point(2.3360, 48.8654)::extensions.geography,
    '256 rue St-Honoré, 75001',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000001',
    'Axel Arigato – Marseille',
    'mode',
    extensions.st_point(2.3637, 48.8702)::extensions.geography,
    '12 rue de Marseille, 75010',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000001',
    'Veja – Aboukir',
    'mode',
    extensions.st_point(2.3445, 48.8665)::extensions.geography,
    '17 rue d''Aboukir, 75002',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-00000000000a',
    'b0000000-0000-0000-0000-000000000001',
    'Nike – Rivoli',
    'mode',
    extensions.st_point(2.3486, 48.8588)::extensions.geography,
    '79 rue de Rivoli, 75001',
    true, true
  ),
  (
    'c0000000-0000-0000-0000-00000000000b',
    'b0000000-0000-0000-0000-000000000001',
    'New Balance – Tiquetonne',
    'mode',
    extensions.st_point(2.3489, 48.8638)::extensions.geography,
    '5 rue Tiquetonne, 75002',
    false, true
  ),
  (
    'c0000000-0000-0000-0000-00000000000c',
    'b0000000-0000-0000-0000-000000000001',
    'Carhartt WIP – Étienne Marcel',
    'mode',
    extensions.st_point(2.3478, 48.8642)::extensions.geography,
    '8 rue Étienne Marcel, 75001',
    false, true
  )
on conflict (id) do nothing;

-- ── 6. offers (matching src/data/offers.seed.ts) ──────────────────────────────
-- grad stored as text[] (two-element array), wordmark as jsonb.
-- ids match the slug IDs from the TS seed (mapped to UUIDs here).
insert into public.offers (
  id, store_id,
  brand, title, teaser, why_template,
  grad, ink, wordmark, description,
  category, price_band, offer_type, sponsored,
  is_active
)
values
  -- sandro
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Sandro', '-20% sur la nouvelle collection', 'Nouvelle collection',
    'Parce que tu adores la mode — et c''est à 4 min à pied.',
    array['#2C2622','#6E625A'], '#FBF7F2',
    '{"text":"SANDRO","spacing":6,"weight":500}'::jsonb,
    'La nouvelle collection Sandro arrive en boutique. Pièces tailleur, mailles fines et coupes nettes — l''offre est valable sur l''ensemble du nouvel arrivage.',
    'mode', '50-100', 'discount', false, true
  ),
  -- sephora
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Sephora', 'Ton cadeau dès 75€ d''achat', 'Cadeau offert',
    'Tu explores la beauté en ce moment — et c''est juste au coin.',
    array['#211A18','#9E3B2E'], '#FCEDE8',
    '{"text":"SEPHORA","spacing":3,"weight":600}'::jsonb,
    'Un cadeau beauté exclusif t''attend dès 75€ d''achat en boutique. Sélection de soins et parfums du moment, dans la limite des stocks.',
    'beaute', '50-100', 'gift', true, true
  ),
  -- mdm (Maisons du Monde)
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'Maisons du Monde', 'Bon d''achat dès 150€', 'Bon d''achat',
    'Pour ton intérieur — un style chaleureux que tu aimes.',
    array['#A9794E','#D8B48A'], '#2B2017',
    '{"text":"Maisons du Monde","spacing":1,"weight":500,"serif":true,"size":22}'::jsonb,
    'Un bon d''achat t''est offert dès 150€ dépensés. Mobilier chaleureux, textiles et décoration pour réchauffer ton intérieur cette saison.',
    'maison', '100+', 'voucher', false, true
  ),
  -- frankie (The Frankie Shop)
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000004',
    'The Frankie Shop', '-15% sur la collection été', 'Collection été',
    'Coupes minimalistes et tons neutres — pile dans tes goûts.',
    array['#C8A06A','#EADBC2'], '#3A2E1E',
    '{"text":"THE FRANKIE SHOP","spacing":2,"weight":500,"size":17}'::jsonb,
    'La collection été passe à -15%. Tailoring relâché, mailles et basiques élevés — la silhouette du moment, à prix doux.',
    'mode', '50-100', 'discount', false, true
  ),
  -- boulanger
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000005',
    'Boulanger', 'Sony WH-1000XM5 à -20%', 'Casque Sony -20%',
    'Tu as repéré du son premium récemment — bon plan juste pour toi.',
    array['#24201C','#4A4038'], '#F4EEE6',
    '{"text":"Boulanger","spacing":1,"weight":600,"size":24}'::jsonb,
    'Le casque à réduction de bruit Sony WH-1000XM5 à -20%. Son immersif, autonomie longue durée — testable en boutique avant d''acheter.',
    'tech', '100+', 'discount', false, true
  ),
  -- lbm (Le Bon Marché)
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000006',
    'Le Bon Marché', 'Offre exclusive en boutique', 'Offre exclusive',
    'Le grand magasin que tu adores — une offre rien que pour aujourd''hui.',
    array['#B89B6A','#E7D6B0'], '#332813',
    '{"text":"LE BON MARCHÉ","spacing":3,"weight":500,"size":17}'::jsonb,
    'Une offre exclusive t''attend au Bon Marché Rive Gauche, aujourd''hui seulement. Mode, maison et épicerie fine réunies sous un même toit.',
    'mode', '100+', 'exclusive', true, true
  ),
  -- aesop
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000007',
    'Aesop', 'Offre exclusive en boutique', 'Offre exclusive',
    'Soins raffinés — exactement ta zone de goût beauté.',
    array['#5E5B3E','#B7B189'], '#FAF7EC',
    '{"text":"Aēsop","spacing":2,"weight":500,"serif":true,"size":28}'::jsonb,
    'Une offre exclusive sur la gamme soin. Formules d''origine végétale, rituels visage et corps — conseil personnalisé en boutique.',
    'beaute', '50-100', 'exclusive', false, true
  ),
  -- axel (Axel Arigato)
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000008',
    'Axel Arigato', 'Ton cadeau dès 75€ d''achat', 'Cadeau offert',
    'Sneakers épurées et streetwear pointu — fait pour ton style.',
    array['#7C756E','#C4BBB2'], '#211D19',
    '{"text":"AXEL ARIGATO","spacing":3,"weight":500,"size":18}'::jsonb,
    'Un cadeau offert dès 75€ d''achat. Sneakers minimalistes et pièces streetwear scandinaves — la sélection signature de la maison.',
    'mode', '50-100', 'gift', false, true
  ),
  -- veja
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000009',
    'Veja', '-15% sur les sneakers en cuir', 'Sneakers -15%',
    'Sneakers responsables, ligne épurée — dans ton ADN.',
    array['#2E3A2F','#7E8E6A'], '#F2F4EC',
    '{"text":"VEJA","spacing":5,"weight":600,"size":24}'::jsonb,
    'Les modèles iconiques en cuir tanné passent à -15%. Sneakers éco-conçues, fabrication transparente — un classique du vestiaire urbain.',
    'mode', '50-100', 'discount', false, true
  ),
  -- nike-rivoli
  (
    'd0000000-0000-0000-0000-00000000000a',
    'c0000000-0000-0000-0000-00000000000a',
    'Nike', '-20% sur une paire au choix', 'Sneakers -20%',
    'Tu vis en sneakers — voici le bon plan du moment.',
    array['#1B1B1B','#5A5A5A'], '#FAFAFA',
    '{"text":"NIKE","spacing":4,"weight":700,"size":26}'::jsonb,
    'Choisis ta paire et profite de -20% en boutique. Dunk, Air Max, Pegasus — la sélection running et lifestyle du moment.',
    'mode', '50-100', 'discount', true, true
  ),
  -- newbalance
  (
    'd0000000-0000-0000-0000-00000000000b',
    'c0000000-0000-0000-0000-00000000000b',
    'New Balance', '-15% sur les 990 & 530', 'Sneakers -15%',
    'Le confort rétro-running que tu cherches — juste là.',
    array['#3A3F4A','#8A93A3'], '#F4F6FA',
    '{"text":"New Balance","spacing":1,"weight":600,"size":22}'::jsonb,
    'Les silhouettes 990 et 530 à -15%. Mesh et suède, semelle ENCAP — l''icône running devenue essentiel streetwear.',
    'mode', '50-100', 'discount', false, true
  ),
  -- carhartt
  (
    'd0000000-0000-0000-0000-00000000000c',
    'c0000000-0000-0000-0000-00000000000c',
    'Carhartt WIP', 'Ton bonnet offert dès 90€', 'Cadeau offert',
    'Workwear et streetwear robuste — pile ton univers.',
    array['#3C2F1E','#A8854E'], '#F7EFDF',
    '{"text":"Carhartt WIP","spacing":1,"weight":600,"size":21}'::jsonb,
    'Un bonnet emblématique offert dès 90€ d''achat. Workwear durable, coupes amples et toile résistante — le streetwear qui dure.',
    'mode', '50-100', 'gift', false, true
  )
on conflict (id) do nothing;

-- ── 7. campaigns (two demo campaigns) ─────────────────────────────────────────
insert into public.campaigns (id, store_id, offer_id, audience, radius_m, daypart, budget_cents, spend_cents, status)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '{"categories":["mode"],"price_bands":["50-100"]}'::jsonb,
    800,
    '{"days":["mon","tue","wed","thu","fri"],"hours":[10,20]}'::jsonb,
    50000, 18200, 'active'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-00000000000a',
    'd0000000-0000-0000-0000-00000000000a',
    '{"categories":["mode"],"price_bands":["50-100","100+"]}'::jsonb,
    1500,
    '{"days":["sat","sun"],"hours":[11,19]}'::jsonb,
    75000, 31400, 'active'
  )
on conflict (id) do nothing;

-- ── 8. store_kpis (realistic non-zero values for dashboard) ───────────────────
insert into public.store_kpis (store_id, impressions, clicks, visits, conversions, spend_cents, revenue_cents, updated_at)
values
  ('c0000000-0000-0000-0000-000000000001', 4820, 312,  88,  19, 18200, 142600, now()),
  ('c0000000-0000-0000-0000-000000000002', 6103, 441, 112,  34, 42100, 378900, now()),
  ('c0000000-0000-0000-0000-000000000003', 2310,  98,  29,   6,  8400,  52000, now()),
  ('c0000000-0000-0000-0000-000000000004', 3870, 204,  61,  14, 12600,  96400, now()),
  ('c0000000-0000-0000-0000-000000000005', 2980, 143,  39,   8,  9700,  74100, now()),
  ('c0000000-0000-0000-0000-000000000006', 5240, 388,  97,  27, 31400, 298700, now()),
  ('c0000000-0000-0000-0000-000000000007', 1740,  87,  22,   5,  4200,  39600, now()),
  ('c0000000-0000-0000-0000-000000000008', 3320, 218,  54,  12, 11800,  89200, now()),
  ('c0000000-0000-0000-0000-000000000009', 2890, 162,  47,  10,  9100,  68400, now()),
  ('c0000000-0000-0000-0000-00000000000a', 7650, 521, 143,  42, 31400, 421000, now()),
  ('c0000000-0000-0000-0000-00000000000b', 3140, 186,  52,  11,  8900,  71300, now()),
  ('c0000000-0000-0000-0000-00000000000c', 2760, 149,  41,   9,  7200,  58900, now())
on conflict (store_id) do update set
  impressions   = excluded.impressions,
  clicks        = excluded.clicks,
  visits        = excluded.visits,
  conversions   = excluded.conversions,
  spend_cents   = excluded.spend_cents,
  revenue_cents = excluded.revenue_cents,
  updated_at    = now();
