// Déclarations ambiantes pour les imports CSS (web) du template Expo.
// Normalement fournies par expo-env.d.ts (généré, gitignoré) — on les fige ici
// pour que `tsc --noEmit` passe sur une checkout fraîche.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
