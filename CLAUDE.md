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
- **`evaluate/`** — calls Claude with SCCIF rubric. Short-answer guard: responses < 20 chars or lacking domain signal words return immediate Inadequate (1) without calling Claude. Returns `{score (1–4), band, summary, strengths, gaps, developmentPoints, followUpQuestion, inspectorNote, regulatoryReference, encouragement}`. Uses `ANTHROPIC_API_KEY` secret. **Rate limit: 100 requests/min/IP** (in-memory, code-based).
- **`generate-report/`** — fetches all responses for a session, calls Claude for narrative, updates `sessions.report_json`. **Rate limit: 100 requests/min/IP** (in-memory, code-based).
- **`transcribe/`** — Deepgram speech-to-text. Accepts `multipart/form-data` with `file` field. **Rate limit: 50 requests/min/IP** (in-memory, code-based).

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

- **Supabase project:** `hedxbcpqcgtsqjogedru` (https://hedxbcpqcgtsqjogedru.supabase.co)
- **Stripe:** LIVE mode — accepting real payments

### Rate Limiting (NEW — v1.1)
Code-based, in-memory rate limiting on 3 core edge functions:
- `evaluate`: 100 req/min/IP (Claude API protection)
- `generate-report`: 100 req/min/IP (Claude API protection)
- `transcribe`: 50 req/min/IP (Deepgram API protection)

Implementation: `supabase/functions/_shared/rate-limiter.ts` — extracts IP (Cloudflare → x-forwarded-for → x-real-ip), returns 429 + `retryAfter` on limit.

### Config & Environment
- Post-checkout sync: `/app/dashboard?checkout=success` triggers `sync-subscription`
- `VITE_POSTHOG_KEY` — analytics (EU cloud, GDPR compliant)
- `VITE_GEMINI_KEY` — Gemini gap analysis on /tools (static fallback if missing)
- ESLint: `react-refresh/only-export-components` disabled in config
- Supabase client: `no-explicit-any` disable for flexible casting

### Legacy Code
Unlinked but present: `Account.tsx`, `Sessions.tsx`, `History.tsx`, `Onboarding.tsx`, `Admin.tsx`, `InspectionReport.tsx`

## Latest Updates (v1.1 — March 11, 2026)

### 🛡️ New Branding (Shield + Checkmark Icon)
- Updated favicon.svg, logo.svg, and 9 inline SVG instances across app
- Teal (#0D9488) shield with white checkmark — represents safeguarding (QS7) + quality standards
- Applied to: AppNav, Paywall, MarketingLayout, Index, Login, ResetPassword, Report pages
- PWA manifest theme color updated to teal

### 🔒 Rate Limiting Protection (NEW)
- Code-based rate limiting on `evaluate`, `generate-report`, `transcribe` edge functions
- Shared implementation: `supabase/functions/_shared/rate-limiter.ts`
- Protects Claude API quota (100 req/min each) and Deepgram quota (50 req/min)
- IP extraction: Cloudflare → x-forwarded-for → x-real-ip fallback
- Returns 429 Too Many Requests + `retryAfter` when exceeded

### 🐛 Bug Fix
- Fixed React hooks conditional execution in `Admin.tsx` (moved all hooks before early return)

### ✅ Quality Checks
- ESLint: PASSING
- TypeScript type check: PASSING
- Production build: PASSING (chunk size warnings only, expected for jsPDF libraries)

## Branding & Design

### Brand Colors
- **Primary:** Teal `#0D9488` — main brand color, buttons, active states
- **Accent:** Amber — trial/warning states
- **Neutral:** Slate (50, 100, 200, 600, 900) — backgrounds, text, borders
- **Status:** Red (50, 700) — errors, inadequate grades, overdue; Green (teal-600) — success, checkmarks

### Icon Assets (Shield + Checkmark)
**Location:** `public/`
- `favicon.svg` — 64x64, browser tab icon (SVG, scalable)
- `favicon.ico` — 64x64, legacy favicon fallback
- `logo.svg` — 256x256, app header & branding (SVG, scalable)

**Design:** Minimalist shield with teal checkmark inside, representing safeguarding (QS7) + quality standards approval. Used across all pages.

### Icon Usage in Code (Inline SVGs)
Inline shield+checkmark SVG appears in:
- `src/components/AppNav.tsx` — app header (8x8px)
- `src/pages/app/Paywall.tsx` — trial paywall header
- `src/pages/marketing/MarketingLayout.tsx` — public site header (3 instances: desktop nav, mobile menu, footer)
- `src/pages/Index.tsx` — practice page hero
- `src/pages/Login.tsx` — login page (2 instances: left hero panel, top nav)
- `src/pages/ResetPassword.tsx` — password reset page
- `src/pages/app/Report.tsx` — report page header (2 instances: screen nav, print-only header)

All inline icons use: `<path d="M16 2C16 2 6 8 6 14C6 19 16 26 16 26C16 26 26 19 26 14C26 8 16 2 16 2Z" fill="[white|#0D9488]"/>`
with embedded checkmark: `<g stroke="[white|#0D9488]" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 16L13.5 19L20 11"/></g>`

### Favicon & PWA
- `index.html` — links favicon.svg as primary icon
- `manifest.json` — PWA theme color set to `#0D9488` (teal)
- Browser favicon resolves via: favicon.svg (primary) → favicon.ico (fallback)
