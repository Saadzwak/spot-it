// ============================================================================
// Spot.it — CORS helper for Edge Functions
// ============================================================================

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/** Return a 200 preflight response for OPTIONS requests. */
export function corsOPTIONS(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

/** Wrap a JSON response with CORS headers. */
export function corsJSON(
  body: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...extra,
    },
  });
}
