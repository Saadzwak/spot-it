// Accès centralisé aux variables d'environnement publiques (EXPO_PUBLIC_*).
// M0 tourne sans aucune clé : tous les helpers dégradent proprement.

export const ENV = {
  // ⚠️ Fournis TON propre token Mapbox public (pk.) dans .env — voir .env.example.
  // NOTE sécurité : un ancien token `pk.` a pu être committé dans un build web
  // (dist-web/, désormais retiré). Il a été RÉVOQUÉ côté Mapbox et ne fonctionne
  // plus — inutile de le réutiliser depuis l'historique git.
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  mapboxStyle: process.env.EXPO_PUBLIC_MAPBOX_STYLE ?? 'mapbox://styles/mapbox/standard',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  useBackend: (process.env.EXPO_PUBLIC_USE_BACKEND ?? 'false') === 'true',
};

/** Token Mapbox valide présent ? (sinon la carte affiche un fallback stylé) */
export const hasMapbox = (): boolean => ENV.mapboxToken.startsWith('pk.');

/** Backend Supabase activé ET configuré ? (sinon mock local, zéro réseau) */
export const hasSupabase = (): boolean =>
  ENV.useBackend && ENV.supabaseUrl.length > 0 && ENV.supabaseAnonKey.length > 0;
