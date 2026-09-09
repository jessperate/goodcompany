-- Every fixture and recommendation is rolled back; real profiles stay unchanged.
begin;
insert into auth.users(id,email) values
 ('20000000-0000-4000-8000-000000000001','invite-owner@example.test'),
 ('20000000-0000-4000-8000-000000000002','invite-recipient@example.test'),
 ('20000000-0000-4000-8000-000000000003','invite-other@example.test');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_save_profile('{"first_name":"Test","last_name":"Inviter","published":true}'::jsonb,'{}');
select public.goodcompany_create_invite('21000000-0000-4000-8000-000000000001','Private label');
select public.goodcompany_create_invite('21000000-0000-4000-8000-000000000001','Retry label');
do $$ begin
 assert jsonb_array_length(public.goodcompany_list_invites())=1,'Create retry must be idempotent';
 assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000001')->>'status'='own';
 begin perform public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000001'); raise exception 'Self claim was allowed'; exception when raise_exception then assert sqlerrm='This invitation is no longer available'; end;
 begin perform 1 from goodcompany_private.creative_invites; raise exception 'Direct table access allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ declare result jsonb; begin
 result:=public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000001');
 assert result->>'inviter_name'='Test Inviter'; assert result->>'status'='pending';
 assert not result ? 'recipient_label'; assert not result ? 'claimed_by';
 assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000099')->>'status'='unavailable';
 begin perform public.goodcompany_list_invites(); raise exception 'Anon list allowed'; exception when insufficient_privilege then null; end;
 begin perform public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000001'); raise exception 'Anon claim allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000001');
select public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000001');
select public.goodcompany_save_profile('{"first_name":"Private","last_name":"Recipient","published":false}'::jsonb,'{}');
do $$ begin
 assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000001')->>'status'='accepted';
 assert public.goodcompany_list_invites()='[]'::jsonb,'Recipient can read inviter list';
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000001')->>'status'='unavailable';
 begin perform public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000001'); raise exception 'Second recipient allowed'; exception when raise_exception then assert sqlerrm='This invitation is no longer available'; end;
 begin perform public.goodcompany_cancel_invite('21000000-0000-4000-8000-000000000001'); raise exception 'Other owner cancel allowed'; exception when raise_exception then assert sqlerrm='Invitation not found'; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ declare result jsonb; begin
 result:=public.goodcompany_list_invites()->0;
 assert result->>'status'='accepted'; assert result->>'first_name' is null; assert result->>'creative_id' is null,'Private recipient leaked';
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_save_profile('{"first_name":"Published","last_name":"Recipient","published":true}'::jsonb,'{}');
reset role;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.goodcompany_list_invites()->0->>'status'='ready';
 assert public.goodcompany_list_invites()->0->>'first_name'='Published';
 assert not exists(select 1 from public.goodcompany_creative_recommendations where owner_id=auth.uid()),'Invite auto-recommended';
end $$;
select public.goodcompany_save_profile('{"first_name":"Test","last_name":"Inviter","published":true}'::jsonb,array['20000000-0000-4000-8000-000000000002'::uuid]);
select public.goodcompany_cancel_invite('21000000-0000-4000-8000-000000000001');
do $$ begin
 assert public.goodcompany_list_invites()='[]'::jsonb;
 assert exists(select 1 from public.goodcompany_creative_recommendations where owner_id=auth.uid()),'Cancellation removed recommendation';
end $$;
select public.goodcompany_create_invite('21000000-0000-4000-8000-000000000002','Expires');
select public.goodcompany_save_profile('{"first_name":"Test","last_name":"Inviter","published":false}'::jsonb,'{}');
do $$ begin
 begin perform public.goodcompany_create_invite('21000000-0000-4000-8000-000000000003','No private inviter'); raise exception 'Private inviter allowed'; exception when raise_exception then assert sqlerrm='Save and publish your profile before inviting someone'; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000002')->>'status'='unavailable','Private inviter name leaked'; end $$;
reset role;
update public.goodcompany_profiles set published=true where user_id='20000000-0000-4000-8000-000000000001';
update goodcompany_private.creative_invites set expires_at=now()-interval '1 second' where id='21000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.goodcompany_lookup_invite('21000000-0000-4000-8000-000000000002')->>'status'='unavailable';
 begin perform public.goodcompany_claim_invite('21000000-0000-4000-8000-000000000002'); raise exception 'Expired claim allowed'; exception when raise_exception then assert sqlerrm='This invitation is no longer available'; end;
end $$;
reset role;
rollback;
select 'Invite access, privacy, idempotency, claim, publication, cancellation and expiry checks passed' as result;
