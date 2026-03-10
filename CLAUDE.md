# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
It includes both baseline architecture and a detailed memory of recent changes.

## Commands

```bash
bun dev            # start dev server (Vite)
bun run build      # production build
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit (type-errors only)
bun run test       # vitest run (headless)
bun run test:ui    # vitest (interactive)
bun run e2e        # Playwright tests
```

To run a single test file: `bun run test src/path/to/file.test.ts`

**Package manager: Bun** — always use `bun` / `bunx`, never `npm` or `npx`.

Edge functions are Deno-based (in `supabase/functions/`) and deployed via Supabase CLI. They are not built with Vite/Bun.

## Architecture

### Frontend (React 19 + Vite + TypeScript)

- **Router**: `react-router-dom` v6 — routes defined in `src/App.tsx` using lazy imports + `<Suspense>`. All `/app/*` routes are wrapped in `<RequireAuth>`.
- **Auth**: `src/auth/AuthProvider.tsx` exposes `useAuth()` → `{ user, session, loading }`. Backed by Supabase Auth (email/password only — Google OAuth removed). `src/auth/RequireAuth.tsx` redirects unauthenticated users to `/login`.
- **Supabase client**: Import from `@/lib/supabase` or `@/integrations/supabase/client`. Both resolve to the same instance. Env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (also accepted as `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Styling**: Tailwind CSS + shadcn/ui (`src/components/ui/`). Brand colours: Teal (`#0D9488`) primary, Amber accent.

### Key routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/Home.tsx` | Public landing page |
| `/login` | `src/pages/Login.tsx` | Email sign-in + sign-up (name, role, home_name) + forgot password |
| `/app` | `src/pages/Index.tsx` | **Main simulator** — subscription-gated, full session flow |
| `/app/dashboard` | `src/pages/Dashboard.tsx` | Session history + subscription status + checkout sync |
| `/app/report/:sessionId` | `src/pages/app/Report.tsx` | Full inspection report |
| `/app/paywall` | `src/pages/app/Paywall.tsx` | Post-trial paywall → Stripe Checkout |
| `/pricing` | `src/pages/marketing/Pricing.tsx` | £29/month plan |
| `/faq` | `src/pages/marketing/FAQ.tsx` | FAQ + contact form |
| `/contact` | `src/pages/Contact.tsx` | Contact form (standalone) |

### Simulator flow (`src/pages/Index.tsx`)

1. On mount: loads `subscriptions` row + session history to compute trial usage via `computeTrialUsage()` (`src/lib/trial.ts`).
2. `startSession()`: inserts row into `sessions`, picks **6 questions** using mulberry32 seeded RNG (`sessionId` as seed) — `ProtectionChildren` and `LeadershipManagement` are always included (mandatory), plus 4 randomly drawn from the remaining domains.
3. Per question: voice → `transcribe` edge fn (Deepgram) → editable transcript → `evaluate` edge fn (Claude) → saves to `responses` table.
4. After all questions (or early via "Generate Report" after ≥5 answered): calls `generate-report` edge fn → updates `sessions.report_json` → redirects to `/app/report/:sessionId`.
5. Session controls: Pause/Resume overlay, Skip question, Restart, Stop → dashboard.

### Questions (`src/lib/questions.ts`)

9 domains (`DOMAIN_ORDER`), 2 variants each (`questionBank`). `ProtectionChildren` is the LIMITING JUDGEMENT domain. `DOMAIN_LABELS`, `DOMAIN_TAGS`, `getBandColorClass()` are co-located here.

### Supabase Edge Functions (Deno)

All in `supabase/functions/`:
- **`evaluate/`** — calls Claude with SCCIF rubric. Short-answer guard: responses < 20 chars or lacking domain signal words return an immediate Inadequate (1) without calling Claude. Returns `{score (1–4), band, summary, strengths, gaps, developmentPoints, followUpQuestion, inspectorNote, regulatoryReference, encouragement}`. Uses `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` secret.
- **`generate-report/`** — fetches all responses for a session, calls Claude for narrative, updates `sessions.report_json`.
- **`transcribe/`** — Deepgram speech-to-text. Accepts `multipart/form-data` with `file` field.
- **`create-checkout/`** — creates/looks up Stripe customer, returns Checkout URL. Uses `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`.
- **`stripe-webhook/`** — handles `checkout.session.completed` and subscription lifecycle events; now respects trialing status.
- **`sync-subscription/`** — manual Stripe → Supabase sync after checkout success (see Recent Worklog).

### Database schema (MVP tables)

Migration: `supabase/migrations/20260309_inspectready_schema.sql`

- `public.users` — mirrors `auth.users`, stores `name`, `role`, `home_name`
- `public.subscriptions` — `status` (active/trialing/cancelled/past_due), `stripe_subscription_id`; auto-created by trigger on signup
- `public.sessions` — one row per practice session, stores `overall_band`, `overall_score`, `report_json` (jsonb), `started_at`
- `public.responses` — one row per question answered, stores `score`, `band`, `feedback_json`

Triggers auto-create both `users` and `subscriptions` rows on `auth.users` insert.

### Subscription / trial gating

Free trial: **3 days**, **5 sessions/day**, **15 sessions total** (computed in `src/lib/trial.ts`).

```
isPaidSubscriber = stripe_subscription_id present && status in (active | trialing)
canStart = isPaidSubscriber
         || trialInfo not yet computed (first load)
         || (!expired && remainingTotal > 0 && remainingToday > 0)
```

If `!canStart` the simulator redirects to `/app/paywall`.

## Recent Worklog (Detailed)

### 1) Landing page rewrite and Home route
- Created `src/pages/Home.tsx` by copying the marketing landing and switched `/` route to it in `src/App.tsx`.
- Fixed import path in `Home.tsx` to use `./marketing/MarketingLayout`.
- Rewrote landing copy per requirements (AI hidden, broadened market, updated pain points, steps, disclaimer, QS list).
- Removed “9 QS” references, removed “QS7” in pain points, and switched headline to “Residential care leaders deserve inspection confidence.”
- Added explicit trial limits (3 days, 5/day, 15 total) on landing and pricing copy; removed “unlimited during trial” claims.
- Files touched: `src/pages/Home.tsx`, `src/pages/marketing/Landing.tsx`, `src/App.tsx`.

### 2) Marketing layout tagline
- Updated tagline to remove “AI-powered”:
  - `src/pages/marketing/MarketingLayout.tsx`: “Realistic Ofsted inspection practice for registered managers of children’s homes in England.”

### 3) Pricing page fixes and Stripe checkout flow
- Fixed `/pricing` crash caused by missing `busy` state.
- Replaced Stripe **Payment Links** with **Checkout Session** (Supabase edge function `create-checkout`).
- Pricing and paywall now call `supabase/functions/v1/create-checkout` and redirect to `data.url`.
- Both `Pricing.tsx` and `Paywall.tsx` show real error text from edge function failures.
- Updated pricing copy to remove “AI” and state trial limits.
- Files touched: `src/pages/marketing/Pricing.tsx`, `src/pages/app/Paywall.tsx`.

### 4) Trial rules: 3 days, 5/day, 15 total
- Added `src/lib/trial.ts` with:
  - `TRIAL_DAYS = 3`, `TRIAL_DAILY_LIMIT = 5`, `TRIAL_TOTAL_LIMIT = 15`
  - `computeTrialUsage(trialStart, sessions)` returns used/remaining and expiry.
- `Index.tsx` now:
  - Computes trial usage from `subscriptions.created_at` and `sessions`.
  - Allows unlimited access if `stripe_subscription_id` exists and status is `active` or `trialing`.
  - Blocks session start if trial expired or limits reached.
  - Displays remaining trial counts in the UI.
  - Adds a post-session upsell panel if on trial.
- `Dashboard.tsx` now:
  - Computes trial usage similarly.
  - Displays “Trial: X left today” badge and trial status block.
  - Shows trial-limit warning and upgrade CTA when exhausted.
- `Paywall.tsx` and marketing pages updated to explicitly state trial limits and that unlimited is only after subscribing.

### 5) Stripe webhook status correctness
- `supabase/functions/stripe-webhook/index.ts` now retrieves the subscription on `checkout.session.completed` and sets `status` according to Stripe (trialing vs active). `trial_used` is set to `status !== trialing`.

### 6) Stripe test pricing
- Set `STRIPE_PRICE_ID` to test price (latest: `price_1T9QlSK2Jf3A4FB8MJvYTywG`).
- Deployed `create-checkout` function to project `hedxbcpqcgtsqjogedru`.

### 7) Checkout success sync (race condition fix)
Root cause: user returns to app before Stripe webhook updates DB, so `stripe_subscription_id` is still null and trial limits trigger.

Fix:
- Added **new edge function** `supabase/functions/sync-subscription/index.ts`:
  - Authenticated call, looks up `stripe_customer_id`, fetches Stripe subscriptions, updates `stripe_subscription_id` + status in `subscriptions`.
- `Dashboard.tsx` detects `?checkout=success` and:
  - calls `sync-subscription`
  - shows “Confirming your subscription…”
  - reloads subscription data and shows “Subscription confirmed — welcome!”
  - removes the query param from the URL
- Deployed `sync-subscription` to project `hedxbcpqcgtsqjogedru`.

### 7b) Subscription confirmation UX + confetti
- Added a lightweight `ConfettiBurst` component (`src/components/ConfettiBurst.tsx`) and CSS animation in `src/index.css` for a short confetti celebration.
- `Index.tsx` now detects `?checkout=success` and runs the same `sync-subscription` flow as the dashboard. While syncing, it shows “Confirming your subscription…”.
- After a successful sync, the practice screen shows “Subscription confirmed — unlimited access” and the confetti animation.
- Both `Index.tsx` and `Dashboard.tsx` treat `status === "active"` as paid even if `stripe_subscription_id` is missing, preventing paid users from seeing trial limits during sync lag.

### 7c) Simulator UX upgrades (pause, generate anytime, skip-once)
- Added helper `src/lib/simulator.ts` for:
  - generate report + poll (`generateReportAndWait`)
  - pause persistence via `localStorage`
  - progress color mapping
- `Index.tsx` changes:
  - “Generate Report” **FAB** appears after ≥5 answers.
  - Partial report confirmation via `window.confirm` if <6 answered.
  - Pause button top-right shows overlay with Resume + Generate Report.
  - Pause state persists across refresh via localStorage per session.
  - Skip question allowed **once** per session with a replacement question from an unused domain.
  - Progress bar width uses answered count and color by average score.
  - Post-session trial upsell overlay with auto-redirect to report.
- Added `src/pages/Index.test.tsx` for simulator helper behavior (pause persistence + progress color).
### 8) FAQ updates + embedded contact form
- Added more FAQ items; removed AI phrasing.
- Embedded a contact form in FAQ using the same Supabase `send-feedback` flow as the Contact page.
- File: `src/pages/marketing/FAQ.tsx`.

### 9) Database enforcement of trial limits (RLS)
- Added migration `supabase/migrations/20260310_trial_limits.sql`:
  - Replaces insert policy on `public.sessions` with a trial-limit policy.
  - Unlimited sessions if `stripe_subscription_id` exists and status is `active` or `trialing`.
  - Otherwise enforces: 3 days from subscription `created_at`, max 5 sessions/day, max 15 total.
- Migration was pushed to project `hedxbcpqcgtsqjogedru`.

### 10) Migration hygiene + push history
- Duplicate migration versions existed. Renamed `20251216_user_owned_rls.sql` → `20260311_user_owned_rls.sql` to avoid conflicts.
- Made `20260309_inspectready_schema.sql` idempotent by adding `drop policy if exists` before policy creation.
- Successfully ran `supabase db push` for:
  - `20260309_inspectready_schema.sql`
  - `20260310_trial_limits.sql`
  - `20260311_user_owned_rls.sql`

### 11) Lint + build fixes (full audit)
- Lint failures fixed and `eslint` now passes.
- `eslint.config.js`: disabled `react-refresh/only-export-components` warnings.
- `src/ai/evaluateAnswer.ts`: removed `any` usage with typed client wrapper.
- `src/pages/InspectionReport.tsx`: replaced `any` with typed `EvalRow` normalization.
- `src/pages/app/Report.tsx`: removed unused ternary expression statement.
- `src/billing/createCheckoutSession.ts` and `src/billing/stripeWebhook.ts`: removed `@ts-nocheck`, added a typed `Deno` declaration.
- `src/lib/supabase.ts`: added local eslint disable for `no-explicit-any` to keep flexible client.
- `src/pages/Dashboard.tsx`: fixed `useEffect` dependency warning via `useCallback(load)`.

### 12) Tests and builds executed
- `bun run test` → all tests passed.
- `bun run typecheck` → clean.
- `bun run lint` → clean.
- `bun run build` → clean.

### 13) Known open item
- PDF formatting issues reported in exported report. Need the actual PDF file path or upload to analyze and fix layout in:
  - `src/reports/exportReportPdf.ts` (jsPDF export)
  - or `/app/report/:id` print CSS

### 14) PDF export overhaul (jsPDF + autoTable)
- Replaced `src/reports/exportReportPdf.ts` with a new A4 jsPDF 3.x implementation.
- Added optional `jspdf-autotable` usage via a runtime loader; if unavailable, falls back to basic text table rendering (no new deps).
- New PDF structure:
  - Cover page with InspectReady title, home name, date, and overall band color.
  - Executive Summary page (summary narrative, closing verdict, readiness, strengths, actions).
  - Domain Breakdown table with pagination, wrapping, and inspector note truncation to 200 words.
  - Final Action Plan page with numbered items and Next Steps.
- Added `tests/exportReportPdf.test.ts` to verify word truncation logic.
- `/app/report/:id` now uses **Export PDF** button that calls the new exporter (replaces print-only flow).
- Added a small typed jsPDF interface and resolved lint errors in the exporter.

### 15) Dashboard session history overhaul
- Replaced `src/pages/Dashboard.tsx` with a fully rebuilt version.
- Added `src/types/session.ts` — exports `SessionRow` type (includes `responses: Array<{ domain: string }>`).
- **Session query**: 10 most recent sessions (`LIMIT 10`, `ORDER BY started_at DESC`) with nested Supabase select `responses(domain)` to derive domain mix without extra round-trips.
- **Table columns**: Date | Domain Mix | Overall Band | Type | Actions
  - Domain Mix: "Safeguarding + 4 others" — derives first label from ProtectionChildren > LeadershipManagement > first domain.
  - Overall Band: colour badge via `getBandColorClass()` (Outstanding=emerald, Good=teal, RI=amber, Inadequate=red).
  - Session Type: inferred from response count — ≥6 = Full (Clipboard icon), 3–5 = Practice (PlayCircle), 1–2 = Quick (Zap).
  - Actions: "View Report" → `/app/report/:sessionId` | "Restart" → `/app` | "Continue" for in-progress sessions.
- **Row click**: clicking a completed row navigates to `/app/report/:sessionId`.
- **Trial badge**: "Trial: X/5 today | Y/15 total" — teal (plenty) → amber (≤2 remaining) → red (exhausted).
- **Sub status line**: "Active subscription — unlimited access" | "Trial ends [date]" | "Trial ended — upgrade for unlimited access".
- **Empty state**: PlayCircle icon + "Start your first practice → Simulator" CTA button to `/app`.
- **Responsive**: desktop uses `<table>` (`hidden sm:block`); mobile uses stacked cards (`sm:hidden`).
- **Restart button**: navigates to `/app` (Index.tsx does not currently support domain pre-fill via URL params).
- Added `tests/dashboard.test.tsx`: 6 tests covering `computeTrialUsage` (counts, expiry, clamp) and `formatDomainMix` (plurals, empty, Safeguarding label). All passing.
- `bun run typecheck` → clean. No new lint errors introduced.

## Operational Notes

- Supabase project linked: `hedxbcpqcgtsqjogedru` (URL: https://hedxbcpqcgtsqjogedru.supabase.co)
- Stripe pricing in test mode; ensure `STRIPE_SECRET_KEY` matches the test account for the price ID.
- After checkout, use `/app/dashboard?checkout=success` to trigger immediate sync.
