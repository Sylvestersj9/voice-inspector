# Phase 3: Inspection Feedback Submission

**Objective:** Enable users to submit feedback from their inspections/interviews for display in a public feedback gallery (Phase 4).

## Implementation Status

### ✅ COMPLETED

**Database Migration**
- File: `supabase/migrations/20260315_inspection_feedback.sql`
- Table: `public.inspection_feedback` with RLS policies
- Indexes: On (user_id, submitted_at) and (is_public, created_at) for performance
- Triggers: Auto-update `updated_at` timestamp
- Fields:
  - `feedback_type`: inspection, interview, or practice
  - `title`, `description`: User content
  - `outcome`: Optional badge (good, outstanding, etc.)
  - `key_learning`: Single-line summary
  - `home_setting`, `role_at_time`: Context fields
  - `is_public`, `is_anonymised`, `consent_to_share`: Privacy controls
  - Timestamps: submitted_at, created_at, updated_at

**Edge Function**
- File: `supabase/functions/submit-inspection-feedback/index.ts`
- Endpoint: `POST /functions/v1/submit-inspection-feedback`
- Auth: Requires valid JWT token in Authorization header
- Validation: Requires feedbackType, title, description (min validation)
- Response: 201 Created on success, 400/401/500 on errors
- Non-blocking: All errors logged, proper HTTP status codes returned

**Frontend Types**
- File: `src/types/feedback.ts`
- Types: FeedbackType, FeedbackOutcome, InspectionFeedback, FeedbackFormData
- Used by: FeedbackSubmission component and future gallery components

**UI Component**
- File: `src/pages/app/FeedbackSubmission.tsx`
- Route: `/app/feedback-submission`
- Features:
  - Form with 3 feedback types (inspection, interview, practice)
  - Required fields: title, description
  - Optional fields: outcome, keyLearning, homeSetting, roleAtTime
  - Privacy toggles: is_anonymised, consent_to_share
  - Loading states and error handling
  - Success confirmation before redirect to dashboard
  - Optional sessionId query param for linking to session

**Route Registration**
- File: `src/App.tsx`
- Added import and protected route for `/app/feedback-submission`
- Wrapped with RequireAuth and PageTransition

## Ready for Testing

### Pre-Deployment Checklist

- [ ] Supabase migration deployed: `supabase db push`
- [ ] Edge function deployed: `supabase functions deploy submit-inspection-feedback`
- [ ] Frontend built: `bun run build` (no errors expected)
- [ ] Environment variables verified (none new required)

### Manual Testing Steps

1. **Database Setup**
   ```bash
   supabase db push
   ```
   - Verify table created: SELECT * FROM public.inspection_feedback;
   - Verify RLS policies applied
   - Verify indexes created

2. **Edge Function Deployment**
   ```bash
   supabase functions deploy submit-inspection-feedback
   ```
   - Check Supabase dashboard for function status
   - Verify no build errors

3. **Frontend Build**
   ```bash
   bun run build
   ```
   - Expect no TypeScript errors
   - Verify bundle size (should be minimal addition)

4. **User Flow Testing** (as authenticated user)
   - Navigate to `/app/feedback-submission`
   - Submit feedback with all fields
   - Submit feedback with minimal fields
   - Try invalid feedback_type (should fail)
   - Verify redirect to dashboard after success
   - Check database for inserted record

5. **Privacy Testing**
   - Submit with anonymised=true, consent_to_share=false
   - Verify is_public=false in database (not visible until Phase 4)
   - Verify user can view their own feedback (RLS)

6. **Error Handling Testing**
   - Test without Authorization header (401)
   - Test with invalid JWT (401)
   - Test with missing required fields (400)
   - Verify error messages displayed on form

## Next Steps (Phase 4)

After this is deployed and tested:

1. **Public Feedback Gallery** (`/feedback-gallery`)
   - Query: `SELECT * FROM inspection_feedback WHERE is_public = true AND is_anonymised = true`
   - Display: Testimonials grid, filtering by feedback_type, outcome
   - No auth required (public page)

2. **Admin Moderation Dashboard**
   - Tab in `/admin` to review feedback before publishing
   - Toggle `is_public` flag
   - Edit feedback if needed

3. **Dashboard Integration**
   - Add CTA on dashboard: "Share your feedback" → `/app/feedback-submission?sessionId={id}`
   - Link recent sessions to feedback submission

## Known Limitations

- **No file uploads**: Feedback is text-only (can be added later)
- **No editing after creation**: Users can't modify submitted feedback (can add PUT endpoint)
- **No email notifications**: Admins don't get alerted to new feedback (can add via admin-notifications edge function)
- **No moderation queue UI**: Admin must use SQL to publish feedback (Phase 4 dashboard will fix)

## Deployment Notes

- **Safe to deploy**: No breaking changes, additive only
- **Rollback plan**: Delete migration + edge function if needed
- **User impact**: New route and form, existing features unchanged
- **Database**: New table with RLS, safe for existing users

## Monitoring

After deployment, check:
1. Edge function logs for submission errors
2. Database for feedback records (should have test entries)
3. User dashboard (no visible changes yet, feature is behind form)
4. Sentry for any client-side errors during form submission

---

**Ready to deploy?** Run:
```bash
supabase db push && supabase functions deploy submit-inspection-feedback && bun run build
```

Then test the user flow on `/app/feedback-submission` before merging to main.
