# Spot.it — Contrats partagés (FIGÉS)

> Tout sous-agent lit ce fichier **en premier**. Ces interfaces sont stables : on construit dessus. Un changement ici = un changement de contrat (commit dédié, prévenir les autres chantiers).

## 0. Stack & conventions

- **Expo SDK 56** (RN 0.85, React 19.2), **expo-router** (routes dans `src/app/`), TypeScript.
- Carte = **Mapbox GL JS v3 dans `react-native-webview`** (Expo Go, clé `pk.` only). Pas de module natif.
- Géo = `expo-location` (avant-plan) ; notifs = `expo-notifications` (locales). Background geofencing = prod/stretch (dev build).
- Backend = **Supabase** (Postgres + PostGIS, RLS, Edge Functions Deno). Brain = API Claude **côté serveur**.
- État = **zustand**. Données = `@supabase/supabase-js`.
- **M0 doit tourner ENTIÈREMENT sans clé ni réseau** (`EXPO_PUBLIC_USE_BACKEND=false` → seed local).

## 1. Découpage des répertoires (éviter les collisions entre chantiers)

| Chantier | Écrit dans | Lit (ne modifie pas) |
|---|---|---|
| **Front / M0** | `src/app/(tabs)/`, `src/app/onboarding/`, `src/app/offer/`, `src/screens/`, `src/map/`, `src/geo/`, `src/store/`, `src/app/_layout.tsx`, `src/app/index.tsx` | `src/design/`, `src/learning/`, `src/types/`, `src/components/`, `src/data/` |
| **Design system** | `src/design/`, `src/components/` (port RN), `src/assets/fonts/` | `design-ref/`, `src/types/` |
| **Backend** | `supabase/` (migrations, functions, seed) | `src/types/contracts.ts`, `src/data/offers.seed.ts`, `src/learning/features.ts` |
| **Dashboard** | `src/app/(merchant)/`, `src/merchant/` | `src/design/`, `src/types/`, `src/data/` |

`src/types/`, `src/learning/`, `src/design/tokens.ts`, `src/data/offers.seed.ts` sont **figés** — ne pas les modifier sans accord.

## 2. Modèle d'offre + vecteur de features (le bandit)

- Types : [`src/types/contracts.ts`](src/types/contracts.ts) — `Offer`, `Taste`, `FeatureVector`, `Profile`, `RecommendRequest/Response`, `StoreKpis`.
- Logique : [`src/learning/features.ts`](src/learning/features.ts) — **source de vérité** du bandit.
- **Features one-hot** (une dimension par VALEUR) : `cat:<mode|tech|maison|beaute>`, `brand:<slug>`, `price_band:<0-20|20-50|50-100|100+>`, `offer_type:<discount|gift|voucher|exclusive|bogo>`, `dist_band:<<400|400-800|800-1500|1500+>` (dynamique, depuis la position user), `sponsored`, `bias`.
- **Score** : `p = σ(bias + Σ wᵢ·xᵢ)` → sert au **rang** du deck.
- **Update SGD** : `wᵢ ← wᵢ + η·(y−p)·xᵢ`, `η=0.4`, `y=accept?1:0`. ⚠️ `applySwipeLocal` (client) et `public.apply_swipe` (SQL) DOIVENT rester identiques.
- **Pourquoi pour toi** : `reasonFor()` = argmax des features actives (hors bias/sponsored) → string FR.
- **Exploration** : epsilon-greedy bas (`ε₀=0.15 → 0.05`), `buildDeck()`.
- **Cold start** : `seedFromOnboarding(picks)` → poids +1.0 (jamais +3, sature la sigmoïde).
- **Seed partagé** : [`src/data/offers.seed.ts`](src/data/offers.seed.ts) — ids/features de référence. `supabase/seed.sql` et le mock dashboard s'y alignent.

## 3. Supabase (schéma + RLS + RPC)

Migrations figées :
- [`0001_schema.sql`](supabase/migrations/0001_schema.sql) — `profiles`(taste jsonb, consent), `merchants`, `stores`(geography+GiST), `offers`(features canoniques), `campaigns`, `swipe_events`(brut privé), `wishlist`, `recommendations_log`, `store_kpis`.
- [`0002_rls.sql`](supabase/migrations/0002_rls.sql) — RLS partout ; consumer = ses lignes ; merchant = ses stores/offers/campaigns ; **jamais** de SELECT merchant sur `swipe_events` ; `custom_access_token_hook` (rôle dans le JWT) ; `private.owns_store()`.
- [`0003_rpc.sql`](supabase/migrations/0003_rpc.sql) — `nearby_stores(lat,lng,radius_m=400)`, `stores_in_view(bbox)`, `apply_swipe(user,offer,action,x,eta)` (insert event + update taste, **une transaction**), `merchant_offer_stats(store_id)` (agrégats SECURITY DEFINER).

Liens : `auth.users → merchants.user_id → stores.merchant_id → offers.store_id`. Offre = ownership via le store.

## 4. API `recommend` (Edge Function, clé Claude côté serveur)

- Endpoint : `supabase.functions.invoke('recommend', { body: RecommendRequest })`.
- I/O : `RecommendRequest` → `RecommendResponse` (cf. contracts.ts).
- Pipeline (orchestrateur = code TS) : Catalogue (SQL `nearby_stores`/`offers`, **pas de LLM**) → **Décision** `claude-haiku-4-5` (JSON `output_config.format` → `ranking`) → **Génération** `claude-sonnet-4-6` (streamée → `reasons` FR). Profil = `claude-haiku-4-5` offline/cron. Synthèse = `claude-opus-4-8` offline (option).
- `thinking:{type:'adaptive'}` (pas `budget_tokens`/`temperature` sur 4.8). Haiku 4.5 : **pas** d'`effort`, 200K ctx.
- **Pas de clé ⇒ stub** : renvoyer `RecommendResponse` mocké (`mocked:true`) = ranking par score local + `reasonFor()`. Aucun chantier ne doit être bloqué par l'absence de clé.
- `recommendations_log.model` = modèle **réellement** utilisé.

## 5. Env & sécurité

- Voir [`.env.example`](.env.example). Client = `EXPO_PUBLIC_*` (public, RLS protège). Serveur = secrets Edge Function (`ANTHROPIC_API_KEY`, service role) — **jamais** dans le client.
- `EXPO_PUBLIC_USE_BACKEND=false` (défaut) ⇒ M0 100% local. `true` ⇒ branche Supabase + Edge Function.
- Clés réelles fournies plus tard : utiliser des placeholders + stubs/mocks en attendant.

## 6. Règles d'exécution

- **M0 vert en permanence.** Tout commit doit laisser `npx expo start` fonctionnel.
- **Commits atomiques fréquents** (chaque contrat figé, chaque livrable de sous-agent). `.env` jamais commité.
- Parallélisme = modules indépendants seulement ; le couplé se fait après intégration des contrats.
- Fidélité design : `design-ref/spot-it/` (HTML + JSX) = référence visuelle ; tokens dans `src/design/tokens.ts`.

## 7. Design tokens (résumé)

`#F7F5F1` canvas · `#FFFFFF` surface · `#17130F`/`#5C544C`/`#9C9087` ink · `#F9532E` accent (soft `#FEE9E4`, ink `#C34124`) · radius carte 22 · Clash Display (titres) + Inter (corps) · spring `cubic-bezier(.34,1.4,.5,1)` ≈ `{damping:14,stiffness:180,mass:0.7}`. Catégories : mode `#C75B43`, tech `#3B342C`, maison `#A9794E`, beauté `#B26B7A`. Détails : [`src/design/tokens.ts`](src/design/tokens.ts).
