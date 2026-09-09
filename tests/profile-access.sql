-- All fixtures are rolled back. No real accounts or profiles are changed.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','profile-test-owner@example.test'),
 ('10000000-0000-4000-8000-000000000002','profile-test-creative@example.test'),
 ('10000000-0000-4000-8000-000000000003','profile-test-private@example.test');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_save_profile('{"first_name":"Test","last_name":"Creative","published":true}'::jsonb,'{}');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_save_profile('{"first_name":"Private","last_name":"Creative"}'::jsonb,'{}');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_save_profile('{"first_name":"Test","last_name":"Owner","bio":"Original bio","links":{"website":"https://example.com"},"work_history":[{"company":"Studio","role":"Designer","years":"2020–2025"}],"recommended_jobs":["cloudflare-motion"]}'::jsonb,array['10000000-0000-4000-8000-000000000002'::uuid]);
do $$
declare n integer;
begin
 assert (select bio='Original bio' and work_history->0->>'company'='Studio' from public.goodcompany_profiles where user_id=auth.uid()), 'Profile round trip failed';
 assert (select count(*)=1 from public.goodcompany_creative_recommendations where owner_id=auth.uid()), 'Recommendation missing';
 assert (select count(*)=0 from public.goodcompany_profiles where user_id='10000000-0000-4000-8000-000000000003'), 'Private profile leaked';
 update public.goodcompany_profiles set bio='Unauthorized' where user_id='10000000-0000-4000-8000-000000000002';
 get diagnostics n = row_count; assert n=0, 'Other profile writable';
 begin
  perform public.goodcompany_save_profile('{"first_name":"Changed","last_name":"Owner","bio":"Should roll back"}'::jsonb,array['10000000-0000-4000-8000-000000000003'::uuid]);
  raise exception 'FAIL: Private creative allowed';
 exception when insufficient_privilege then null; end;
 assert (select bio='Original bio' from public.goodcompany_profiles where user_id=auth.uid()), 'Atomic save did not roll back';
 begin
  perform public.goodcompany_save_profile('{"first_name":"Test","last_name":"Owner"}'::jsonb,array_fill('10000000-0000-4000-8000-000000000002'::uuid,array[11]));
  raise exception 'FAIL: More than 10 creatives allowed';
 exception when raise_exception then if sqlerrm <> 'Choose up to 10 creatives' then raise; end if; end;
 begin
  perform public.goodcompany_save_profile(jsonb_build_object('first_name','Test','last_name','Owner','recommended_jobs',to_jsonb(array_fill('job'::text,array[11]))),'{}');
  raise exception 'FAIL: More than 10 jobs allowed';
 exception when check_violation then null; end;
 begin
  perform public.goodcompany_save_profile('{"first_name":"Test","last_name":"Owner"}',array[auth.uid()]);
  raise exception 'FAIL: Self recommendation allowed';
 exception when check_violation or insufficient_privilege then null; end;
end $$;
insert into storage.objects(bucket_id,name) values ('goodcompany-headshots','10000000-0000-4000-8000-000000000001/test.webp');
do $$ begin
 assert (select count(*)=1 from storage.objects where bucket_id='goodcompany-headshots' and name='10000000-0000-4000-8000-000000000001/test.webp'), 'Owner cannot read headshot';
 begin
  insert into storage.objects(bucket_id,name) values ('goodcompany-headshots','10000000-0000-4000-8000-000000000002/forbidden.webp');
  raise exception 'FAIL: Other avatar folder writable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 assert (select count(*)=1 from public.goodcompany_profiles where user_id::text like '10000000-0000-4000-8000-00000000000%'), 'Anon visibility incorrect';
 assert (select count(*)=1 from public.goodcompany_find_creatives('Test Creative')), 'Name search failed';
 assert (select count(*)=0 from public.goodcompany_find_creatives('Private Creative')), 'Private search leak';
 assert (select count(*)=0 from storage.objects where bucket_id='goodcompany-headshots' and name='10000000-0000-4000-8000-000000000001/test.webp'), 'Private headshot leaked';
 assert not has_table_privilege('anon','public.goodcompany_saved_jobs','select'), 'Private pins exposed';
 assert not has_function_privilege('anon','public.goodcompany_save_profile(jsonb,uuid[])','execute'), 'Anon may save profiles';
end $$;
reset role;
rollback;
select 'PASS: profile saves, atomic rollback, recommendation limits, ownership, private profiles, private headshots, search and private pins' as result;
