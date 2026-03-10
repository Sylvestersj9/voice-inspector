# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Auth**: `src/auth/AuthProvider.tsx` exposes `useAuth()` → `{ user, session, loading }`. Backed by Supabase Auth (email/password only). `src/auth/RequireAuth.tsx` redirects unauthenticated users to `/login`.
- **Supabase client**: Import from `@/lib/supabase` or `@/integrations/supabase/client`. Both resolve to the same instance. Env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (also accepted as `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Styling**: Tailwind CSS + shadcn/ui (`src/components/ui/`). Brand colours: Teal (`#0D9488`) primary, Amber accent.

### Key routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/Home.tsx` | Public landing page |
| `/login` | `src/pages/Login.tsx` | Email sign-in + sign-up (name, role, home_name) + forgot password |
| `/tools` | `src/pages/marketing/Tools.tsx` | 4 free client-side tools (no login) |
| `/about` | `src/pages/About.tsx` | About page |
| `/blog` | `src/pages/Blog.tsx` | Blog listing |
| `/blog/:slug` | `src/pages/BlogPost.tsx` | Individual blog post |
| `/pricing` | `src/pages/marketing/Pricing.tsx` | £29/month plan |
| `/faq` | `src/pages/marketing/FAQ.tsx` | FAQ + embedded contact form |
| `/contact` | `src/pages/Contact.tsx` | Contact form |
| `/terms` | `src/pages/legal/Terms.tsx` | Terms of service |
| `/privacy` | `src/pages/legal/Privacy.tsx` | Privacy policy |
| `/disclaimer` | `src/pages/legal/Disclaimer.tsx` | Disclaimer |
| `/acceptable-use` | `src/pages/legal/AcceptableUse.tsx` | Acceptable use policy |
| `/app` | `src/pages/Index.tsx` | **Main simulator** — subscription-gated, full session flow |
| `/app/dashboard` | `src/pages/Dashboard.tsx` | Session history + subscription status + checkout sync |
| `/app/report/:sessionId` | `src/pages/app/Report.tsx` | Full inspection report + PDF export |
| `/app/paywall` | `src/pages/app/Paywall.tsx` | Post-trial paywall → Stripe Checkout |
| `/app/profile` | `src/pages/app/Profile.tsx` | User profile management |

### Simulator flow (`src/pages/Index.tsx`)

1. On mount: loads `subscriptions` row + session history to compute trial usage via `computeTrialUsage()` (`src/lib/trial.ts`).
2. `startSession()`: inserts row into `sessions`, picks questions using mulberry32 seeded RNG (`sessionId` as seed) — `ProtectionChildren` and `LeadershipManagement` are always included (mandatory), remaining domains randomly drawn.
3. Per question: voice → `transcribe` edge fn (Deepgram) → editable transcript → `evaluate` edge fn (Claude) → saves to `responses` table.
4. After ≥3 questions answered: "Generate Report" FAB becomes available. Calls `generate-report` edge fn → updates `sessions.report_json` → redirects to `/app/report/:sessionId`.
5. Session controls: Pause/Resume overlay (persisted in localStorage per session), Skip question (once per session), Restart, Stop → dashboard.
6. Detects `?checkout=success` and calls `sync-subscription` edge fn to resolve post-checkout race condition.

Helper utilities: `src/lib/simulator.ts` (report generation + polling, pause persistence, progress color mapping).

### Questions (`src/lib/questions.ts`)

9 domains (`DOMAIN_ORDER`), 2 variants each (`questionBank`, 18 total). `ProtectionChildren` is the LIMITING JUDGEMENT domain. `DOMAIN_LABELS`, `DOMAIN_TAGS`, `getBandColorClass()` are co-located here.

### Analytics (`src/lib/analytics.ts`)

PostHog integration — GDPR-compliant, EU cloud (`eu.i.posthog.com`). Lazy init: only activates after user accepts cookie consent banner (`src/components/CookieConsent.tsx`). No-ops if `VITE_POSTHOG_KEY` is absent.

**Events tracked:** `signup`, `session_start`, `session_complete`, `report_generated`, `checkout_started`, `subscription_confirmed`, `$pageview`.

### Blog system

- **Authored posts** (6): `src/content/blog/` — local MDX/TSX files covering SCCIF topics
- **Blog registry**: `src/lib/blogPosts.ts` — maps slugs to metadata + RSS feed items
- **Auto-pilot** (weekly cron): `blog-autopilot` edge fn fetches GOV.UK/Ofsted RSS, summarises with Claude Haiku, upserts to `blog_posts` table
- Posts render at `/blog/:slug` via `src/pages/BlogPost.tsx`

### Supabase Edge Functions (Deno) — `supabase/functions/`

**Core:**
- **`evaluate/`** — calls Claude with SCCIF rubric. Short-answer guard: responses < 20 chars or lacking domain signal words return immediate Inadequate (1) without calling Claude. Returns `{score (1–4), band, summary, strengths, gaps, developmentPoints, followUpQuestion, inspectorNote, regulatoryReference, encouragement}`. Uses `ANTHROPIC_API_KEY` secret.
- **`generate-report/`** — fetches all responses for a session, calls Claude for narrative, updates `sessions.report_json`.
- **`transcribe/`** — Deepgram speech-to-text. Accepts `multipart/form-data` with `file` field.

**Billing:**
- **`create-checkout/`** — creates/looks up Stripe customer, returns Checkout URL. Uses `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`.
- **`stripe-webhook/`** — handles `checkout.session.completed` and subscription lifecycle events.
- **`sync-subscription/`** — authenticated manual Stripe → Supabase sync (post-checkout race condition fix).
- **`billing-portal/`** — returns Stripe customer portal URL for subscription management.

**Email (Resend):**
- **`welcome-email/`** — triggered by pg_net on signup; sends onboarding email via Resend.
- **`trial-warning/`** — cron job; emails users when 5/6 trial sessions used.
- **`send-feedback/`** — handles feedback form submissions.

**Blog automation:**
- **`blog-autopilot/`** — Sunday 02:00 UTC cron; fetches GOV.UK/Ofsted RSS, Claude Haiku summarises, upserts to `blog_posts`.
- **`blog-sync/`** — manual trigger for blog sync.

**Search:**
- **`embed-document/`** — generates vector embeddings for documents.
- **`search-chunks/`** — semantic search over embedded content.

### Database schema (MVP tables)

Migrations in `supabase/migrations/`:
- `20260309_mockofsted_schema.sql` — primary MVP schema
- `20260310_trial_limits.sql` — trial RLS enforcement
- `20260311_user_owned_rls.sql` — user-owned session RLS
- `20260312_blog_autopilot.sql` — blog_posts table
- `20260313_trial_2sessions_per_day.sql` — updated trial limits (2/day, 6 total)
- `20260314_welcome_email_trigger.sql` — signup email trigger

**Tables:**
- `public.users` — mirrors `auth.users`, stores `name`, `role`, `home_name`
- `public.subscriptions` — `status` (active/trialing/cancelled/past_due), `stripe_customer_id`, `stripe_subscription_id`; auto-created by trigger on signup
- `public.sessions` — one row per practice session, stores `overall_band`, `overall_score`, `report_json` (jsonb), `started_at`, `completed_at`
- `public.responses` — one row per question answered, stores `score`, `band`, `feedback_json`
- `public.blog_posts` — `slug`, `title`, `source_url`, `summary`, `tags`, `published_at`; upserted by blog-autopilot

Triggers auto-create both `users` and `subscriptions` rows on `auth.users` insert. RLS enforces trial limits in the DB as a second layer after frontend checks.

### Subscription / trial gating

Free trial: **3 days**, **2 sessions/day**, **6 sessions total** (computed in `src/lib/trial.ts`).

```
isPaidSubscriber = stripe_subscription_id present && status in (active | trialing)
canStart = isPaidSubscriber
         || trialInfo not yet computed (first load)
         || (!expired && remainingTotal > 0 && remainingToday > 0)
```

If `!canStart` the simulator redirects to `/app/paywall`. Dashboard detects `?checkout=success` and runs the same sync flow. `ConfettiBurst` component (`src/components/ConfettiBurst.tsx`) shown after successful subscription confirmation.

### PDF export

- **Report PDF**: `src/reports/exportReportPdf.ts` — jsPDF 3.x, optional `jspdf-autotable`. Structure: cover page → executive summary → domain breakdown table → action plan.
- **Tools PDFs**: `src/lib/quizScoring.ts` — `exportQuizPdf()`, `exportCalendarPdf()`, `exportAuditPdf()` (all pure jsPDF 3.x).

### Tools page (`/tools`) — fully public, client-side, no login

Four interactive tools at `src/pages/marketing/Tools.tsx`, hash-navigable (`#quiz`, `#mock`, `#calendar`, `#checklist`):
1. **QS Readiness Quiz** — 9-domain checkbox grid, localStorage persistence, Gemini gap analysis via `src/lib/geminiPrompt.ts` (`VITE_GEMINI_KEY`, falls back to static if absent).
2. **Mock Inspector Demo** — 3 fixed SCCIF questions, heuristic feedback by word count, no API calls.
3. **12-Week Prep Calendar** — date-picker, rotation table, PDF export.
4. **SCCIF Audit Checklist** — 44 evidence items across all 9 QS, live score bar, PDF + print.

Static file: `public/tools/question-bank.csv` (18 rows, 2 questions per domain).

### Types

- `src/types/session.ts` — `SessionRow` type (includes `responses: Array<{ domain: string }>`)

## Operational Notes

- Supabase project: `hedxbcpqcgtsqjogedru` (https://hedxbcpqcgtsqjogedru.supabase.co)
- **Stripe currently in TEST mode** — switch keys and `STRIPE_PRICE_ID` to live before real launch.
- After checkout, `/app/dashboard?checkout=success` triggers immediate subscription sync.
- `eslint.config.js` disables `react-refresh/only-export-components` warnings.
- `@/lib/supabase` uses `no-explicit-any` eslint disable to keep flexible client casting.
- `VITE_POSTHOG_KEY` env var required for analytics; silently no-ops if missing.
- `VITE_GEMINI_KEY` env var for Gemini gap analysis on /tools; falls back to static content if missing.
- Legacy pages still exist in codebase but are not linked: `Account.tsx`, `Sessions.tsx`, `History.tsx`, `Onboarding.tsx`, `Admin.tsx`, `InspectionReport.tsx`.
