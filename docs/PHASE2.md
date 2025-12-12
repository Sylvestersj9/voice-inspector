# Phase 2 Completion Checklist

Desktop-first Ofsted/SCCIF simulator with grounded evaluations, deterministic follow-ups, and exportable history.

## Build & Quality Gates
- [x] `npm run build` (vite) passes
- [ ] `npm run lint` clean
- [x] Evaluation schema validated server-side with zod
- [x] Follow-up flow capped at 2 attempts with rule-based prompts

## Environment & Keys
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `LOVABLE_API_KEY`
- Voice: batch upload to `/functions/v1/transcribe` (no live transcription)
- Evaluation: `/functions/v1/evaluate` (Lovable gateway + schema validation)

## Database Shape (Supabase)
- Tables: `documents(id, title, source, content, created_at)`, `chunks(id, document_id, chunk_text, embedding, created_at)`, `sessions(id, overall_score, overall_band, created_at)`, `session_answers(id, session_id, question_id, question_domain, transcript, evaluation_json, attempt_index, created_at)`
- Function: `match_chunks(query_embedding vector, match_count int)` returning `(id, document_id, chunk_text, similarity)`
- Indexes/requirements: `pgvector` enabled; `chunks.embedding` vector index (ivfflat/hnsw); FK `chunks.document_id -> documents.id`, `session_answers.session_id -> sessions.id`

## RAG Pipeline (End-to-End)
1) Admin upload (`/admin`) → `embed-document` edge function chunks, embeds (text-embedding-3-small), stores in `documents` + `chunks`.
2) Evaluation (`/functions/v1/evaluate`) builds embedding of question+transcript, calls `match_chunks` for top 6, injects as context into system prompt.
3) Optional search endpoint: `/functions/v1/search-chunks` for manual checks/debug.
4) Ensure embeddings match Supabase project keys; rotate `OPENAI_API_KEY`/`SERVICE_ROLE` for prod.

## Evaluation Output Contract
Canonical JSON expected from the model (validated on the edge):
```json
{
  "score_0_to_5": 4.0,
  "judgement_band": "Good",
  "strengths": [],
  "gaps": [],
  "risk_flags": [],
  "recommended_actions": [],
  "follow_up_question": "",
  "framework_alignment": [],
  "missing_expectations": [],
  "evidence_used": []
}
```
- Edge validates, then returns camelCase to the UI: `score`, `judgementBand`, `strengths`, `gaps`, `riskFlags`, `recommendedActions`, `followUpQuestions` (array), `frameworkAlignment`, `missingExpectations`, `evidenceUsed`, `schemaVersion`.
- UI also validates with zod before rendering to avoid crashes.

## Follow-up Engine
- Rules (see `src/lib/followUpRules.ts`): offer follow-up when score ≤3 or gaps detected; prioritise gaps in examples, monitoring, impact, and safeguarding specifics. Max 2 attempts per question with clear labels.
- Follow-ups are stored per `session_answers` with `attempt_index` and re-scored; the better score is used in summaries.

## Session History & Export
- Every evaluation attempt saved to `session_answers`; best per question used for summary.
- `/history` shows sessions → click for per-question breakdown (scores, transcript, first strength/gap, follow-up counts).
- Export: print-friendly PDF via `ExportSummary` (overall band, strengths/gaps/actions, per-question table).

## Safety & UX Notes
- Banner reminder: avoid names/identifying details.
- Short transcript warning + retry button before evaluation.
- Next navigation locked until evaluation completes; summary available after last question save.
- Voice-first but text path remains; calm loading states for upload/transcription/evaluation.

## Smoke Test Flow (local)
1) `npm run dev` and record an answer (or type) → transcription shown → edit → submit.
2) Confirm evaluation renders score/band, follow-up offer text matches rule.
3) Take a follow-up → confirm re-score and follow-up attempt count increments.
4) Complete 5 questions → summary view → print/export works.
5) Visit `/history` → latest session listed → click to view question breakdown.

## Piloting Notes
- Seed knowledge base with SCCIF/Regs excerpts via Admin to strengthen grounding.
- Rotate keys + restrict service role in production; avoid sensitive child data storage.

## Subscriptions & Auth (single manager, £29/mo)
- Tables: `user_subscriptions(user_id uuid pk, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end, created_at default now(), updated_at)`
- RLS example: `policy read_own on user_subscriptions for select using (auth.uid() = user_id);` and `policy upsert_service on user_subscriptions for insert with check (false);` (updates only via service role/webhook).
- Edge functions:
  - `create-checkout-session`: Stripe Checkout (promo codes allowed) + billing portal when already active.
  - `stripe-webhook`: handles checkout completion + subscription lifecycle; updates `user_subscriptions`.
- Required Stripe env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (monthly £29 price), `STRIPE_WEBHOOK_SECRET`, `APP_URL` (front-end origin for redirects).
- Front-end gating: Auth + subscription enforced via `ProtectedRoute`; paywall triggers Checkout; account page opens portal/manage subscription.
