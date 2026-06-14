// Expo Babel config.
// On utilise zustand v4 (pas v5) pour éviter `import.meta.env.MODE`, qui casse le
// bundle WEB chargé en script classique en DEV ("Cannot use 'import.meta' outside a
// module") — Metro ne transforme pas les .mjs de node_modules en dev. Le plugin
// reste en filet de sécurité pour tout import.meta côté code applicatif (no-op natif).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['babel-plugin-transform-import-meta'],
  };
};
