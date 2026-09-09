-- Single-recipient bearer links. Only published inviter names are shared.
create schema if not exists goodcompany_private;
revoke all on schema goodcompany_private from public;
grant usage on schema goodcompany_private to anon, authenticated;
create table goodcompany_private.creative_invites (
 id uuid primary key,
 owner_id uuid not null references public.goodcompany_profiles(user_id) on delete cascade,
 recipient_label text not null check (length(trim(recipient_label)) between 1 and 80),
 claimed_by uuid references auth.users(id) on delete set null,
 claimed_at timestamptz,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '30 days',
 revoked boolean not null default false,
 check (claimed_by is null or claimed_by <> owner_id)
);
alter table goodcompany_private.creative_invites enable row level security;
revoke all on goodcompany_private.creative_invites from public, anon, authenticated;
create index creative_invites_owner on goodcompany_private.creative_invites(owner_id,created_at desc);
create index creative_invites_claimant on goodcompany_private.creative_invites(claimed_by);

-- Definer routines are isolated from the exposed schema. Every mutation derives
-- identity from auth.uid(); clients never receive direct table access.
create function goodcompany_private.create_invite(invite_id uuid, recipient_label text) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); existing_owner uuid;
begin
 if uid is null then raise exception 'Sign in to invite a creative'; end if;
 if invite_id is null or length(trim(recipient_label)) not between 1 and 80 then raise exception 'Enter a name for this invitation'; end if;
 perform 1 from public.goodcompany_profiles p where p.user_id=uid and p.published for update;
 if not found then raise exception 'Save and publish your profile before inviting someone'; end if;
 select i.owner_id into existing_owner from goodcompany_private.creative_invites i where i.id=invite_id;
 if found then
   if existing_owner=uid then return invite_id; end if;
   raise exception 'Please create a new invitation';
 end if;
 if (select count(*) from goodcompany_private.creative_invites i where i.owner_id=uid and not i.revoked and (i.expires_at>now() or i.claimed_by is not null))>=50 then
   raise exception 'You have 50 active invitations. Cancel an old invitation first';
 end if;
 if (select count(*) from goodcompany_private.creative_invites i where i.owner_id=uid and i.created_at>now()-interval '1 day')>=100 then raise exception 'Please wait before creating more invitations'; end if;
 insert into goodcompany_private.creative_invites(id,owner_id,recipient_label) values(invite_id,uid,trim(recipient_label));
 return invite_id;
end $$;

-- Public lookup is intentionally token-gated, including for visitors before login.
-- It reveals no recipient label, email, draft profile or list of invitations.
create function goodcompany_private.lookup_invite(invite_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('inviter_name',trim(p.first_name||' '||p.last_name),
   'status',case when i.owner_id=auth.uid() then 'own' when i.claimed_by=auth.uid() then 'accepted' else 'pending' end)
 from goodcompany_private.creative_invites i join public.goodcompany_profiles p on p.user_id=i.owner_id and p.published
 where i.id=invite_id and not i.revoked and (
  (i.claimed_by is null and i.claimed_at is null and i.expires_at>now()) or i.claimed_by=auth.uid() or i.owner_id=auth.uid()
 )),jsonb_build_object('status','unavailable'));
$$;
create function goodcompany_private.claim_invite(invite_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in to accept your invitation'; end if;
 update goodcompany_private.creative_invites i set claimed_by=uid,claimed_at=coalesce(i.claimed_at,now())
 where i.id=invite_id and i.owner_id<>uid and not i.revoked
 and (i.claimed_by=uid or (i.claimed_by is null and i.claimed_at is null and i.expires_at>now()))
 and exists(select 1 from public.goodcompany_profiles p where p.user_id=i.owner_id and p.published);
 if not found then raise exception 'This invitation is no longer available'; end if;
end $$;
create function goodcompany_private.cancel_invite(invite_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to manage invitations'; end if;
 update goodcompany_private.creative_invites set revoked=true where id=invite_id and owner_id=auth.uid();
 if not found then raise exception 'Invitation not found'; end if;
end $$;
create function goodcompany_private.list_invites() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to see invitations'; end if;
 return coalesce((select jsonb_agg(row_to_json(r) order by r.created_at desc) from (
 select i.id,i.recipient_label,i.created_at,i.expires_at,
 case when p.published then p.user_id else null end as creative_id,
 case when p.published then p.first_name else null end as first_name,
 case when p.published then p.last_name else null end as last_name,
 case when p.published then 'ready' when i.claimed_at is not null then 'accepted' when i.expires_at<=now() then 'expired' else 'pending' end as status
 from goodcompany_private.creative_invites i left join public.goodcompany_profiles p on p.user_id=i.claimed_by
 where i.owner_id=auth.uid() and not i.revoked order by i.created_at desc limit 100
 ) r),'[]'::jsonb);
end $$;

create function public.goodcompany_create_invite(invite_id uuid, recipient_label text) returns uuid language sql security invoker set search_path='' as $$ select goodcompany_private.create_invite(invite_id,recipient_label) $$;
create function public.goodcompany_lookup_invite(invite_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select goodcompany_private.lookup_invite(invite_id) $$;
create function public.goodcompany_claim_invite(invite_id uuid) returns void language sql security invoker set search_path='' as $$ select goodcompany_private.claim_invite(invite_id) $$;
create function public.goodcompany_cancel_invite(invite_id uuid) returns void language sql security invoker set search_path='' as $$ select goodcompany_private.cancel_invite(invite_id) $$;
create function public.goodcompany_list_invites() returns jsonb language sql stable security invoker set search_path='' as $$ select goodcompany_private.list_invites() $$;
revoke all on function goodcompany_private.create_invite(uuid,text), goodcompany_private.lookup_invite(uuid), goodcompany_private.claim_invite(uuid), goodcompany_private.cancel_invite(uuid), goodcompany_private.list_invites() from public,anon,authenticated;
revoke all on function public.goodcompany_create_invite(uuid,text), public.goodcompany_lookup_invite(uuid), public.goodcompany_claim_invite(uuid), public.goodcompany_cancel_invite(uuid), public.goodcompany_list_invites() from public,anon,authenticated;
grant execute on function goodcompany_private.create_invite(uuid,text), goodcompany_private.claim_invite(uuid), goodcompany_private.cancel_invite(uuid), goodcompany_private.list_invites(), public.goodcompany_create_invite(uuid,text), public.goodcompany_claim_invite(uuid), public.goodcompany_cancel_invite(uuid), public.goodcompany_list_invites() to authenticated;
grant execute on function goodcompany_private.lookup_invite(uuid), public.goodcompany_lookup_invite(uuid) to anon,authenticated;
create policy "Invites use validated functions only" on goodcompany_private.creative_invites for all to anon, authenticated using (false) with check (false);
