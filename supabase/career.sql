-- Private career interests are independent of public profile completion.
create table if not exists public.goodcompany_career_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 company_types text[] not null default '{}',
 industries text[] not null default '{}',
 roles text[] not null default '{}',
 work_setups text[] not null default '{}',
 onboarding_completed boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint career_preference_sizes check (cardinality(company_types)<=12 and cardinality(industries)<=20 and cardinality(roles)<=20 and cardinality(work_setups)<=3)
);
create table if not exists public.goodcompany_resume_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 job_id text not null check (length(job_id) between 1 and 200),
 draft_text text not null default '' check(length(draft_text)<=24000),
 source_text text not null default '' check(length(source_text)<=20000),
 updated_at timestamptz not null default now(),
 primary key(user_id,job_id)
);
alter table public.goodcompany_career_preferences enable row level security;
alter table public.goodcompany_resume_drafts enable row level security;
revoke all on public.goodcompany_career_preferences,public.goodcompany_resume_drafts from anon,authenticated;
grant select,insert,update,delete on public.goodcompany_career_preferences,public.goodcompany_resume_drafts to authenticated;
drop policy if exists career_preferences_owner on public.goodcompany_career_preferences;
create policy career_preferences_owner on public.goodcompany_career_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists resume_drafts_owner on public.goodcompany_resume_drafts;
create policy resume_drafts_owner on public.goodcompany_resume_drafts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Atomic daily quota. No résumé content is stored in usage tracking.
create schema if not exists goodcompany_private;
revoke all on schema goodcompany_private from public,anon,authenticated;
create table if not exists goodcompany_private.resume_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 usage_day date not null,
 requests integer not null,
 last_request timestamptz not null
);
alter table goodcompany_private.resume_usage enable row level security;
create or replace function goodcompany_private.claim_resume_refinement()
returns boolean language plpgsql security definer set search_path='' as $$
declare claimed uuid; begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 insert into goodcompany_private.resume_usage as u(user_id,usage_day,requests,last_request)
 values(auth.uid(),(now() at time zone 'UTC')::date,1,now())
 on conflict(user_id) do update set usage_day=excluded.usage_day,
 requests=case when u.usage_day=excluded.usage_day then u.requests+1 else 1 end,
 last_request=now()
 where (u.usage_day<>excluded.usage_day or u.requests<5) and u.last_request < now()-interval '30 seconds'
 returning user_id into claimed;
 return claimed is not null;
end $$;
revoke all on function goodcompany_private.claim_resume_refinement() from public,anon;
grant usage on schema goodcompany_private to authenticated;
grant execute on function goodcompany_private.claim_resume_refinement() to authenticated;
create or replace function public.goodcompany_claim_resume_refinement()
returns boolean language sql security invoker set search_path='' as $$
 select goodcompany_private.claim_resume_refinement();
$$;
revoke all on function public.goodcompany_claim_resume_refinement() from public,anon;
grant execute on function public.goodcompany_claim_resume_refinement() to authenticated;
drop policy if exists usage_no_direct_access on goodcompany_private.resume_usage;
create policy usage_no_direct_access on goodcompany_private.resume_usage for all using (false) with check (false);
