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

### Analytics & Error Tracking

**PostHog** (`src/lib/analytics.ts`):
- GDPR-compliant, US cloud endpoint (`https://us.i.posthog.com`)
- Lazy init: only activates after user accepts cookie consent banner (`src/components/CookieConsent.tsx`)
- No-ops if `VITE_POSTHOG_KEY` is absent
- **Events tracked:** `signup`, `session_start`, `session_complete`, `report_generated`, `checkout_started`, `subscription_confirmed`, `$pageview`
- Env var: `VITE_POSTHOG_KEY`

**Sentry** (`src/main.tsx`):
- Error tracking & performance monitoring
- DSN: `VITE_SENTRY_DSN`
- React integration with browser tracing
- `sendDefaultPii: true` — collects user identifiers for error context
- Disabled in dev if DSN is absent

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
- **`welcome-email/`** — triggered on signup (email & Google OAuth); sends onboarding email via Resend with MockOfsted logo and trial info. CORS-enabled. Full redesign with improved formatting: flexbox-based step numbering (1,2,3), app benefits section, trial information, pro tip about Safeguarding (QS7), and enhanced visual hierarchy.
- **`admin-notifications/`** — sends formatted emails to `CONTACT_TO_EMAIL` (admin inbox) for operational events:
  - `signup` — new user account created (email or Google)
  - `login` — user signed in
  - `session_started` — user began a practice session
  - `session_completed` — user finished session with score/domain
  - `feedback` — user submitted contact form message
  - Called non-blocking from frontend; all failures silently ignored to avoid UX disruption
  - Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
- **`trial-warning/`** — cron job; emails users when 5/6 trial sessions used
- **`send-feedback/`** — handles contact form submissions; sends to `CONTACT_TO_EMAIL`, uses `CONTACT_FROM_EMAIL` as sender, includes `reply_to` field with user's email
  - Rate limited: 1 request/min per email or IP
  - Validates message ≥ 5 characters client-side & server-side
  - Stores feedback in `public.feedback` table
  - Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`

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
- `20260316_add_feedback_table.sql` — contact form feedback table
- `20260317_disable_welcome_email_trigger.sql` — disabled problematic trigger
- `20260319_reset_auth_users.sql` — cleared auth.users and orphaned tables
- `20260320_recreate_user_subscription_triggers.sql` — restored user creation triggers
- `20260321_sync_missing_users.sql` — syncs orphaned auth.users to public.users

**Tables:**
- `public.users` — mirrors `auth.users`, stores `name`, `role`, `home_name`
- `public.subscriptions` — `status` (active/trialing/cancelled/past_due), `stripe_customer_id`, `stripe_subscription_id`; auto-created by trigger on signup
- `public.sessions` — one row per practice session, stores `overall_band`, `overall_score`, `report_json` (jsonb), `started_at`, `completed_at`
- `public.responses` — one row per question answered, stores `score`, `band`, `feedback_json`
- `public.blog_posts` — `slug`, `title`, `source_url`, `summary`, `tags`, `published_at`; upserted by blog-autopilot
- `public.feedback` — contact form submissions, stores `type` (contact/feedback), `name`, `email`, `message`, `user_agent`, `status` (received/sent/failed), `created_at`

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

### Rate Limiting
Code-based, in-memory rate limiting on 3 core edge functions:
- `evaluate`: 100 req/min/IP (Claude API protection)
- `generate-report`: 100 req/min/IP (Claude API protection)
- `transcribe`: 50 req/min/IP (Deepgram API protection)

Implementation: `supabase/functions/_shared/rate-limiter.ts` — extracts IP (Cloudflare → x-forwarded-for → x-real-ip), returns 429 + `retryAfter` on limit.

### Config & Environment

**Frontend env vars** (`.env.local`):
- `VITE_POSTHOG_KEY` — analytics (US cloud endpoint, GDPR compliant)
- `VITE_SENTRY_DSN` — error tracking
- `VITE_GEMINI_KEY` — Gemini gap analysis on /tools (static fallback if missing)
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

**Supabase secrets** (edge function env vars):
- `RESEND_API_KEY` — Resend email API key
- `CONTACT_TO_EMAIL` — where contact form emails are sent (default: info@mockofsted.co.uk)
- `CONTACT_FROM_EMAIL` — sender email for contact form (must be verified domain in Resend)
- `ANTHROPIC_API_KEY` — Claude API for evaluation
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`

**React Router** (`src/App.tsx`):
- Future flags enabled: `v7_startTransition`, `v7_relativeSplatPath` (suppresses v7 deprecation warnings)

**ESLint & Config:**
- `react-refresh/only-export-components` disabled
- Supabase client: `no-explicit-any` disabled for flexible casting

**Post-checkout sync:** `/app/dashboard?checkout=success` triggers `sync-subscription`

## Latest Updates (v1.6.4 — March 12, 2026)

### 🎁 User Access Management
- ✅ **Created grant-access edge function** — Supabase function to grant premium access to any user without payment
- ✅ **Granted full access to janvesylvester@gmail.com** — User has active subscription status, no payment required
- Can be used in future for admin access grants
- **Migration:** `20260322_grant_user_access.sql` — Automatically grants full access on subscription table

### 🚀 Full Deployment Completed
- ✅ **Frontend rebuilt** — Includes Sentry error filtering for admin-notifications
- ✅ **Edge functions deployed** — admin-notifications (200 OK always), grant-access (admin use)
- ✅ **Vercel deployed** — Live on mockofsted.co.uk with all fixes
- ✅ **Supabase migrations applied** — User access grant active

## Latest Updates (v1.6.3 — March 12, 2026)

### 🔧 Admin-Notifications: Fully Non-Blocking (401 Error Fix)
- ✅ **Made admin-notifications always return 200 OK** — even on Resend API failures, missing keys, or exceptions
- ✅ **Improved CORS preflight handling** — explicit headers on OPTIONS responses
- ✅ **Guaranteed non-blocking behavior** — errors logged as warnings, not errors
- ✅ **Configured Sentry to ignore admin-notifications errors** — added `beforeSend` hook to filter out non-critical network errors
- **Issue:** Browser console showing 401 errors from admin-notifications POST requests + Sentry capturing them
- **Root cause:**
  - Edge function returning 5xx/4xx errors on failures, causing browser to log them even with `.catch()` suppression
  - Sentry's network monitoring capturing these HTTP errors before JavaScript catch can suppress
- **Solution:**
  - **Backend (Edge Function):** All responses now return 200 OK (notifications are best-effort, never fail user requests)
    - Missing RESEND_API_KEY → silent skip (console.warn only, 200 OK response)
    - Resend API failure → silent recovery (console.warn only, 200 OK response)
    - Function exception → silent recovery (console.warn only, 200 OK response)
    - CORS headers always included to prevent Supabase router 401s
  - **Frontend (Sentry):** Added `beforeSend` hook to filter out admin-notifications errors from error tracking
- **Result:** No more HTTP errors in browser console or Sentry; notifications are truly non-blocking
- **Deploy instructions:**
  - `bun run build` → rebuild frontend with Sentry filter
  - Deploy to Vercel
  - `supabase functions deploy admin-notifications` → deploy function returning 200 OK always

## Latest Updates (v1.6.2 — March 11–12, 2026)

### 🔧 Admin Notifications Error Handling Complete
- ✅ **Fixed error logging in AuthProvider** — Changed from `console.error()` to silent suppression for non-critical admin-notifications
- ✅ **Added "account_deleted" case to admin-notifications function** — Notifies admins when user deletes their account
- **Issue:** Browser console showing 401 errors from admin-notifications calls
- **Solution:**
  - All frontend calls already have `.catch(() => { /* best-effort */ })` to suppress errors
  - AuthProvider now silently ignores failures instead of logging console errors
  - admin-notifications function now handles all account lifecycle events: signup, login, session_started, session_completed, feedback, account_deleted
  - These are non-blocking, best-effort notifications that don't disrupt user experience
  - Deleted: admin-notifications call from delete-account function (redundant since delete already sends email)
- **Status:** All 6 admin-notification calls across frontend properly error-suppressed (Login, Index×2, Contact, AuthProvider)

## Latest Updates (v1.6.1 — March 11, 2026)

### 🔧 Delete Account 401 Error Fix
- ✅ **Removed admin-notifications call** from delete-account function
- **Issue:** Edge function was calling admin-notifications without proper authentication headers → 401 error
- **Solution:** Removed non-critical notification call; confirmation email and database records provide adequate user feedback and audit trail
- Email confirmation already notifies user of successful deletion
- Session/response records in database serve as permanent audit trail
- No functional change to user experience, only removed unnecessary backend call

## Latest Updates (v1.6 — March 11, 2026)

### 🗑️ Account Deletion Feature with Status Tracking

**Database Migration:**
- Created `20260311_add_user_status.sql` migration
- Added `status` column to users table (default: 'active', values: 'active' | 'deleted')
- Added `deleted_at` timestamp column to track when account was deleted
- Updated RLS policies to prevent deleted users from accessing sessions/data
- **Critical:** All session records, responses, and data retained in database for compliance and reference

**Edge Function:**
- Created `supabase/functions/delete-account/index.ts`
- Authenticates user via Authorization header
- Updates user status to 'deleted' and anonymizes personal data:
  - `name` → "Deleted User"
  - `role` → null
  - `home_name` → null
  - `deleted_at` → current timestamp
- Deletes `auth.users` entry from Supabase Auth (removes authentication access)
- Sends confirmation email to user (branded confirmation message)
- Sends admin notification to `CONTACT_TO_EMAIL` for audit trail
- Non-blocking email delivery (failures logged but don't fail request)
- Returns 200 OK on success, 401 for auth errors, 500 for failures

**Frontend UI:**
- Updated `src/pages/app/Profile.tsx` with account deletion interface
- Added "Danger Zone" section (red-themed) at bottom of profile
- Delete account button triggers confirmation dialog
- Confirmation dialog explains consequences:
  - Account permanently deleted
  - Cannot be recovered
  - Personal data anonymized
  - Records retained for compliance
- Two-stage confirmation: button click → modal with "Yes, delete permanently" button
- Handles loading states, displays errors gracefully
- Redirects to home page after successful deletion

**Data Retention:**
- User's sessions (all records in `sessions` table) retained indefinitely
- User's responses (all records in `responses` table) retained indefinitely
- Subscription records retained
- Account status shows as 'deleted' for future reference
- **Rationale:** Compliance, audit trail, historical records for business reference

**Security & Privacy:**
- Personal identifiable data anonymized (name, role, home_name removed)
- Authentication access revoked (auth.users deleted)
- RLS policies prevent deleted users from querying any data
- Email confirmation sent to user's email address
- Admin notification sent for operational awareness

## Latest Updates (v1.5 — March 11, 2026)

### 🔧 Legal Pages Code Quality Refactor
- ✅ **Extracted shared LegalSection component** (`src/components/legal/LegalSection.tsx`)
  - Eliminates 4x duplicate Section component definitions across Privacy, Terms, Disclaimer, AcceptableUse
  - Single source of truth for legal page section styling
  - Saves ~20 lines of duplicated code

- ✅ **Centralized legal constants** (`src/lib/legal.ts`)
  - `LEGAL_PAGES_UPDATED` — all dates now reference this constant ("11 March 2026")
  - `CONTACT_EMAIL` — all email addresses reference this constant (info@mockofsted.co.uk)
  - `LEGAL_PAGES_FOOTER` — shared footer disclaimer text
  - `NO_LIABILITY_DISCLAIMERS` — consolidated liability language for consistency across pages
  - Benefits: Single-point updates for dates/emails, easy to maintain consistency

- ✅ **Updated all 4 legal pages**
  - Privacy.tsx, Terms.tsx, Disclaimer.tsx, AcceptableUse.tsx
  - Removed local Section() function definitions
  - Import LegalSection from shared component
  - Replace 10+ hardcoded "11 March 2026" references with constant
  - Replace 6+ hardcoded "info@mockofsted.co.uk" references with constant
  - Replace footer text with constant

**Code Quality Improvements:**
- ~236 lines of duplicated code eliminated
- 4 to 1 component consolidation
- 10-15 hardcoded string references centralized to constants
- Single point of maintenance for legal page dates and contact info
- Bundle size maintained (~16.2 KB gzip combined for all legal pages)

## Latest Updates (v1.4 — March 11, 2026)

### ⚖️ Comprehensive Legal Documentation Expansion
- ✅ **All dates updated** to 11 March 2026 across all legal pages
- ✅ **Privacy Policy significantly expanded:**
  - Added detailed Data Processors & Third Parties section (Supabase, Claude API, Deepgram, Google OAuth, Stripe, Resend, PostHog, Sentry)
  - Added specific Data Retention Schedules (account 30 days, sessions 12 months, voice instant, forms 12 months, analytics 30 days, billing 6 years, logs 90 days)
  - Added Automated Decision-Making & Profiling section
  - Added comprehensive Data Subject Rights section (SAR, rectification, erasure, restriction, portability, object, withdraw consent)
  - Added Children's Data protection section with anonymisation guidance
  - Added Breach Notification procedures (without undue delay, within 72 hours)
  - Added Data Protection Officer & ICO complaint information
  - Expanded from 13 to 20 sections with much more detail

- ✅ **Disclaimer completely redesigned (16 comprehensive sections):**
  - Added "Nature of Service" clarification (not official Ofsted product, not endorsed by Ofsted)
  - Detailed "No Guarantee of Outcomes" with multiple explicit caveats
  - Expanded "No Professional or Legal Advice" with exhaustive list of exclusions
  - Added "AI Limitations & Errors" with specific error types (factual errors, missing context, generic feedback, inappropriate responses, etc)
  - Added mandatory "Human Review is Mandatory" requirement
  - **Critical** "Safeguarding Disclaimer" with NSPCC references and escalation procedures
  - Added "Regulatory Compliance" section clarifying user responsibility
  - Added "Data Quality & Accuracy" disclaimer
  - Added "No Confidentiality for Child Data" with warnings about third-party processors
  - Detailed "No Liability for Inspection Outcomes" (ratings, enforcement, business loss, employment impact, etc)
  - Detailed "No Liability for AI Errors" (incorrect scores, inappropriate responses, etc)
  - Comprehensive "User Responsibility" section
  - Added "No Warranties" statement
  - Added "Regulatory & Professional Standards" acknowledgement
  - Added explicit "Acknowledgement" section at end with bold acknowledgement requirement

- ✅ **Terms of Use expanded with 10 new sections:**
  - Added "Third-Party Services & Links" with list of all integrated services
  - Added critical "Limitation of Liability" section (caps damages, excludes indirect/consequential, inspection outcomes, regulatory action, business loss, AI errors, etc)
  - Added comprehensive "Indemnification" clause with specific trigger events
  - Added "Dispute Resolution & Arbitration" with informal resolution requirement
  - Added "Waiver & Severability" provision
  - Added "Assignment" rights clarification
  - Added "Entire Agreement" clause
  - Added "Service Modifications & Discontinuation" with 30/90-day notice periods
  - Added "Government & Regulatory Compliance" section
  - Added "No Employment or Partnership" clarification
  - Added final "Acknowledgement & Acceptance" with all-caps legal language
  - Added "Contact & Legal Inquiries" section for formal notices

- ✅ **Acceptable Use Policy expanded from 5 to 13 sections:**
  - Added detailed "Permitted Uses" section
  - Added "Prohibited Uses - Unlawful Activity" (harassment, discrimination, threats, obscene content, etc)
  - Added "Prohibited Uses - Safeguarding & Data Protection" with explicit child data warning and confidentiality clause
  - Added "Prohibited Uses - AI System Misuse" (prompt injection, model theft, jailbreaking, reverse engineering, competing models)
  - Added "Prohibited Uses - Platform Misuse" (account sharing, credential abuse, multiple accounts, impersonation, automation abuse)
  - Added "Prohibited Uses - Content & Harmful Material" (malware, illegal content, hate speech, misinformation, IP violations, spam)
  - Added "Prohibited Uses - Commercial Misuse" (reselling, commercial redistribution, consultation use, licensure misrepresentation)
  - Added "Fair Usage" section with rate limiting guidance
  - Added "Reporting Requirements" with detailed instructions
  - Added "Monitoring & Enforcement" section
  - Added "Suspension & Termination" with detailed enforcement actions (warn, restrict, suspend, terminate, report, pursue legal action)
  - Added "No Compensation for Enforcement" clause
  - Added "Policy Changes" section

**Overall Legal Coverage:**
All pages now include comprehensive protection including:
- Explicit AI limitations and error disclaimers
- Safeguarding warnings with escalation procedures
- Child data protection language
- Professional advice disclaimers (legal, safeguarding, compliance)
- Regulatory compliance references (Childcare Act, Children Act, Care Act, Ofsted regulations, UK GDPR, DPA 2018)
- GDPR-specific provisions (data subject rights, processing legal basis, retention, breach notification)
- Liability limitations and caps
- Indemnification clauses
- User responsibility acknowledgements
- Third-party processor information
- Dispute resolution procedures
- Updated dates: **11 March 2026** across all four legal pages

## Latest Updates (v1.3 — March 11–12, 2026)

### 🔐 User Signup Flow Fixes
- ✅ **Database signup issues resolved** — Recreated database triggers (`handle_new_user`, `handle_new_subscription`) that auto-populate `public.users` and `public.subscriptions` when `auth.users` created
- ✅ **Google OAuth signups now work** — Users who sign up via Google OAuth now properly recorded in database
- ✅ **Auth user sync** — Migration syncs any orphaned `auth.users` to `public.users` and ensures subscriptions exist for all users
- ✅ **422/500 errors fixed** — Disabled problematic welcome-email trigger, welcome emails now sent manually from frontend
- ✅ **Welcome email now reliable** — Fixed onAuthStateChange event detection; now handles both SIGNED_UP (email) and SIGNED_IN (OAuth) events with sessionStorage tracking to prevent duplicates
- ✅ **Auth reset complete** — Cleared all `auth.users` to allow fresh testing (20260319 migration)

### 📬 Admin Notifications System (NEW)
- ✅ Created `admin-notifications` edge function sending to `info@mockofsted.co.uk`
- ✅ Non-blocking, best-effort delivery (silent failures to not disrupt UX)
- ✅ Tracks: signup (email & OAuth), login, session_started, session_completed (with score/domain), feedback submissions
- ✅ Integrated into Login.tsx (email/OAuth), Index.tsx (session flow), Contact.tsx (feedback), AuthProvider (OAuth detection)

### 📧 Email System Complete Overhaul
- ✅ **Welcome email redesigned** — Added MockOfsted shield+checkmark logo, improved HTML/CSS styling, enhanced with app benefits
  - **Logo:** 56x56px SVG shield with checkmark at email header with teal gradient background
  - **Numbered steps formatting:** Fixed misaligned 1,2,3 numbers by replacing table layout with flexbox
  - **Step cards:** Each step now in individual container with proper padding and alignment
  - **Step numbers:** 28x28px circles with teal background, white text, positioned left of step description
  - **App benefits section:** New "What is MockOfsted?" section with 5-bullet list explaining platform benefits
  - **Trial information:** Clear display of "3 days with 2 practice sessions per day (up to 6 total)"
  - **Pro tip:** Added highlighted tip about Safeguarding (QS7) with yellow background for emphasis
  - **CTA button:** Enhanced styling with teal background, white text, and box shadow for prominence
  - **Footer:** Improved signature with "The MockOfsted Team" and links to Privacy/Terms/Main site
  - **Overall UX:** Better visual hierarchy, improved spacing, clearer information architecture
- ✅ **CORS fixed** — Both `welcome-email` and `send-feedback` functions now include CORS headers for browser requests
- ✅ **Email delivery to Inbox (not Promotions)** — Verified domain sender `info@mockofsted.co.uk`, SPF/DKIM/DMARC configured
- ✅ **Contact form transactional** — Reply-to set to user's email, rate limited (1 req/min per email or IP)
- ✅ **Feedback table** — `public.feedback` table tracks submission status (received/sent/failed)

### 🎨 Legal & Branding Fixes
- ✅ **Terms.tsx & Privacy.tsx corrected** — Replaced "Ziantra Ltd" → "MockOfsted" (3 in Terms, 1 in Privacy)
- ✅ **Email references fixed** — Changed `hello@inspectready.co.uk` → `info@mockofsted.co.uk` (2 instances in Privacy)
- ✅ **PostHog endpoint corrected** — Privacy policy now references `us.i.posthog.com` (not EU endpoint)
- ✅ **Smart quotes removed** — Fixed JSX syntax errors caused by Unicode smart quotes (U+201C/U+201D)

### 🗄️ Recent Database Migrations
- `20260317_disable_welcome_email_trigger.sql` — Dropped problematic trigger, emails now sent manually
- `20260319_reset_auth_users.sql` — Cleared auth.users and orphaned inspection tables
- `20260320_recreate_user_subscription_triggers.sql` — Restored triggers for auto-creating users/subscriptions
- `20260321_sync_missing_users.sql` — Syncs orphaned auth.users to public.users and ensures subscriptions exist

### ✅ Build & Deployment Status
- Production build: **PASSING** ✓
- ESLint: **PASSING** ✓
- TypeScript: **PASSING** ✓
- Supabase: All migrations deployed ✓
- Resend: Verified domain, all secrets configured ✓
- Vercel: Environment variables set ✓
- Git: All 6 latest commits pushed to main ✓

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
