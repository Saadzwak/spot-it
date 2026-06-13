// Expo API ROUTE (serveur) — AGENT DE CURATION. À partir du besoin utilisateur
// et du catalogue, sélectionne UNIQUEMENT les offres vraiment pertinentes (max 10),
// classées. Clé Claude côté serveur, jamais dans le bundle. Repli local côté client.

const SCHEMA = {
  type: 'object',
  properties: {
    offerIds: { type: 'array', items: { type: 'string' } },
    headline: { type: 'string' },
  },
  required: ['offerIds', 'headline'],
  additionalProperties: false,
};

export async function POST(request: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'no_key' }, { status: 503 });

  let body: any = {};
  try { body = await request.json(); } catch { /* */ }
  const intent = String(body?.intent ?? '').slice(0, 300);
  const answers = body?.answers ?? {};
  const offers = Array.isArray(body?.offers) ? body.offers.slice(0, 60) : [];
  if (!offers.length) return Response.json({ error: 'no_offers' }, { status: 400 });

  const catalog = offers.map((o: any) =>
    `${o.id} | ${o.brand} | ${o.title} | cat:${o.category} | prix:${o.priceBand} | type:${o.offerType}`,
  ).join('\n');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        system:
          "Tu es l'agent de curation de Spot.it. À partir du besoin déclaré par l'utilisateur " +
          '(et de ses réponses), sélectionne dans le CATALOGUE uniquement les offres VRAIMENT pertinentes, ' +
          'classées de la plus pertinente à la moins (max 10). Renvoie EXACTEMENT les ids du catalogue. ' +
          "Si rien ne correspond vraiment, renvoie offerIds vide. Ajoute un headline court en français " +
          "(ex. \"8 pépites pour toi\"). Sois sélectif : mieux vaut 5 offres parfaites que 20 moyennes.",
        messages: [{
          role: 'user',
          content: `Besoin: "${intent}"\nRéponses: ${JSON.stringify(answers)}\n\nCATALOGUE (id | marque | titre | catégorie | prix | type):\n${catalog}`,
        }],
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      }),
    });
    if (!r.ok) return Response.json({ error: 'upstream', status: r.status }, { status: 502 });
    const data = await r.json();
    const block = (data?.content || []).find((b: any) => b.type === 'text');
    const parsed = block ? JSON.parse(block.text) : null;
    if (!parsed?.offerIds) return Response.json({ error: 'parse' }, { status: 502 });
    return Response.json({ offerIds: parsed.offerIds, headline: parsed.headline ?? '', model: 'claude-haiku-4-5' });
  } catch {
    return Response.json({ error: 'exception' }, { status: 502 });
  }
}
