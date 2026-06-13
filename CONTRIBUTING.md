# Contribuer à Spot.it

Spot.it = appli retail-media (Expo SDK 54 · expo-router · TypeScript · Supabase ·
cerveau multi-agents Claude). Ce doc est la **source de vérité** pour bosser à
plusieurs sans se marcher dessus. Lis-le en entier avant ta 1re PR. Voir aussi
[`CONTRACTS.md`](CONTRACTS.md) (interfaces figées) et [`README.md`](README.md).

## TL;DR
- Chacun sur **sa lane**, sa **branche**, des **PR petites et fréquentes** vers `main`.
- **`main` reste toujours vert** : `npx tsc --noEmit` + `npx expo export -p android` passent.
- On **ne touche pas** aux fichiers gelés sans accord (voir plus bas).
- Design **minimaliste type Apple / Revolut** (voir section dédiée).
- `.env` **jamais** commité ; le lead le partage hors-repo.

## Lanes (qui fait quoi)

| Lane | Owner | Possède (édite) | Ne touche pas |
|---|---|---|---|
| **UX (conso)** + bootstrap Supabase | Saad (lead) | `src/app/(tabs)/discover.tsx`, `src/app/(tabs)/map.tsx`, `src/app/onboarding.tsx`, `src/app/landing.tsx`, `src/app/ar.tsx`, `src/swipe/`, `src/map/`, `src/geo/`, `src/store/`, `src/agents/` | la lane Dashboard, les fichiers gelés |
| **Dashboard magasin** + Supabase marchand | Reda | `src/app/(merchant)/`, `src/merchant/` | la lane UX, `src/components/` & `src/design/` (réutilise, ne modifie pas), les fichiers gelés |
| **Partagé / cerveau** | gelé pour l'instant | — | — |

Composants partagés (`src/components/`, `src/design/`) : **réutilise-les**. Si tu as
besoin d'un nouveau composant côté dashboard, mets-le sous `src/merchant/`. Côté UX,
les ajouts à `src/components/` sont OK (additifs) — préviens si tu modifies un
composant existant.

## Fichiers gelés (PR dédiée + accord avant de modifier)
Ils rayonnent sur tout le monde :
- `src/types/contracts.ts` — types partagés (Offer, Taste, API `recommend`, KPIs)
- `src/learning/features.ts` — le bandit (doit rester le miroir de `apply_swipe`)
- `src/design/tokens.ts` — couleurs/typo/rayons
- `src/data/offers.seed.ts` — seed partagé
- `src/lib/supabase.ts` — client Supabase (s'utilise via `getSupabase()`, on ne le réécrit pas)
- `supabase/migrations/*` — schéma/RLS/RPC
- `CONTRACTS.md`

## Direction design (Apple / Revolut — minimaliste)
À respecter strictement, des deux côtés :
- **Minimaliste & fluide** : beaucoup de respiration (whitespace), UNE action primaire
  par écran, hiérarchie typo nette (**Clash Display** titres / **Inter** corps).
- **Couleur retenue** : persimmon `#F9532E` = **unique accent** ; crème `#F7F5F1` ;
  encre `#17130F`. Coins généreux, ombres subtiles. **Aucun dégradé tape-à-l'œil**,
  zéro surcharge. Réutilise `@/design/theme` + `@/components` — n'invente pas de palette.
- **Animations fluides et simples** (Reanimated/spring) : micro-interactions
  discrètes, transitions douces. Rien de clinquant.
- **"Response time effect"** : feedback < 100 ms à chaque interaction (états pressés
  scale/opacity, haptique légère sur les actions clés), **UI optimiste** (on n'attend
  pas le réseau), **skeletons/shimmer** au lieu de spinners. L'app doit sembler instantanée.

## Workflow git
1. Pars de `main` à jour : `git switch main && git pull`.
2. Crée ta branche : `git switch -c ux-<sujet>` ou `dashboard-<sujet>`.
3. Commits **atomiques et fréquents** (un par livrable). Messages clairs.
4. Avant de pousser : `npx tsc --noEmit` **et** `npx expo export -p android` verts.
5. Ouvre une **PR vers `main`** (petite de préférence). La **CI** (tsc + bundle) doit
   passer ✅ avant merge. Rebase si `main` a bougé : `git pull --rebase origin main`.
6. Ne pousse **jamais** directement sur `main` pour une feature — passe par une PR.
7. Le lead garde `main` vert et intègre souvent.

> Astuce multi-agents : fais bosser ton Claude dans un **git worktree** dédié à ta
> branche pour ne pas polluer l'arbre de travail de l'autre.

## Supabase (intégration)
- Marche en **mock sans clés** (`EXPO_PUBLIC_USE_BACKEND=false`) ET en **réel** quand
  les clés sont là (`hasSupabase()`), des deux côtés.
- **Bootstrap (lead, une fois)** : `npx supabase link` → `npx supabase db push` + seed
  → `npx supabase functions deploy` → `npx supabase secrets set ANTHROPIC_API_KEY=…`
  → renseigner `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` +
  `EXPO_PUBLIC_USE_BACKEND=true` dans `.env`.
- **Conso (UX)** : auth **anonyme** au démarrage ; `profiles`, `apply_swipe` RPC,
  wishlist, `nearby_stores`, realtime `profiles.taste` ; repli local sinon.
- **Magasin (Dashboard)** : auth marchand (compte démo seedé, voir `supabase/README.md`,
  mdp `demo1234`) ; `store_kpis` realtime, `merchant_offer_stats`, CRUD offers/campaigns ;
  mock fallback sinon.
- Le client `src/lib/supabase.ts` est **partagé/gelé** : on l'utilise via `getSupabase()`,
  l'auth se fait **au-dessus**, dans chaque lane.

## Commandes dev
```bash
npm install --legacy-peer-deps     # install (peer deps tolérées)
npx tsc --noEmit                   # typecheck
npx expo export -p android         # vérifie que ça bundle (gate CI)
# Lancer Metro (UN seul par device, ports distincts si plusieurs) :
npx expo start --tunnel -c --port 8082   # UX (Saad)
npx expo start --tunnel -c --port 8083   # Dashboard (Reda)
npx expo start --web                     # dashboard en web (route /dashboard)
```
Sur iPhone : Expo Go → scanner le QR du tunnel. **Un seul Metro à la fois** par poste.

## Secrets
- `.env` est **gitignoré** — ne le commite jamais. Le lead le partage hors-repo
  (Signal/1Password…). `.env.example` documente les variables.
- **Rotate** les clés (Mapbox `pk.`, `ANTHROPIC_API_KEY`) après le hackathon.

## Règles d'or
- `main` toujours exécutable. Une PR qui casse la CI ne merge pas.
- Petites PR > grosses PR. Intègre souvent.
- Reste dans ta lane. Touche au gelé = PR dédiée + accord.
- En cas de doute sur une interface : relis `CONTRACTS.md`, demande avant de diverger.
