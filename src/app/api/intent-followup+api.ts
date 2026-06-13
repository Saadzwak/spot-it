// Expo Router API ROUTE (serveur) — génère 2 questions de suivi via Claude rapide.
// La clé ANTHROPIC_API_KEY reste côté serveur (process.env), JAMAIS dans le bundle.
// Appelée par src/agents/intent.ts ; repli local si indisponible.

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
        },
        required: ['question', 'options'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

export async function POST(request: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'no_key' }, { status: 503 });

  let intent = '';
  try { intent = String((await request.json())?.intent ?? '').slice(0, 300); } catch { /* ignore */ }
  if (!intent) return Response.json({ error: 'no_intent' }, { status: 400 });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system:
          "Tu es l'assistant shopping de Spot.it. À partir d'un besoin déclaré par l'utilisateur, " +
          'génère EXACTEMENT 2 questions de clarification très courtes en français, étroitement liées ' +
          'à ce besoin, pour mieux le cerner et accélérer la recommandation. Chaque question a 3 à 4 ' +
          'options courtes (1 à 3 mots). Inclure le budget seulement si pertinent. Tutoiement, ton sympa.',
        messages: [{ role: 'user', content: `Besoin: "${intent}"` }],
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      }),
    });
    if (!r.ok) return Response.json({ error: 'upstream', status: r.status }, { status: 502 });
    const data = await r.json();
    const block = (data?.content || []).find((b: any) => b.type === 'text');
    const parsed = block ? JSON.parse(block.text) : null;
    if (!parsed?.questions) return Response.json({ error: 'parse' }, { status: 502 });
    return Response.json({ questions: parsed.questions, model: 'claude-haiku-4-5' });
  } catch (e) {
    return Response.json({ error: 'exception' }, { status: 502 });
  }
}
