// ============================================================================
// Spot.it — seed d'offres (FROZEN, source unique partagée)
// Front M0 (zéro réseau), supabase/seed.sql et le mock dashboard s'y alignent.
// Porté de design-ref/spot-it/app/data.jsx + features canoniques + lat/lng Paris.
// Bucket "mode/streetwear" densifié → convergence visible du bandit en ~5 swipes.
// ============================================================================

import type { Offer } from '../types/contracts';

// Position démo de l'utilisateur (Sèvres-Babylone, Paris 6e/7e)
export const DEMO_USER = { lat: 48.8513, lng: 2.3270 };

export const OFFERS: Offer[] = [
  // ── Originaux (design data.jsx) ─────────────────────────────────────────
  {
    id: 'sandro', brand: 'Sandro', title: '-20% sur la nouvelle collection', teaser: 'Nouvelle collection',
    category: 'mode', priceBand: '50-100', offerType: 'discount', sponsored: false,
    whyTemplate: 'Parce que tu adores la mode — et c’est à 4 min à pied.',
    grad: ['#2C2622', '#6E625A'], ink: '#FBF7F2', wordmark: { text: 'SANDRO', spacing: 6, weight: 500 },
    address: '50 rue de Rennes, 75006', lat: 48.8520, lng: 2.3290, distanceM: 280, walkMin: 4,
    description: 'La nouvelle collection Sandro arrive en boutique. Pièces tailleur, mailles fines et coupes nettes — l’offre est valable sur l’ensemble du nouvel arrivage.',
  },
  {
    id: 'sephora', brand: 'Sephora', title: 'Ton cadeau dès 75€ d’achat', teaser: 'Cadeau offert',
    category: 'beaute', priceBand: '50-100', offerType: 'gift', sponsored: true,
    whyTemplate: 'Tu explores la beauté en ce moment — et c’est juste au coin.',
    grad: ['#211A18', '#9E3B2E'], ink: '#FCEDE8', wordmark: { text: 'SEPHORA', spacing: 3, weight: 600 },
    address: '66 av. des Champs, 75008', lat: 48.8698, lng: 2.3079, distanceM: 150, walkMin: 2,
    description: 'Un cadeau beauté exclusif t’attend dès 75€ d’achat en boutique. Sélection de soins et parfums du moment, dans la limite des stocks.',
  },
  {
    id: 'mdm', brand: 'Maisons du Monde', title: 'Bon d’achat dès 150€', teaser: 'Bon d’achat',
    category: 'maison', priceBand: '100+', offerType: 'voucher', sponsored: false,
    whyTemplate: 'Pour ton intérieur — un style chaleureux que tu aimes.',
    grad: ['#A9794E', '#D8B48A'], ink: '#2B2017', wordmark: { text: 'Maisons du Monde', spacing: 1, weight: 500, serif: true, size: 22 },
    address: '10 bd Haussmann, 75009', lat: 48.8729, lng: 2.3317, distanceM: 680, walkMin: 9,
    description: 'Un bon d’achat t’est offert dès 150€ dépensés. Mobilier chaleureux, textiles et décoration pour réchauffer ton intérieur cette saison.',
  },
  {
    id: 'frankie', brand: 'The Frankie Shop', title: '-15% sur la collection été', teaser: 'Collection été',
    category: 'mode', priceBand: '50-100', offerType: 'discount', sponsored: false,
    whyTemplate: 'Coupes minimalistes et tons neutres — pile dans tes goûts.',
    grad: ['#C8A06A', '#EADBC2'], ink: '#3A2E1E', wordmark: { text: 'THE FRANKIE SHOP', spacing: 2, weight: 500, size: 17 },
    address: '5 rue du Vert-Bois, 75003', lat: 48.8662, lng: 2.3578, distanceM: 450, walkMin: 6,
    description: 'La collection été passe à -15%. Tailoring relâché, mailles et basiques élevés — la silhouette du moment, à prix doux.',
  },
  {
    id: 'boulanger', brand: 'Boulanger', title: 'Sony WH-1000XM5 à -20%', teaser: 'Casque Sony -20%',
    category: 'tech', priceBand: '100+', offerType: 'discount', sponsored: false,
    whyTemplate: 'Tu as repéré du son premium récemment — bon plan juste pour toi.',
    grad: ['#24201C', '#4A4038'], ink: '#F4EEE6', wordmark: { text: 'Boulanger', spacing: 1, weight: 600, size: 24 },
    address: 'Forum des Halles, 75001', lat: 48.8623, lng: 2.3470, distanceM: 1200, walkMin: 15,
    description: 'Le casque à réduction de bruit Sony WH-1000XM5 à -20%. Son immersif, autonomie longue durée — testable en boutique avant d’acheter.',
  },
  {
    id: 'lbm', brand: 'Le Bon Marché', title: 'Offre exclusive en boutique', teaser: 'Offre exclusive',
    category: 'mode', priceBand: '100+', offerType: 'exclusive', sponsored: true,
    whyTemplate: 'Le grand magasin que tu adores — une offre rien que pour aujourd’hui.',
    grad: ['#B89B6A', '#E7D6B0'], ink: '#332813', wordmark: { text: 'LE BON MARCHÉ', spacing: 3, weight: 500, size: 17 },
    address: '24 rue de Sèvres, 75007', lat: 48.8510, lng: 2.3245, distanceM: 300, walkMin: 4,
    description: 'Une offre exclusive t’attend au Bon Marché Rive Gauche, aujourd’hui seulement. Mode, maison et épicerie fine réunies sous un même toit.',
  },
  {
    id: 'aesop', brand: 'Aesop', title: 'Offre exclusive en boutique', teaser: 'Offre exclusive',
    category: 'beaute', priceBand: '50-100', offerType: 'exclusive', sponsored: false,
    whyTemplate: 'Soins raffinés — exactement ta zone de goût beauté.',
    grad: ['#5E5B3E', '#B7B189'], ink: '#FAF7EC', wordmark: { text: 'Aēsop', spacing: 2, weight: 500, serif: true, size: 28 },
    address: '256 rue St-Honoré, 75001', lat: 48.8654, lng: 2.3360, distanceM: 450, walkMin: 6,
    description: 'Une offre exclusive sur la gamme soin. Formules d’origine végétale, rituels visage et corps — conseil personnalisé en boutique.',
  },
  // ── Bucket mode/streetwear densifié (convergence démo) ───────────────────
  {
    id: 'axel', brand: 'Axel Arigato', title: 'Ton cadeau dès 75€ d’achat', teaser: 'Cadeau offert',
    category: 'mode', priceBand: '50-100', offerType: 'gift', sponsored: false,
    whyTemplate: 'Sneakers épurées et streetwear pointu — fait pour ton style.',
    grad: ['#7C756E', '#C4BBB2'], ink: '#211D19', wordmark: { text: 'AXEL ARIGATO', spacing: 3, weight: 500, size: 18 },
    address: '12 rue de Marseille, 75010', lat: 48.8702, lng: 2.3637, distanceM: 300, walkMin: 4,
    description: 'Un cadeau offert dès 75€ d’achat. Sneakers minimalistes et pièces streetwear scandinaves — la sélection signature de la maison.',
  },
  {
    id: 'veja', brand: 'Veja', title: '-15% sur les sneakers en cuir', teaser: 'Sneakers -15%',
    category: 'mode', priceBand: '50-100', offerType: 'discount', sponsored: false,
    whyTemplate: 'Sneakers responsables, ligne épurée — dans ton ADN.',
    grad: ['#2E3A2F', '#7E8E6A'], ink: '#F2F4EC', wordmark: { text: 'VEJA', spacing: 5, weight: 600, size: 24 },
    address: '17 rue d’Aboukir, 75002', lat: 48.8665, lng: 2.3445, distanceM: 520, walkMin: 7,
    description: 'Les modèles iconiques en cuir tanné passent à -15%. Sneakers éco-conçues, fabrication transparente — un classique du vestiaire urbain.',
  },
  {
    id: 'nike-rivoli', brand: 'Nike', title: '-20% sur une paire au choix', teaser: 'Sneakers -20%',
    category: 'mode', priceBand: '50-100', offerType: 'discount', sponsored: true,
    whyTemplate: 'Tu vis en sneakers — voici le bon plan du moment.',
    grad: ['#1B1B1B', '#5A5A5A'], ink: '#FAFAFA', wordmark: { text: 'NIKE', spacing: 4, weight: 700, size: 26 },
    address: '79 rue de Rivoli, 75001', lat: 48.8588, lng: 2.3486, distanceM: 380, walkMin: 5,
    description: 'Choisis ta paire et profite de -20% en boutique. Dunk, Air Max, Pegasus — la sélection running et lifestyle du moment.',
  },
  {
    id: 'newbalance', brand: 'New Balance', title: '-15% sur les 990 & 530', teaser: 'Sneakers -15%',
    category: 'mode', priceBand: '50-100', offerType: 'discount', sponsored: false,
    whyTemplate: 'Le confort rétro-running que tu cherches — juste là.',
    grad: ['#3A3F4A', '#8A93A3'], ink: '#F4F6FA', wordmark: { text: 'New Balance', spacing: 1, weight: 600, size: 22 },
    address: '5 rue Tiquetonne, 75002', lat: 48.8638, lng: 2.3489, distanceM: 600, walkMin: 8,
    description: 'Les silhouettes 990 et 530 à -15%. Mesh et suède, semelle ENCAP — l’icône running devenue essentiel streetwear.',
  },
  {
    id: 'carhartt', brand: 'Carhartt WIP', title: 'Ton bonnet offert dès 90€', teaser: 'Cadeau offert',
    category: 'mode', priceBand: '50-100', offerType: 'gift', sponsored: false,
    whyTemplate: 'Workwear et streetwear robuste — pile ton univers.',
    grad: ['#3C2F1E', '#A8854E'], ink: '#F7EFDF', wordmark: { text: 'Carhartt WIP', spacing: 1, weight: 600, size: 21 },
    address: '8 rue Étienne Marcel, 75001', lat: 48.8642, lng: 2.3478, distanceM: 560, walkMin: 7,
    description: 'Un bonnet emblématique offert dès 90€ d’achat. Workwear durable, coupes amples et toile résistante — le streetwear qui dure.',
  },
];

export default OFFERS;
