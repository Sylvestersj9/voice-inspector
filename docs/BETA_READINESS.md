# Beta Readiness Audit

## What was checked
- Auth guards: protected routes `/app`, `/app/sessions`, `/app/dashboard` redirect unauthenticated users. Logout flows redirect to `/login`.
- Session loading: sessions/questions/evaluations fetch paths verified against Supabase tables; UUIDs hidden in UI; empty states human friendly.
- Evaluation normalization: strengths/gaps/follow-ups forced to non-empty arrays; dashboard model derived safely.
- Dashboard: uses derived model only (no answers/questions rendered); handles missing evaluations gracefully.
- Billing/entitlement: stub guard centralised (`src/lib/entitlements.ts`) and enforcement tolerates missing plan/status.
- Code quality: lint/typecheck/test scripts added; minimal unit + e2e scaffolding.

## How to run tests
```bash
npm install
npm run lint
npm run typecheck
npm test          # vitest unit tests
npx playwright install --with-deps
npm run e2e       # requires dev server at E2E_BASE_URL (default http://localhost:5173); set E2E_SKIP=1 to skip
```

## 10-minute manual test script
1. Login flow: open `/login`, complete auth; refresh `/app` to confirm session persists. Try hitting `/app` unauthenticated in another browser; expect redirect to `/login`.
2. Simulator: start a new session, answer via text, run evaluation; verify strengths/gaps/follow-ups present and no errors toasts.
3. Sessions history: visit `/app/sessions`, select latest session, confirm questions/answers/evaluations render; toggle answer accordion; ensure no UUIDs visible.
4. Dashboard: open `/app/dashboard`; cards and bar chart show data from latest evaluated session; strengths/improvements lists render or show empty state if none.
5. Logout: click logout in top nav; confirm redirect to `/login` and session cleared; revisiting `/app` redirects to `/login`.

## Known limitations
- Playwright smoke tests are stubbed for auth-dependent flows; require a running dev server and valid Supabase credentials to be meaningful.
- Billing enforcement is stubbed (always allows) for beta; entitlement logic will need real checks before production.
- Voice recording paths are not covered by automated tests and should be exercised manually with network failure scenarios.
