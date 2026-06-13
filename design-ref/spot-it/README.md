# Spot.it — design & handoff

Prototype interactif iOS prêt à reprendre en **React Native / Expo**.
Ouvrir `Spot.it.html`. Le rail à gauche (hors device) saute entre les 8 écrans pour la revue ; il ne fait pas partie de l'app.

## Design tokens (voir `:root` dans `Spot.it.html`)
| Token | Valeur | Usage |
|---|---|---|
| `--canvas` | `#F7F5F1` | fond crème chaud |
| `--surface` | `#FFFFFF` | cartes, feuilles |
| `--ink` / `--ink-2` / `--ink-3` | `#17130F` / `#5C544C` / `#9C9087` | texte primaire / secondaire / faible |
| `--accent` | `#F9532E` | persimmon — like, CTA, spot |
| `--accent-soft` / `--accent-ink` | dérivés `color-mix` | tint « Pourquoi pour toi », texte sur tint |
| `--r-card` | `22px` | rayon cartes |
| `--font-display` | Clash Display | titres |
| `--font-body` | Inter | corps |

Tints catégories (chaudes) dans `app/data.jsx → CATEGORIES` : Mode `#C75B43`, Tech `#3B342C`, Maison `#A9794E`, Beauté `#B26B7A`.

## Architecture des composants (`app/`)
- `data.jsx` — `CATEGORIES`, `OFFERS` (modèle prêt RN ; `grad` = placeholder photo à remplacer par une vraie image produit/boutique).
- `icons.jsx` — `Icon` (ligne fine, stroke cohérent).
- `ui.jsx` — `SpotMark`, `SpotLogo`, `BrandTile`, `BrandAvatar`, `CatChip`, `DistancePill`, `WhyForYou`, `Sponsored`.
- `nav.jsx` — `TabBar` (Découvrir / Carte / Wishlist / Profil).
- `screen-onboarding.jsx`, `screen-discover.jsx`, `screen-map.jsx`, `screen-detail.jsx`, `screen-wishlist.jsx`, `screen-profile.jsx`, `extras.jsx` (`NotifBanner`, `AgentSheet`), `app.jsx` (état + frame).

## Notes de build
- **Carte** : stand-in custom HTML/SVG (`MapArt` dans `screen-map.jsx`) qui définit le style cible — terre crème/sable, eau à peine teintée, rues fines, labels masqués, offres = bulles de marque + halo. À reproduire en **Mapbox custom style** (clé API à ajouter). Les pins utilisent `OFFERS[].x/y` (0..1) → remplacer par lat/lng réelles.
- **Swipe** : geste réel (rotation + spring) + boutons. En RN : `react-native-gesture-handler` + `reanimated`.
- **Images** : `BrandTile` = duotone + wordmark. Remplacer par `<Image>` (photo produit) ; garder l'overlay dégradé bas pour la lisibilité du texte.
- **Confiance / données** : toggles Profil ; partage **OFF par défaut**.
