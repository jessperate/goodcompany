-- Save only supplied fields so other windows cannot erase a saved bio or headshot.
create or replace function public.goodcompany_save_profile(profile_data jsonb, creative_ids uuid[] default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid(); existing public.goodcompany_profiles%rowtype;
begin
  if owner is null then raise exception 'Sign in to save a profile'; end if;
  if cardinality(creative_ids) > 10 then raise exception 'Choose up to 10 creatives'; end if;
  select * into existing from public.goodcompany_profiles where user_id=owner for update;
  insert into public.goodcompany_profiles(user_id,first_name,last_name,bio,links,work_history,avatar_path,published,recommended_jobs)
  values(owner,trim(coalesce(profile_data->>'first_name',existing.first_name,'')),trim(coalesce(profile_data->>'last_name',existing.last_name,'')),coalesce(profile_data->>'bio',''),coalesce(profile_data->'links','{}'),coalesce(profile_data->'work_history','[]'),nullif(profile_data->>'avatar_path',''),coalesce((profile_data->>'published')::boolean,false),array(select jsonb_array_elements_text(coalesce(profile_data->'recommended_jobs','[]'))))
  on conflict(user_id) do update set
    first_name=case when profile_data ? 'first_name' then excluded.first_name else goodcompany_profiles.first_name end,
    last_name=case when profile_data ? 'last_name' then excluded.last_name else goodcompany_profiles.last_name end,
    bio=case when profile_data ? 'bio' then excluded.bio else goodcompany_profiles.bio end,
    links=case when profile_data ? 'links' then excluded.links else goodcompany_profiles.links end,
    work_history=case when profile_data ? 'work_history' then excluded.work_history else goodcompany_profiles.work_history end,
    avatar_path=case when profile_data ? 'avatar_path' then excluded.avatar_path else goodcompany_profiles.avatar_path end,
    published=case when profile_data ? 'published' then excluded.published else goodcompany_profiles.published end,
    recommended_jobs=case when profile_data ? 'recommended_jobs' then excluded.recommended_jobs else goodcompany_profiles.recommended_jobs end,
    updated_at=now();
  -- null means this window did not edit the creative recommendations.
  if creative_ids is not null then
    delete from public.goodcompany_creative_recommendations where owner_id=owner;
    insert into public.goodcompany_creative_recommendations(owner_id,creative_id,position)
      select owner,id,n::smallint from unnest(creative_ids) with ordinality as choice(id,n);
  end if;
end;
$$;
revoke all on function public.goodcompany_save_profile(jsonb,uuid[]) from public, anon;
grant execute on function public.goodcompany_save_profile(jsonb,uuid[]) to authenticated;
