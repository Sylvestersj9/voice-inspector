-- Fix RLS to be user-owned (created_by / answered_by) instead of organisation/home based.

-- 1) Safe defaults so inserts don't forget user columns
alter table inspection_sessions alter column created_by set default auth.uid();
alter table inspection_answers alter column answered_by set default auth.uid();

-- 2) Drop organisation-based policies
drop policy if exists inspections_read_write on inspection_sessions;
drop policy if exists session_questions_read_write on inspection_session_questions;
drop policy if exists answers_read_write on inspection_answers;
drop policy if exists evaluations_read_write on inspection_evaluations;
drop policy if exists reports_read_write on inspection_reports;

-- 3) User-owned policies

-- inspection_sessions: owned by created_by
create policy sessions_select_user on inspection_sessions for select
  using (created_by = auth.uid());

create policy sessions_insert_user on inspection_sessions for insert
  with check (created_by = auth.uid());

create policy sessions_update_user on inspection_sessions for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy sessions_delete_user on inspection_sessions for delete
  using (created_by = auth.uid());

-- inspection_session_questions: allowed if session.created_by = auth.uid()
create policy session_questions_all_user on inspection_session_questions for all
  using (
    inspection_session_id in (
      select id from inspection_sessions where created_by = auth.uid()
    )
  )
  with check (
    inspection_session_id in (
      select id from inspection_sessions where created_by = auth.uid()
    )
  );

-- inspection_answers: allow answered_by user or session owner
create policy answers_all_user on inspection_answers for all
  using (
    answered_by = auth.uid()
    or inspection_session_question_id in (
      select q.id
      from inspection_session_questions q
      join inspection_sessions s on s.id = q.inspection_session_id
      where s.created_by = auth.uid()
    )
  )
  with check (
    answered_by = auth.uid()
    or inspection_session_question_id in (
      select q.id
      from inspection_session_questions q
      join inspection_sessions s on s.id = q.inspection_session_id
      where s.created_by = auth.uid()
    )
  );

-- inspection_evaluations: allow if session owner
create policy evaluations_all_user on inspection_evaluations for all
  using (
    inspection_session_question_id in (
      select q.id
      from inspection_session_questions q
      join inspection_sessions s on s.id = q.inspection_session_id
      where s.created_by = auth.uid()
    )
  )
  with check (
    inspection_session_question_id in (
      select q.id
      from inspection_session_questions q
      join inspection_sessions s on s.id = q.inspection_session_id
      where s.created_by = auth.uid()
    )
  );

-- inspection_reports: allow if session owner
create policy reports_all_user on inspection_reports for all
  using (
    inspection_session_id in (
      select id from inspection_sessions where created_by = auth.uid()
    )
  )
  with check (
    inspection_session_id in (
      select id from inspection_sessions where created_by = auth.uid()
    )
  );
