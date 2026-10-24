-- Safe live-database smoke test for atomic wallet operations.
-- All fixtures and ledger entries are rolled back at the end.
begin;
do $$
declare uid text:='__pledge_test_'||replace(gen_random_uuid()::text,'-',''); op jsonb; replay jsonb; decision jsonb; row_record jsonb;
begin
 insert into public.pledge_records(table_name,record) values('pledge_account_'||uid,jsonb_build_object('user_id',uid,'balance',100,'invested',0,'profit_earned',0,'status','active','created_at',0));
 op:=public.pledge_financial_operation(uid,'investment',25,'test-invest-key-0001','test plan','{}'::jsonb);
 replay:=public.pledge_financial_operation(uid,'investment',25,'test-invest-key-0001','test plan','{}'::jsonb);
 if not coalesce((replay->>'idempotentReplay')::boolean,false) then raise exception 'TEST_FAILED_IDEMPOTENT_REPLAY'; end if;
 select record into row_record from public.pledge_records where table_name='pledge_account_'||uid limit 1;
 if (row_record->>'balance')::numeric<>75 or (row_record->>'invested')::numeric<>25 then raise exception 'TEST_FAILED_INVESTMENT_BALANCE'; end if;
 op:=public.pledge_financial_operation(uid,'withdrawal_reserve',10,'test-withdraw-key-0002','test payout','{}'::jsonb);
 select record into row_record from public.pledge_records where table_name='pledge_account_'||uid limit 1;
 if (row_record->>'balance')::numeric<>65 then raise exception 'TEST_FAILED_WITHDRAWAL_RESERVATION'; end if;
 decision:=public.pledge_withdrawal_decision(uid,'test-withdraw-key-0002','rejected','pledgeinvest4@gmail.com','automated rollback test');
 select record into row_record from public.pledge_records where table_name='pledge_account_'||uid limit 1;
 if (row_record->>'balance')::numeric<>75 then raise exception 'TEST_FAILED_WITHDRAWAL_RELEASE'; end if;
 decision:=public.pledge_withdrawal_decision(uid,'test-withdraw-key-0002','rejected','pledgeinvest4@gmail.com','automated rollback test');
 select record into row_record from public.pledge_records where table_name='pledge_account_'||uid limit 1;
 if (row_record->>'balance')::numeric<>75 then raise exception 'TEST_FAILED_DUPLICATE_REFUND'; end if;
 begin
  perform public.pledge_financial_operation(uid,'investment',999,'test-insufficient-key-0003','test','{}'::jsonb);
  raise exception 'TEST_FAILED_INSUFFICIENT_BALANCE_NOT_BLOCKED';
 exception when others then if sqlerrm='TEST_FAILED_INSUFFICIENT_BALANCE_NOT_BLOCKED' then raise; end if; end;
end $$;
rollback;
