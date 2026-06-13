// ============================================================================
// Spot.it — design tokens  (FROZEN CONTRACT)
// Source de vérité: design-ref/spot-it/Spot.it.html (:root) + app/data.jsx.
// color-mix() n'existe pas en RN → valeurs dérivées précalculées en hex.
// ============================================================================

export const colors = {
  canvas: '#F7F5F1',   // fond crème chaud
  surface: '#FFFFFF',  // cartes, feuilles
  ink: '#17130F',      // texte primaire
  ink2: '#5C544C',     // texte secondaire
  ink3: '#9C9087',     // texte faible
  line: 'rgba(23,19,15,0.08)',
  accent: '#F9532E',   // persimmon — like, CTA, spot
  // color-mix(in srgb, accent 13%, #fff) — tint "Pourquoi pour toi"
  accentSoft: '#FEE9E4',
  // color-mix(in srgb, accent 74%, #2a0f08) — texte sur accentSoft
  accentInk: '#C34124',
  white: '#FFFFFF',
  black: '#17130F',
} as const;

// Palette catégories chaudes (jamais de bleu Google) — app/data.jsx → CATEGORIES
export const categories = {
  mode:   { id: 'mode',   label: 'Mode',   hue: '#C75B43', tint: '#F6E4DD' },
  tech:   { id: 'tech',   label: 'Tech',   hue: '#3B342C', tint: '#EAE4DB' },
  maison: { id: 'maison', label: 'Maison', hue: '#A9794E', tint: '#F1E7D8' },
  beaute: { id: 'beaute', label: 'Beauté', hue: '#B26B7A', tint: '#F4E5E9' },
} as const;

export const radius = {
  card: 22,    // --r-card
  pill: 999,
  sheet: 28,
  chip: 999,
} as const;

export const fonts = {
  // Chargés via expo-font. display = Clash Display (Fontshare), body = Inter.
  // Fallback système si non chargé (cf. src/design/theme).
  display: 'ClashDisplay',
  body: 'Inter',
} as const;

// Ombres → styles RN (iOS shadow* + Android elevation)
export const shadows = {
  sm: {
    shadowColor: '#17130F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  card: {
    shadowColor: '#17130F', shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22, shadowRadius: 28, elevation: 12,
  },
} as const;

// Spring "signature" — approx cubic-bezier(.34,1.4,.5,1) (léger overshoot).
// Pour reanimated withSpring(value, spring).
export const spring = { damping: 14, stiffness: 180, mass: 0.7 } as const;

// Durées de motion (ms) — entrées de feuilles/notif/étapes
export const motion = {
  sheetUp: 420,
  stepIn: 350,
  notifIn: 500,
  spotPulse: 2400,
  proxPulse: 3500,
} as const;

export type CategoryId = keyof typeof categories;

export const tokens = { colors, categories, radius, fonts, shadows, spring, motion };
export default tokens;
