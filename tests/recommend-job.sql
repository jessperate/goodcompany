begin;
insert into auth.users(id,email) values ('22000000-0000-4000-8000-000000000001','recommend-test@example.test');
select set_config('request.jwt.claims','{"sub":"22000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ declare result text[]; i integer; begin
 result:=public.goodcompany_recommend_job('job-one'); assert cardinality(result)=1;
 assert (select not published from public.goodcompany_profiles where user_id=auth.uid());
 update public.goodcompany_profiles set bio='Keep this biography', first_name='Test' where user_id=auth.uid();
 result:=public.goodcompany_recommend_job('job-one'); assert cardinality(result)=1;
 for i in 2..10 loop result:=public.goodcompany_recommend_job('job-'||i); end loop;
 assert cardinality(result)=10;
 begin perform public.goodcompany_recommend_job('job-eleven'); raise exception 'Cap failed'; exception when raise_exception then assert sqlerrm='Your top ten is full. Edit your profile to make room.'; end;
 assert (select bio='Keep this biography' and first_name='Test' and cardinality(recommended_jobs)=10 from public.goodcompany_profiles where user_id=auth.uid());
 begin perform public.goodcompany_recommend_job('<invalid>'); raise exception 'Validation failed'; exception when raise_exception then assert sqlerrm='Invalid job'; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.goodcompany_recommend_job('job-one'); raise exception 'Anonymous write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Recommendation cap, idempotency, private default, field preservation and anonymous denial passed' as result;
