# Backend architecture (brief for implementers)

Source of truth for response shapes: `docs/api.md`. Do NOT change it. If something there cannot be honoured, stop and report.

Stack facts (verified against current docs):
- Next.js 16.4, App Router, `cacheComponents: true`. Middleware is now **`proxy.ts`** (export `proxy`). `params` is a Promise. Any component that reads `cookies()`/`headers()` must sit under a `<Suspense>` boundary (a `loading.tsx` counts).
- Read `node_modules/next/dist/docs/` before writing Next-specific code (see AGENTS.md).
- Supabase via `@supabase/ssr` + `@supabase/supabase-js`. Cookie adapter uses `getAll`/`setAll`. Use `supabase.auth.getClaims()` (or `getUser()`) for server-side auth checks, never `getSession()`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. **No service-role key is used anywhere.**

## Key design decisions

1. **One service layer, two callers.** Pages are server components; a relative `fetch("/api/...")` from the server would fail and drop cookies. So:
   - `lib/server/*` holds the domain logic (server-only). Route handlers in `app/api/**` are thin: parse → call service → map result to HTTP.
   - `lib/api.ts` stays the single data layer the pages import and must remain **client-safe** (ProfileForm, a client component, imports `saveProfile`). Its three read functions delegate to a `"use server"` module (`lib/server/queries.ts`) that calls the same service layer. `saveProfile` uses `fetch` to `POST /api/profile` / `PUT /api/profile/[id]`.
2. **RLS is the real security boundary.** Every owner query uses the user's cookie session with the publishable key, so Postgres RLS enforces "only my rows". The proxy redirect is UX, not security.
3. **Public lookup without a service key.** `get_public_profile(p_token text)` is a `SECURITY DEFINER` SQL function (fixed `search_path`) that: finds the profile by token, inserts a `scan_logs` row, and returns a jsonb with ONLY public fields (full_name, age, blood_group, contacts always; allergies/conditions/medicines/doctor_name only when flagged). It never returns id, owner_id, email, public_token. TS side additionally whitelists keys (`toPublicView`) as defence in depth.
4. **Atomic writes.** `create_profile(payload jsonb)` and `update_profile(p_id uuid, payload jsonb)` are `SECURITY INVOKER` SQL functions (RLS still applies) that write profile + contacts in one transaction. The `public_token` is generated in TS with `crypto.randomBytes(24).toString("base64url")` (32 chars) and passed in; DB has `unique` + `check (length(public_token) >= 22)`.
5. **Rate limiting in Postgres** (works across Vercel serverless instances): table `rate_limits(key text pk, window_start timestamptz, count int)`, RLS on with no policies, plus `SECURITY DEFINER` function `hit_rate_limit(p_key text, p_limit int, p_window_seconds int) returns boolean` (true = allowed). Key = `public:<client ip>` from `x-forwarded-for`. Default 20 requests / 60 s. Over limit → 429 `{ "error": "Too many requests" }`. Check the limit BEFORE the lookup so blocked requests do not log scans.
6. **Telegram alert is fire-and-forget** via `after()` from `next/server` so the emergency page is never slowed or broken by Telegram. Message: `Profile <full_name> was scanned at <h:mm AM/PM>` (Asia/Kolkata). If env vars are missing, skip silently.
7. **QR / PDF are generated in-process**: `qrcode` (PNG buffer) and `pdf-lib` (428×270 pt card mirroring `app/card/[id]/page.tsx`, QR embedded). Both 🔒 and owner-scoped through RLS. QR target: `${NEXT_PUBLIC_SITE_URL || request origin}/e/<public_token>`.

## Database (task 1)
`profiles(id uuid pk default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users on delete cascade, public_token text unique not null, full_name text not null, age int not null check 0..120, blood_group text not null check in 8 groups, allergies text[] not null default '{}', conditions text[] ..., medicines text[] ..., doctor_name text not null default '', public jsonb not null default '{"allergies":false,"conditions":false,"medicines":false,"doctor_name":false}', created_at timestamptz default now())`
`contacts(id uuid pk, profile_id uuid not null references profiles on delete cascade, name, phone, relation, position smallint)` — max 3 per profile enforced in validation and in the save functions.
`scan_logs(id bigint identity pk, profile_id uuid references profiles on delete cascade, scanned_at timestamptz default now())`
RLS: profiles — select/insert/update/delete where `owner_id = (select auth.uid())` (to authenticated). contacts — via `exists` on parent profile owned by user. scan_logs — owner can select; no insert policy (only the definer function inserts). Index FKs. Revoke function execute from `public`, grant to `anon, authenticated` as appropriate.

## Module map
```
supabase/migrations/0001_init.sql
proxy.ts                         refresh session; redirect logged-out users from /dashboard,/profile/*,/qr/*,/card/* to /login
lib/supabase/client.ts           createBrowserClient
lib/supabase/server.ts           createServerClient (cookies)
lib/validation.ts                validateProfileInput(unknown) -> {ok:true,value}|{ok:false,error}   (pure, unit tested)
lib/public-view.ts               toPublicView(raw) whitelist; publicToProfile(view) adapter for the page (pure, tested)
lib/token.ts                     generatePublicToken()                                         (tested)
lib/telegram.ts                  formatScanMessage(name, date); sendScanAlert()                (tested)
lib/http.ts                      jsonError(message, status) helper
lib/server/profiles.ts           list/get/create/update/getPublic (takes a supabase client)    (tested with fakes)
lib/server/queries.ts            "use server" wrappers used by lib/api.ts
app/api/profile/route.ts         GET list, POST create
app/api/profile/[id]/route.ts    GET one, PUT update
app/api/public/[token]/route.ts  GET public (rate limit -> rpc -> after(telegram))
app/api/qr/[id]/route.ts         PNG
app/api/card/[id]/route.ts       PDF
app/auth/signout/route.ts        POST sign out -> redirect /login
```

## Frontend adapters (keep UI unchanged except where noted)
- `getPublicProfile` must return the existing `Profile` type the page expects: missing private arrays become `[]`, `doctor_name` `""`, and `public` flags are derived from which keys are present.
- Not-found ids/tokens → `null` (pages already render "Profile not found"). Invalid uuid → treat as not found, not 500.
- Dashboard "Log out" link becomes a small form that POSTs to `/auth/signout`.
- Signup: if Supabase returns no session (email confirmation on), show "Check your email to confirm" instead of redirecting.

## Testing
Vitest. TDD (red → green → refactor) for every pure module and for route handlers with a faked supabase client. `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` must all pass at the end of each batch.
