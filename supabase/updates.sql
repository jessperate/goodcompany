-- Account-scoped read receipts for the versioned releases.js feed.
create table if not exists public.goodcompany_update_receipts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_seen_version integer not null default 0 check(last_seen_version>=0),
 seen_at timestamptz not null default now()
);
alter table public.goodcompany_update_receipts enable row level security;
revoke all on public.goodcompany_update_receipts from anon,authenticated;
grant select,insert,update on public.goodcompany_update_receipts to authenticated;
drop policy if exists updates_owner on public.goodcompany_update_receipts;
create policy updates_owner on public.goodcompany_update_receipts for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- An older open tab cannot move the seen version backwards.
create or replace function public.goodcompany_acknowledge_updates(seen_version integer)
returns void language sql security invoker set search_path='' as $$
 insert into public.goodcompany_update_receipts as receipt(user_id,last_seen_version)
 values(auth.uid(),seen_version)
 on conflict(user_id) do update
 set last_seen_version=greatest(receipt.last_seen_version,excluded.last_seen_version),seen_at=now();
$$;
revoke all on function public.goodcompany_acknowledge_updates(integer) from public,anon;
grant execute on function public.goodcompany_acknowledge_updates(integer) to authenticated;
