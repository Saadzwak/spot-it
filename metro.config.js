// Metro config.
// Le build ESM (.mjs) de zustand utilise `import.meta.env.MODE`. En DEV web, Metro
// sert le bundle en script classique et ne transforme pas les .mjs de node_modules
// → "Cannot use 'import.meta' outside a module" (dashboard web non cliquable).
// Les builds CJS de zustand (index.js / middleware.js) n'utilisent PAS import.meta.
// On force donc zustand vers son CJS UNIQUEMENT sur la plateforme web.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const ZUSTAND_CJS = {
  zustand: path.resolve(__dirname, 'node_modules/zustand/index.js'),
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand/vanilla': path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && ZUSTAND_CJS[moduleName]) {
    return { type: 'sourceFile', filePath: ZUSTAND_CJS[moduleName] };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
