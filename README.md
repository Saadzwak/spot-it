# Spot.it — repère les meilleures offres autour de toi

Plateforme **retail media** double-face (hackathon 24h) :
- **Shopper** — déclare une intention, découvre des offres perso par **swipe** + **carte**, reçoit une alerte de **proximité** (~5 min / 400 m d'un magasin partenaire).
- **Magasin** (qui paie) — profil enseigne, catalogue, ciblage, **KPIs temps réel**.

Cerveau **multi-agents (API Claude)** + **boucle d'apprentissage en ligne** : chaque swipe met à jour un profil de goûts ; après ~5 swipes, le deck change visiblement. Consentement **RGPD** au centre (partage OFF par défaut).

## Stack

- **Expo SDK 56** (RN 0.85, React 19) + **expo-router** — testé dans **Expo Go**
- Carte : **Mapbox GL JS v3 dans react-native-webview** (clé `pk.` only)
- Géo : `expo-location` (avant-plan) · Notifs : `expo-notifications` (locales)
- État : **zustand** · Backend : **Supabase** (PostGIS, RLS, Edge Functions)
- Cerveau : **API Claude** côté serveur (`claude-haiku-4-5` / `claude-sonnet-4-6`)

## Démarrer (M0 — zéro clé requise)

```bash
npm install
npx expo start            # scanne le QR avec Expo Go (Android conseillé)
```

M0 tourne **100% en local** (seed `src/data/offers.seed.ts`, bandit client, carte en fallback si pas de token). Pour activer la carte + le backend, copie `.env.example` → `.env` et renseigne les clés (voir ci-dessous).

## Variables d'environnement

Voir [`.env.example`](.env.example). Client = `EXPO_PUBLIC_*` (public, RLS protège) :
`EXPO_PUBLIC_MAPBOX_TOKEN` (pk.), `EXPO_PUBLIC_MAPBOX_STYLE`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_USE_BACKEND=true`.
Serveur (jamais dans le client, `supabase secrets set`) : `ANTHROPIC_API_KEY`.

## Architecture

```
src/
  app/            écrans (expo-router): onboarding, (tabs) Découvrir/Carte/Wishlist/Profil, offer/[id], (merchant) dashboard
  components/     design system RN (porté de design-ref) — SpotMark, BrandTile, WhyForYou…
  design/         tokens (figés) + theme (fonts, presets)
  learning/       bandit : features one-hot, score σ, SGD, reasonFor, epsilon-greedy
  swipe/          SwipeDeck (geste rotation+spring)
  map/            MapWebView + HTML Mapbox GL JS
  geo/            proximité (Haversine) + notifs + géofencing (prod)
  store/          zustand (profil, deck, wishlist, consent)
  agents/         pont vers l'Edge Function recommend (+ mock local)
  data/           seed d'offres partagé + options d'onboarding
supabase/         migrations (schema/RLS/RPC), functions (recommend/profil), seed
design-ref/       export Claude Design (référence visuelle)
```

Contrats partagés (interfaces figées) : [`CONTRACTS.md`](CONTRACTS.md).
Backend local : [`supabase/README.md`](supabase/README.md).

## Démo (2 min)

Onboarding → swipe 5 sneakers → le deck se remplit de mode/streetwear + la ligne « Pourquoi pour toi » change → Carte (bulles + cercle 400 m) → « Simuler la marche » → notification → détail offre → dashboard magasin (KPIs).
