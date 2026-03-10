# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # start dev server (Vite)
bun run build    # production build
bun run lint     # ESLint
bun run typecheck  # tsc --noEmit (no emit, type-errors only)
bun run test     # vitest run (headless)
bun run test:ui  # vitest (interactive)
bun run e2e      # Playwright tests
```

**Package manager: Bun** — always use `bun` / `bunx`, never `npm` or `npx`.

Edge functions are Deno-based (in `supabase/functions/`) and deployed via Supabase CLI. They are not built with Vite/Bun.

## Architecture

### Frontend (React 19 + Vite + TypeScript)

- **Router**: `react-router-dom` v6 — routes defined in `src/App.tsx` using lazy imports + `<Suspense>`. All `/app/*` routes are wrapped in `<RequireAuth>`.
- **Auth**: `src/auth/AuthProvider.tsx` exposes `useAuth()` → `{ user, session, loading }`. Backed by Supabase Auth (email/password only). `src/auth/RequireAuth.tsx` redirects unauthenticated users to `/login`.
- **Supabase client**: Import from `@/lib/supabase` (preferred for tables not in generated types) or `@/integrations/supabase/client` (generated typed client). Both resolve to the same instance. Env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Styling**: Tailwind CSS + shadcn/ui (`src/components/ui/`). Brand colours: Teal (`#0D9488`) primary, Amber accent.

### Key pages

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/marketing/Landing.tsx` | Public landing page |
| `/login` | `src/pages/Login.tsx` | Email sign-in + sign-up (name, role, home_name fields) |
| `/app` | `src/pages/Index.tsx` | **Main simulator** — subscription-gated, full session flow |
| `/app/dashboard` | `src/pages/Dashboard.tsx` | Session history + subscription status |
| `/app/report/:sessionId` | `src/pages/app/Report.tsx` | Full inspection report with print button |
| `/app/paywall` | `src/pages/app/Paywall.tsx` | Post-trial paywall → Stripe Checkout |
| `/pricing` | `src/pages/marketing/Pricing.tsx` | £29/month plan + Stripe Checkout |

### Simulator flow (`src/pages/Index.tsx`)

1. On mount: checks `subscriptions` table (`status`, `trial_used`) to set `canStart`.
2. `startSession()`: inserts row into `sessions`, picks 1 question per domain using mulberry32 seeded RNG (`sessionId` as seed).
3. Per question: voice → `transcribe` edge fn (Deepgram) → editable transcript → `evaluate` edge fn (Claude) → saves to `responses` table.
4. After all 9 questions: calls `generate-report` edge fn → updates `sessions.report_json` → redirects to `/app/report/:sessionId`.

### Questions (`src/lib/questions.ts`)

9 domains (`DOMAIN_ORDER`), 2 variants each (`questionBank`). `ProtectionChildren` is the LIMITING JUDGEMENT domain — an Inadequate score there caps the overall grade. `DOMAIN_LABELS`, `DOMAIN_TAGS`, `getBandColorClass()` are co-located here.

### Supabase Edge Functions (Deno)

All in `supabase/functions/`:
- **`evaluate/`** — calls Claude (`claude-haiku-4-5-20251001`) with SCCIF rubric, returns `{score, band, summary, strengths, gaps, followUpQuestion, inspectorNote}`. Uses `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` secret.
- **`generate-report/`** — fetches all responses for a session, calls Claude for narrative, updates `sessions.report_json`.
- **`transcribe/`** — Deepgram speech-to-text. Accepts `multipart/form-data` with `audio` field.
- **`create-checkout/`** — creates/looks up Stripe customer, returns Checkout URL. Uses `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`.
- **`stripe-webhook/`** — handles `checkout.session.completed`, subscription lifecycle events, and sets `trial_used=true`.

### Database schema (MVP tables)

Migration: `supabase/migrations/20260309_inspectready_schema.sql`

- `public.users` — mirrors `auth.users`, stores `name`, `role`, `home_name`
- `public.subscriptions` — `status` (active/trialing/cancelled/past_due), `trial_used` bool; auto-created by trigger on signup
- `public.sessions` — one row per practice session, stores `overall_band`, `overall_score`, `report_json` (jsonb)
- `public.responses` — one row per question answered, stores `score`, `band`, `feedback_json`

Triggers auto-create both `users` and `subscriptions` rows on `auth.users` insert.

### Subscription gating

`canStart = status==="active" || (status==="trialing" && !trial_used) || no row yet`

If `!canStart` the simulator shows a paywall prompt. After a trial session completes, the stripe-webhook sets `trial_used=true`.
