// localImages.ts — vraies photos produit déposées dans assets/offers/.
// Chaque asset est résolu en URI (utilisable par <Image source={{ uri }}> côté RN
// ET par la WebView de la carte). Clé = slug du fichier (sans extension).
//
// Photos sneakers fournies (slug -> produit / coloris d'origine) :
//   veja-campo            Campo Leather White/Black
//   veja-volley           Volley Leather White Tent Bark
//   salar-alveomesh       Salar Alveomesh Tent Black/Walnut
//   etna-suede            Etna Suede Taupe Almond
//   gt-nolyn              GT Nolyn Full Black
//   nike-af1-kobe         Air Force 1 Low (Kobe)
//   nike-am90-laser       Air Max 90 Laser
//   nike-amplus-fff       Air Max Plus OG FFF
//   nike-ava-x            Ava X
//   nike-mercurial-vapor17 Mercurial Vapor 17 Elite
import { Image } from 'react-native';

const MODULES: Record<string, number> = {
  'veja-campo': require('../../assets/offers/veja-campo.jpeg'),
  'veja-volley': require('../../assets/offers/veja-volley.jpeg'),
  'salar-alveomesh': require('../../assets/offers/salar-alveomesh.jpeg'),
  'etna-suede': require('../../assets/offers/etna-suede.jpeg'),
  'gt-nolyn': require('../../assets/offers/gt-nolyn.jpeg'),
  'nike-af1-kobe': require('../../assets/offers/nike-af1-kobe.jpeg'),
  'nike-am90-laser': require('../../assets/offers/nike-am90-laser.jpeg'),
  'nike-amplus-fff': require('../../assets/offers/nike-amplus-fff.jpeg'),
  'nike-ava-x': require('../../assets/offers/nike-ava-x.jpeg'),
  'nike-mercurial-vapor17': require('../../assets/offers/nike-mercurial-vapor17.jpeg'),
  // Fête des pères (cadeau_papa) — sélection curée à photos réelles
  'papa-airtag': require('../../assets/offers/cadeau_papa/papa-airtag.jpeg'),
  'papa-outil': require('../../assets/offers/cadeau_papa/papa-outil.jpeg'),
  'papa-dior-sauvage': require('../../assets/offers/cadeau_papa/papa-dior-sauvage.jpeg'),
  'papa-jbl-flip6': require('../../assets/offers/cadeau_papa/papa-jbl-flip6.jpeg'),
  'papa-fragonard': require('../../assets/offers/cadeau_papa/papa-fragonard.jpeg'),
  'papa-garmin': require('../../assets/offers/cadeau_papa/papa-garmin.jpeg'),
  'papa-guerlain': require('../../assets/offers/cadeau_papa/papa-guerlain.jpeg'),
  'papa-barbier': require('../../assets/offers/cadeau_papa/papa-barbier.jpeg'),
  'papa-philips-oneblade': require('../../assets/offers/cadeau_papa/papa-philips-oneblade.jpeg'),
  'papa-proraso': require('../../assets/offers/cadeau_papa/papa-proraso.jpeg'),
  'papa-ysl': require('../../assets/offers/cadeau_papa/papa-ysl.jpeg'),
};

function toUri(m: number): string {
  // resolveAssetSource n'existe pas pendant le prerender web (SSR Node) : on
  // renvoie '' au build, et la vraie URI est calculée côté client (mobile/web).
  try {
    const fn = (Image as unknown as { resolveAssetSource?: (x: number) => { uri?: string } | undefined }).resolveAssetSource;
    if (typeof fn === 'function') return fn(m)?.uri ?? '';
  } catch { /* SSR / prerender */ }
  return '';
}

/** URI résolue par slug. Vide si la clé est inconnue. */
export const OFFER_IMG: Record<string, string> = Object.fromEntries(
  Object.entries(MODULES).map(([k, v]) => [k, toUri(v)]),
);

export function localOfferImage(key?: string): string | undefined {
  return key ? OFFER_IMG[key] : undefined;
}
