-- Editable profiles and recommendations. Login emails and pinned jobs stay private.
create table public.goodcompany_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 2000),
  links jsonb not null default '{}' check (jsonb_typeof(links) = 'object' and octet_length(links::text) <= 10000),
  work_history jsonb not null default '[]' check (jsonb_typeof(work_history) = 'array' and jsonb_array_length(work_history) <= 20 and octet_length(work_history::text) <= 20000),
  avatar_path text check (avatar_path is null or (avatar_path like user_id::text || '/%' and char_length(avatar_path) <= 200)),
  published boolean not null default false,
  recommended_jobs text[] not null default '{}' check (cardinality(recommended_jobs) <= 10 and octet_length(recommended_jobs::text) <= 2500),
  updated_at timestamptz not null default now(),
  check (not published or (char_length(trim(first_name)) > 0 and char_length(trim(last_name)) > 0))
);
alter table public.goodcompany_profiles enable row level security;
grant select on public.goodcompany_profiles to anon, authenticated;
grant insert, update, delete on public.goodcompany_profiles to authenticated;
create policy "Read published profiles or own draft" on public.goodcompany_profiles for select to anon, authenticated using (published or (select auth.uid()) = user_id);
create policy "Create own profile" on public.goodcompany_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Edit own profile" on public.goodcompany_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own profile" on public.goodcompany_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create table public.goodcompany_creative_recommendations (
  owner_id uuid not null references public.goodcompany_profiles(user_id) on delete cascade,
  creative_id uuid not null references public.goodcompany_profiles(user_id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  primary key (owner_id, position),
  unique (owner_id, creative_id),
  check (owner_id <> creative_id)
);
create index goodcompany_creative_target on public.goodcompany_creative_recommendations(creative_id);
alter table public.goodcompany_creative_recommendations enable row level security;
grant select on public.goodcompany_creative_recommendations to anon, authenticated;
grant insert, delete on public.goodcompany_creative_recommendations to authenticated;
create policy "Read visible recommendations" on public.goodcompany_creative_recommendations for select to anon, authenticated using (
  (select auth.uid()) = owner_id or (
    exists(select 1 from public.goodcompany_profiles p where p.user_id = owner_id and p.published)
    and exists(select 1 from public.goodcompany_profiles p where p.user_id = creative_id and p.published)
  )
);
create policy "Recommend published creatives" on public.goodcompany_creative_recommendations for insert to authenticated with check (
  (select auth.uid()) = owner_id and exists(select 1 from public.goodcompany_profiles p where p.user_id = creative_id and p.published)
);
create policy "Remove own recommendations" on public.goodcompany_creative_recommendations for delete to authenticated using ((select auth.uid()) = owner_id);

-- One atomic save, with caller permissions and RLS enforced throughout.
create function public.goodcompany_save_profile(profile_data jsonb, creative_ids uuid[] default '{}') returns void
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid();
begin
  if owner is null then raise exception 'Sign in to save a profile'; end if;
  if cardinality(creative_ids) > 10 then raise exception 'Choose up to 10 creatives'; end if;
  insert into public.goodcompany_profiles(user_id,first_name,last_name,bio,links,work_history,avatar_path,published,recommended_jobs)
  values(owner,trim(coalesce(profile_data->>'first_name','')),trim(coalesce(profile_data->>'last_name','')),coalesce(profile_data->>'bio',''),coalesce(profile_data->'links','{}'),coalesce(profile_data->'work_history','[]'),nullif(profile_data->>'avatar_path',''),coalesce((profile_data->>'published')::boolean,false),array(select jsonb_array_elements_text(coalesce(profile_data->'recommended_jobs','[]'))))
  on conflict(user_id) do update set first_name=excluded.first_name,last_name=excluded.last_name,bio=excluded.bio,links=excluded.links,work_history=excluded.work_history,avatar_path=excluded.avatar_path,published=excluded.published,recommended_jobs=excluded.recommended_jobs,updated_at=now();
  delete from public.goodcompany_creative_recommendations where owner_id=owner;
  insert into public.goodcompany_creative_recommendations(owner_id,creative_id,position)
    select owner,id,n::smallint from unnest(creative_ids) with ordinality as choice(id,n);
end;
$$;
revoke all on function public.goodcompany_save_profile(jsonb,uuid[]) from public, anon;
grant execute on function public.goodcompany_save_profile(jsonb,uuid[]) to authenticated;

create function public.goodcompany_find_creatives(search_name text)
returns table(user_id uuid,first_name text,last_name text)
language sql stable security invoker set search_path = '' as $$
  select p.user_id,p.first_name,p.last_name from public.goodcompany_profiles p
  where p.published and length(trim(search_name)) between 2 and 80
    and position(lower(trim(search_name)) in lower(p.first_name || ' ' || p.last_name)) > 0
  order by p.first_name,p.last_name,p.user_id limit 20;
$$;
revoke all on function public.goodcompany_find_creatives(text) from public;
grant execute on function public.goodcompany_find_creatives(text) to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('goodcompany-headshots','goodcompany-headshots',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Read own or published headshots" on storage.objects for select to anon, authenticated using (
  bucket_id='goodcompany-headshots' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.goodcompany_profiles p where p.published and p.avatar_path=name))
);
create policy "Upload own headshots" on storage.objects for insert to authenticated with check (bucket_id='goodcompany-headshots' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Remove own headshots" on storage.objects for delete to authenticated using (bucket_id='goodcompany-headshots' and (storage.foldername(name))[1]=(select auth.uid())::text);
