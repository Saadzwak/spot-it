// ============================================================================
// Spot.it — Anthropic API wrapper (Deno fetch, server-side only)
//
// Models used in Spot.it (per CONTRACTS.md §4):
//   Decision : claude-haiku-4-5   (no effort param; 200K ctx)
//   Generation: claude-sonnet-4-6  (structured or streamed)
//   Profil    : claude-haiku-4-5
//   Synthèse  : claude-opus-4-8   (thinking:{type:'adaptive'}; no budget_tokens/temperature)
//
// IMPORTANT: No temperature / top_p on claude-sonnet-4-6 / claude-opus-4-8.
//            No effort param on any model in this stack.
//            thinking:{type:'adaptive'} on claude-opus-4-8 only.
//
// ============================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface AnthropicResponse {
  id: string;
  model: string;
  content: ContentBlock[];
  usage?: { input_tokens: number; output_tokens: number };
  stop_reason?: string;
}

export interface MessageParams {
  model: string;
  max_tokens: number;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Structured JSON output. Format: { type: 'json_schema', json_schema: { name, schema } } */
  output_config?: {
    format: {
      type: 'json_schema';
      json_schema: { name: string; schema: Record<string, unknown>; strict?: boolean };
    };
  };
  /** Only for claude-opus-4-8 */
  thinking?: { type: 'adaptive' };
}

/**
 * Call Anthropic /v1/messages and return the parsed response.
 * Throws if the API key is missing or the response is non-2xx.
 */
export async function callAnthropic(params: MessageParams): Promise<AnthropicResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set — use mock path instead');
  }

  const body: Record<string, unknown> = {
    model: params.model,
    max_tokens: params.max_tokens,
    messages: params.messages,
  };
  if (params.system) body.system = params.system;
  if (params.output_config) body.output_config = params.output_config;
  if (params.thinking) body.thinking = params.thinking;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '(no body)');
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<AnthropicResponse>;
}

/** Extract the text content from the first text block of an AnthropicResponse. */
export function extractText(response: AnthropicResponse): string {
  for (const block of response.content) {
    if (block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }
  return '';
}

/** Parse structured JSON output from an AnthropicResponse text block. */
export function extractJSON<T>(response: AnthropicResponse): T {
  const text = extractText(response);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Some models wrap the JSON in markdown fences — strip them.
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim()) as T;
    throw new Error(`Failed to parse JSON from model response: ${text.slice(0, 200)}`);
  }
}

/** Whether a real API key is configured. */
export function hasApiKey(): boolean {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  return Boolean(key && key.trim().length > 0);
}
