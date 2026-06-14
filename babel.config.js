// Expo Babel config.
// `babel-plugin-transform-import-meta` neutralise `import.meta` au build :
// zustand v5 émet `import.meta.env.MODE`, ce qui casse le bundle WEB (chargé en
// script classique → "Cannot use 'import.meta' outside a module"). Le transform
// le remplace côté build, pour toutes les plateformes (no-op sur natif).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['babel-plugin-transform-import-meta'],
  };
};
