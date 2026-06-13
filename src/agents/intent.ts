// intent.ts — affinage du besoin déclaré ("Voilà ce que je veux").
// Tente la route API serveur (Claude rapide, clé côté serveur) ; à défaut,
// repli LOCAL par mots-clés (le flux ne casse jamais).
import Constants from 'expo-constants';
import { catKey, offerTypeKey, priceBandKey } from '@/learning/features';

export interface FollowupQ { id: string; question: string; options: string[] }

function devServerUrl(path: string): string | null {
  const host = (Constants.expoConfig as any)?.hostUri || (Constants as any)?.expoGoConfig?.debuggerHost;
  if (!host) return null;
  const scheme = host.includes('.exp.direct') || host.includes('https') ? 'https' : 'http';
  const clean = host.replace(/^https?:\/\//, '');
  return `${scheme}://${clean}${path}`;
}

/** Questions de suivi tailored. Essaie Claude (route API), sinon repli local. */
export async function getIntentFollowups(intent: string): Promise<FollowupQ[]> {
  const url = devServerUrl('/api/intent-followup');
  if (url) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intent }), signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.questions) && data.questions.length) {
          return data.questions.slice(0, 3).map((q: any, i: number) => ({
            id: `ai-${i}`, question: String(q.question), options: (q.options || []).slice(0, 4).map(String),
          }));
        }
      }
    } catch {
      /* repli local */
    }
  }
  return localFollowups(intent);
}

const BUDGET_Q: FollowupQ = { id: 'budget', question: 'Ton budget ?', options: ['< 50 €', '50–100 €', '100 €+', 'Peu importe'] };

export function localFollowups(intent: string): FollowupQ[] {
  const s = intent.toLowerCase();
  let second: FollowupQ;
  if (/(livre|book|bd|manga|roman)/.test(s)) second = { id: 'k', question: 'Quel genre ?', options: ['Roman', 'BD / manga', 'Essai', 'Jeunesse'] };
  else if (/(sneaker|basket|chaussure|running|nike|adidas)/.test(s)) second = { id: 'k', question: 'Quel style ?', options: ['Running', 'Lifestyle', 'Ville chic', 'Peu importe'] };
  else if (/(cadeau|gift|offrir)/.test(s)) second = { id: 'k', question: 'Pour qui ?', options: ['Moi', 'Mon/ma partenaire', 'Un proche', 'Un collègue'] };
  else if (/(casque|écouteur|ecouteur|audio|son|enceinte)/.test(s)) second = { id: 'k', question: 'Pour quel usage ?', options: ['Musique', 'Sport', 'Travail', 'Voyage'] };
  else if (/(parfum|beauté|beaute|soin|crème|creme|maquillage)/.test(s)) second = { id: 'k', question: 'Plutôt ?', options: ['Frais', 'Boisé', 'Floral', 'Surprends-moi'] };
  else if (/(salon|maison|déco|deco|chambre|cuisine|meuble)/.test(s)) second = { id: 'k', question: 'Quelle pièce ?', options: ['Salon', 'Chambre', 'Cuisine', 'Bureau'] };
  else second = { id: 'k', question: 'Tu cherches plutôt…', options: ['Du neuf', 'Un bon plan', 'Du haut de gamme', 'Surprends-moi'] };
  return [BUDGET_Q, second];
}

/** Dérive des clés de features (seed bandit) depuis l'intention + réponses. */
export function buildIntentPicks(intent: string, answers: Record<string, string>): { picks: string[]; summary: string } {
  const s = `${intent} ${Object.values(answers).join(' ')}`.toLowerCase();
  const picks = new Set<string>();
  if (/(sneaker|basket|chaussure|mode|veste|vêtement|vetement|jean|nike|adidas|streetwear)/.test(s)) picks.add(catKey('mode'));
  if (/(casque|écouteur|ecouteur|audio|tech|console|téléphone|telephone|ordinateur)/.test(s)) picks.add(catKey('tech'));
  if (/(salon|maison|déco|deco|meuble|chambre|cuisine)/.test(s)) picks.add(catKey('maison'));
  if (/(parfum|beauté|beaute|soin|crème|creme|maquillage)/.test(s)) picks.add(catKey('beaute'));
  // budget
  if (/< ?50|moins de 50|petit budget/.test(s)) { picks.add(priceBandKey('0-20')); picks.add(priceBandKey('20-50')); }
  else if (/50.?100/.test(s)) picks.add(priceBandKey('50-100'));
  else if (/100 ?€?\+|plus de 100|haut de gamme/.test(s)) picks.add(priceBandKey('100+'));
  // type
  if (/bon plan|promo|remise|discount|pas cher/.test(s)) picks.add(offerTypeKey('discount'));
  if (/cadeau|offrir|gift/.test(s)) picks.add(offerTypeKey('gift'));
  if (/exclu|haut de gamme|premium|luxe/.test(s)) picks.add(offerTypeKey('exclusive'));
  return { picks: [...picks], summary: intent.trim() };
}
