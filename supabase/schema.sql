-- Prepared schema; apply to the user-selected Good Company project before enabling accounts.
-- Auth owns accounts. Each saved job belongs to exactly one authenticated account.
begin;
create table public.goodcompany_saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null check (char_length(job_id) between 1 and 200),
  title text not null check (char_length(title) between 1 and 500),
  company text not null check (char_length(company) between 1 and 200),
  source_url text not null check (source_url ~ '^https://'),
  saved_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.goodcompany_saved_jobs enable row level security;
revoke all on public.goodcompany_saved_jobs from anon, authenticated;
grant select, insert, delete on public.goodcompany_saved_jobs to authenticated;
create policy "Read own saved jobs" on public.goodcompany_saved_jobs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Pin a job to own profile" on public.goodcompany_saved_jobs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Unpin own saved jobs" on public.goodcompany_saved_jobs
  for delete to authenticated using ((select auth.uid()) = user_id);
create index goodcompany_saved_jobs_user_date
  on public.goodcompany_saved_jobs (user_id, saved_at desc);
commit;
