begin;
insert into auth.users(id,email) values('30000000-0000-4000-8000-000000000001','updates-one@example.test'),('30000000-0000-4000-8000-000000000002','updates-two@example.test');
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select public.goodcompany_acknowledge_updates(2);
select public.goodcompany_acknowledge_updates(1);
do $$ begin
 assert (select last_seen_version=2 from public.goodcompany_update_receipts where user_id=auth.uid()),'Old tab moved receipt backwards';
 begin update public.goodcompany_update_receipts set user_id='30000000-0000-4000-8000-000000000002' where user_id=auth.uid();raise exception 'Owner transfer allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n integer; begin
 assert (select count(*)=0 from public.goodcompany_update_receipts),'Other receipt exposed';
 update public.goodcompany_update_receipts set last_seen_version=3 where user_id='30000000-0000-4000-8000-000000000001';get diagnostics n=row_count;assert n=0,'Other receipt changed';
 begin insert into public.goodcompany_update_receipts(user_id,last_seen_version) values('30000000-0000-4000-8000-000000000001',5);raise exception 'Other owner insert allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 assert not has_table_privilege('anon','public.goodcompany_update_receipts','select'),'Anonymous receipts readable';
 assert not has_function_privilege('anon','public.goodcompany_acknowledge_updates(integer)','execute'),'Anonymous receipt write allowed';
end $$;
reset role;
rollback;
