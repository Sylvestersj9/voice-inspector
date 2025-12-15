-- Set defaults to ensure user ownership is populated
alter table public.inspection_sessions
  alter column created_by set default auth.uid();

alter table public.inspection_answers
  alter column answered_by set default auth.uid();

-- Drop existing org/home-based policies
drop policy if exists inspections_read_write on public.inspection_sessions;
drop policy if exists session_questions_read_write on public.inspection_session_questions;
drop policy if exists answers_read_write on public.inspection_answers;
drop policy if exists evaluations_read_write on public.inspection_evaluations;
drop policy if exists reports_read_write on public.inspection_reports;

-- User-owned policies

-- inspection_sessions
create policy sessions_select_own
on public.inspection_sessions
for select
to public
using (created_by = auth.uid());

create policy sessions_insert_own
on public.inspection_sessions
for insert
to public
with check (created_by = auth.uid());

create policy sessions_update_own
on public.inspection_sessions
for update
to public
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy sessions_delete_own
on public.inspection_sessions
for delete
to public
using (created_by = auth.uid());

-- inspection_session_questions (via session ownership)
create policy session_questions_select_own
on public.inspection_session_questions
for select
to public
using (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

create policy session_questions_insert_own
on public.inspection_session_questions
for insert
to public
with check (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

create policy session_questions_update_own
on public.inspection_session_questions
for update
to public
using (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
)
with check (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

create policy session_questions_delete_own
on public.inspection_session_questions
for delete
to public
using (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

-- inspection_answers (answered_by OR session owner)
create policy answers_select_own
on public.inspection_answers
for select
to public
using (
  answered_by = auth.uid()
  or inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

create policy answers_insert_own
on public.inspection_answers
for insert
to public
with check (
  answered_by = auth.uid()
  or inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

create policy answers_update_own
on public.inspection_answers
for update
to public
using (
  answered_by = auth.uid()
  or inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
)
with check (
  answered_by = auth.uid()
  or inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

-- inspection_evaluations (via session ownership)
create policy evals_select_own
on public.inspection_evaluations
for select
to public
using (
  inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

create policy evals_insert_own
on public.inspection_evaluations
for insert
to public
with check (
  inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

create policy evals_update_own
on public.inspection_evaluations
for update
to public
using (
  inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
)
with check (
  inspection_session_question_id in (
    select q.id
    from public.inspection_session_questions q
    join public.inspection_sessions s on s.id = q.inspection_session_id
    where s.created_by = auth.uid()
  )
);

-- inspection_reports (via session ownership)
create policy reports_select_own
on public.inspection_reports
for select
to public
using (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

create policy reports_insert_own
on public.inspection_reports
for insert
to public
with check (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);

create policy reports_update_own
on public.inspection_reports
for update
to public
using (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
)
with check (
  inspection_session_id in (
    select id from public.inspection_sessions where created_by = auth.uid()
  )
);
