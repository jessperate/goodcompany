-- Append one recommendation atomically without rewriting profile fields or creatives.
create function public.goodcompany_recommend_job(job_id text) returns text[]
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid(); jobs text[];
begin
 if owner is null then raise exception 'Sign in to recommend a job'; end if;
 if job_id is null or job_id !~ '^[a-zA-Z0-9_-]{1,200}$' then raise exception 'Invalid job'; end if;
 insert into public.goodcompany_profiles(user_id) values(owner) on conflict(user_id) do nothing;
 select recommended_jobs into jobs from public.goodcompany_profiles where user_id=owner for update;
 if job_id=any(jobs) then return jobs; end if;
 if cardinality(jobs)>=10 then raise exception 'Your top ten is full. Edit your profile to make room.'; end if;
 jobs := array_append(jobs,job_id);
 update public.goodcompany_profiles set recommended_jobs=jobs,updated_at=now() where user_id=owner;
 return jobs;
end;
$$;
revoke all on function public.goodcompany_recommend_job(text) from public,anon;
grant execute on function public.goodcompany_recommend_job(text) to authenticated;
