# Spot.it — Supabase backend

## Quick start (local dev)

### Prerequisites
- Docker Desktop running
- `npx supabase` available (wraps the Supabase CLI)

### 1. Init (first time only)
```sh
cd Spot.it
# Only needed if supabase/ was not yet initialised:
npx supabase init
```
`config.toml` is already present — skip init if the file exists.

### 2. Start the local stack
```sh
npx supabase start
```
This starts Postgres, GoTrue (auth), Storage, Realtime, Edge Runtime, and Studio.

Local endpoints:
| Service | URL |
|---------|-----|
| API     | http://127.0.0.1:54321 |
| Studio  | http://127.0.0.1:54323 |
| DB      | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Inbucket (email) | http://127.0.0.1:54324 |

After start, `npx supabase status` prints `anon key` and `service_role key` — copy these.

### 3. Apply migrations + seed
```sh
npx supabase db reset
```
This runs:
1. All `supabase/migrations/*.sql` in order (0001 schema → 0002 RLS → 0003 RPC)
2. `supabase/seed.sql` (demo users, merchant, stores, offers, campaigns, KPIs)

**Re-run is idempotent.** Fixed UUIDs + `ON CONFLICT DO NOTHING` prevent duplicates.

### 4. Serve Edge Functions locally
```sh
npx supabase functions serve
```
Functions are served at `http://127.0.0.1:54321/functions/v1/`.

For live reload during development:
```sh
npx supabase functions serve --no-verify-jwt   # skips gateway JWT check, but functions still call getUser() internally — a valid signed-in user token is still required (see §Invoking below)
```

### 5. Set secrets (for real Anthropic calls)
```sh
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
The function reads `Deno.env.get('ANTHROPIC_API_KEY')`.  
**Without this key the mock path runs automatically** (see below).

---

## Environment variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `SUPABASE_URL` | Auto-injected by Edge Runtime | Supabase project URL |
| `SUPABASE_ANON_KEY` | Auto-injected | Public anon key (user client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Service role (admin client, bypasses RLS) |
| `ANTHROPIC_API_KEY` | `npx supabase secrets set` | Anthropic API — absent = mock mode |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.local` (front) | Same URL, client-side |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` (front) | Anon key, client-side |

---

## Invoking `recommend` (curl example)

**Step 1 — sign in to get a JWT**
```sh
curl -s -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"consumer@demo.spotit","password":"demo1234"}' \
  | jq .access_token
```

**Step 2 — call recommend**
```sh
curl -s -X POST http://127.0.0.1:54321/functions/v1/recommend \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 48.8513,
    "lng": 2.3270,
    "intent": "sneakers",
    "context": { "timeOfDay": "afternoon" }
  }' | jq .
```

**Response shape (RecommendResponse)**:
```json
{
  "ranking": [
    { "offerId": "d0000000-...", "score": 0.7812, "rank": 1 },
    ...
  ],
  "reasons": [
    { "offerId": "d0000000-...", "reasonFr": "Parce que vous aimez la mode" },
    ...
  ],
  "generatedAt": "2026-06-13T14:00:00.000Z",
  "model": { "decision": "claude-haiku-4-5", "generation": "claude-sonnet-4-6" },
  "mocked": true
}
```
`mocked: true` when no API key is configured.

**Invoking `profil`**:
```sh
curl -s -X POST http://127.0.0.1:54321/functions/v1/profil \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

---

## Mock-without-keys behavior

When `ANTHROPIC_API_KEY` is absent (or empty):

1. `recommend` skips both Anthropic agents entirely.
2. Ranking is computed **locally** using the same logistic score as `src/learning/features.ts`:  
   `p = σ(bias + Σ w_i·x_i)` over the consumer's stored taste.
3. Reasons are generated via `reasonFor()` (deterministic argmax over active features).
4. The response is identical in shape to the live response, with `mocked: true`.
5. `recommendations_log.model` is written as `"mock"`.

The `profil` function **always** runs deterministically (SGD replay from swipe_events) regardless of key availability. The LLM path for intent extraction is a clearly-marked TODO stub.

---

## Seed — demo accounts

| Role | Email | Password | UUID |
|------|-------|----------|------|
| Consumer | consumer@demo.spotit | demo1234 | `a0000000-0000-0000-0000-000000000002` |
| Merchant (user) | merchant@demo.spotit | demo1234 | `a0000000-0000-0000-0000-000000000001` |
| Merchant (entity) | — | — | `b0000000-0000-0000-0000-000000000001` |

The consumer's taste is pre-seeded with a mode/streetwear bias so the demo deck is non-cold and the bandit converges visibly in ~5 swipes.

**12 offers seeded** (exact mirror of `src/data/offers.seed.ts`):  
sandro, sephora, mdm, frankie, boulanger, lbm, aesop, axel, veja, nike-rivoli, newbalance, carhartt  
Each has a fixed UUID starting with `d0000000-0000-0000-0000-0000000000xx`.

---

## Known caveats

### auth.users seeding
- Rows are inserted directly into `auth.users` with `crypt('demo1234', gen_salt('bf'))`.  
- `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new` are set to `''` (empty string), NOT NULL — GoTrue panics at sign-in if these columns are NULL.
- `auth.identities` rows are inserted (provider='email') — required by GoTrue ≥ 2.x for email/password auth.
- If sign-in still fails after `db reset`, delete the users from Studio > Authentication > Users and re-create them via the UI or `supabase auth` CLI. The app only needs the UUIDs to match.

### JWT custom_access_token_hook
- `public.custom_access_token_hook` is defined in `0002_rls.sql` but **not wired** by default.
- To enable it locally, uncomment the `[auth.hook.custom_access_token]` section in `config.toml`.
- **The demo works without it** because RLS policies check `m.user_id = auth.uid()` subqueries, not the JWT `app_metadata.role` claim.
- Enable the hook for production to get the `role` claim in JWTs.

### Geo radii
- `DEMO_USER` (48.8513, 2.3270 — Sèvres-Babylone) is only within 400m of ~2 seeded stores.
- `recommend` automatically widens the radius (400 → 1000 → 2000 → 5000m) until ≥1 offer is found, then falls back to all active offers.
- The seed `distanceM` values in the TS seed are display fakes; real distances are computed by PostGIS `ST_Distance` in `nearby_stores`.
