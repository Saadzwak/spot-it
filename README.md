# Spot.it — repère les meilleures offres autour de toi

Plateforme **retail media** double-face :
- **Shopper** — déclare une intention, l'IA pose 2 questions, puis découvre des offres perso sur une **carte** ; **itinéraire à pied qui suit ta position en temps réel** ; alerte de **proximité** (~400 m d'un magasin partenaire) ; **vue AR**.
- **Magasin** (qui paie) — **dashboard web** : KPIs, dépense (forfait + sponsoring), catalogue → fiche produit, ciblage → campagnes.

Cerveau **multi-agents (API Claude)** : questions de suivi + agent de curation. Boucle d'apprentissage en ligne sur les swipes. Consentement **RGPD** au centre (partage OFF par défaut).

## Stack

- **Expo SDK 54** (React Native 0.81.5, React 19.1) + **expo-router** — testé dans **Expo Go**
- Carte : **Mapbox GL JS v3 dans `react-native-webview`** (token `pk.` public uniquement)
- Géo : `expo-location` · Notifs locales : `expo-notifications` · Caméra (AR) : `expo-camera`
- État : **zustand v4** (⚠️ v4 volontaire + `metro.config.js` force zustand → build CJS sur web pour éviter l'erreur `import.meta`)
- Cerveau : **API Claude** via **Expo Router API routes** (`src/app/api/*+api.ts`, clé lue côté serveur dans `process.env`, jamais bundlée) — `claude-haiku-4-5`
- Backend : **Supabase** (PostGIS, RLS, Edge Functions)

## Démarrer

```bash
npm install --legacy-peer-deps      # le flag est REQUIS (résout les peer deps)
cp .env.example .env                 # Windows : copy .env.example .env  → puis remplis les clés
npx expo start --tunnel              # mobile : scanne le QR avec Expo Go
# (pour le tunnel : npm install -g @expo/ngrok si demandé)
```

- **App shopper (mobile)** : scanne le QR Expo Go.
- **Dashboard magasin (web)** : ouvre `http://localhost:8081` (ou l'URL du tunnel) dans un navigateur → **« Espace magasin »** → login démo **`merchant@demo.spotit` / `demo1234`**.

Sans `.env`, l'app tourne en **fallback local** (seed `src/data/offers.seed.ts`, bandit client) mais la carte, l'IA de curation et le login dashboard nécessitent les clés.

**Vérifier que tout compile :** `npx tsc --noEmit` puis `npx expo export -p android` (et `-p web` pour le dashboard).

## Variables d'environnement

Voir [`.env.example`](.env.example) (placeholders uniquement — jamais de vraie clé commitée).

| Variable | Côté | Rôle |
|---|---|---|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | client (public `pk.`) | tuiles + Directions (à restreindre par bundle-ID côté Mapbox) |
| `EXPO_PUBLIC_MAPBOX_STYLE` | client | style de carte |
| `EXPO_PUBLIC_SUPABASE_URL` | client | URL projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client (anon, sûre, RLS) | accès client |
| `EXPO_PUBLIC_USE_BACKEND` | client | `true` = backend activé |
| `ANTHROPIC_API_KEY` | **serveur** (API routes) | curation Claude — `process.env`, jamais bundlée |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur** (Edge Functions) | admin (bypass RLS) — jamais côté client |

> 🔒 Les `EXPO_PUBLIC_*` sont inlinés dans le bundle (c'est voulu : `pk.` + clé anon sont publiques par design). Les clés serveur restent hors bundle.

> ⚠️ **Note sécurité.** Un ancien token Mapbox public (`pk.`) a pu apparaître dans un build web committé (`dist-web/`, désormais retiré du repo et de l'historique courant). **Ce token a été révoqué côté Mapbox et ne fonctionne plus** — s'il subsiste dans d'anciens commits, il est inutilisable. Fournissez votre propre token `pk.` (restreint par URL) dans votre `.env` local.

## Architecture

```
src/
  app/            écrans (expo-router): welcome, onboarding, (tabs) Découvrir/Carte/Wishlist/Profil,
                  offer/[id], redeem/[id], ar, (merchant) dashboard/catalog/targeting/audience (web)
  app/api/        routes serveur Claude : curate+api.ts, intent-followup+api.ts (clé hors bundle)
  components/     design system RN — SpotMark, BrandTile, MagicLoader, ItinerarySheet, NotifPermissionModal…
  agents/intent   questions de suivi + agent de curation (Claude, repli local) ; fête des pères déterministe
  map/            MapWebView + mapHtml (Mapbox GL JS, itinéraire + navigation qui suit)
  merchant/       données + composants du dashboard (charts, KPIs, mock)
  data/           offers.seed.ts (offres Lille) + localImages.ts (photos produit) + onboarding.ts
  geo/ learning/ store/ lib/   proximité, bandit, zustand, env + tracking
supabase/         migrations (schema/RLS/RPC), functions, seed
```

Contrats figés : [`CONTRACTS.md`](CONTRACTS.md) · Workflow d'équipe : [`CONTRIBUTING.md`](CONTRIBUTING.md) · Backend : [`supabase/README.md`](supabase/README.md).

## Démo (fête des pères)

Welcome → onboarding (position + notifs natives) → **« un cadeau pour mon père »** → 2 questions (âge + mode de vie) → **loader de curation** → carte avec **uniquement les 11 cadeaux** (photos réelles) → tap une offre → **« Itinéraire »** → la carte **te suit** (zoom rue + cap) → dashboard magasin (web) : dépense, catalogue, ciblage.
