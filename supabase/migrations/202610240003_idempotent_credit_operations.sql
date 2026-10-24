-- Idempotent, atomic credits for referral rewards, daily profit and administrator credits.
alter table public.pledge_financial_ledger drop constraint if exists pledge_financial_ledger_operation_type_check;
alter table public.pledge_financial_ledger add constraint pledge_financial_ledger_operation_type_check check(operation_type in ('investment','withdrawal_reserve','withdrawal_release','withdrawal_paid','deposit_credit','admin_adjustment','referral_reward','daily_profit'));
create or replace function public.pledge_credit_operation(p_user_id text,p_amount numeric,p_idempotency_key text,p_transaction_type text,p_reference text default null,p_metadata jsonb default '{}'::jsonb,p_admin_email text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.pledge_records%rowtype; rec jsonb; before_balance numeric(20,2); after_balance numeric(20,2); existing public.pledge_operation_keys%rowtype; result jsonb; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint; ledger_type text;
begin
 if p_user_id is null or p_user_id='' then raise exception 'USER_REQUIRED'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'INVALID_AMOUNT'; end if;
 if p_idempotency_key is null or length(trim(p_idempotency_key))<8 or length(p_idempotency_key)>200 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
 if p_transaction_type not in ('Referral Bonus','Daily Profit','Admin Credit') then raise exception 'INVALID_CREDIT_TYPE'; end if;
 if p_transaction_type='Admin Credit' and (p_admin_email is null or lower(p_admin_email) not in ('pledgeinvest4@gmail.com')) then raise exception 'ADMIN_FORBIDDEN'; end if;
 select * into existing from public.pledge_operation_keys where user_id=p_user_id and idempotency_key=p_idempotency_key;
 if found then if existing.operation_type<>p_transaction_type then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if; return existing.result||jsonb_build_object('idempotentReplay',true); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id,0));
 select * into a from public.pledge_records where table_name='pledge_account_'||p_user_id order by created_at asc limit 1 for update;
 if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
 rec:=a.record; before_balance:=coalesce((rec->>'balance')::numeric,0); after_balance:=before_balance+p_amount;
 rec:=jsonb_set(rec,'{balance}',to_jsonb(after_balance),true);
 if p_transaction_type='Daily Profit' then rec:=jsonb_set(rec,'{profit_earned}',to_jsonb(coalesce((rec->>'profit_earned')::numeric,0)+p_amount),true); end if;
 rec:=jsonb_set(rec,'{updated_at}',to_jsonb(now_ms),true);
 update public.pledge_records set record=rec,updated_at=now() where id=a.id;
 insert into public.pledge_records(table_name,record) values('pledge_transactions_'||p_user_id,jsonb_build_object('type',p_transaction_type,'amount',p_amount,'status','Posted','reference',coalesce(p_reference,p_transaction_type),'operation_key',p_idempotency_key,'currency','USD','created_at',now_ms,'metadata',coalesce(p_metadata,'{}'::jsonb)));
 ledger_type:=case when p_transaction_type='Referral Bonus' then 'referral_reward' when p_transaction_type='Daily Profit' then 'daily_profit' else 'admin_adjustment' end;
 insert into public.pledge_financial_ledger(user_id,operation_key,operation_type,amount,balance_before,balance_after,status,reference,metadata) values(p_user_id,p_idempotency_key,ledger_type,p_amount,before_balance,after_balance,'posted',p_reference,coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('transaction_type',p_transaction_type,'admin_email',p_admin_email));
 result:=jsonb_build_object('success',true,'balance',after_balance,'amount',p_amount,'currency','USD','type',p_transaction_type);
 insert into public.pledge_operation_keys(user_id,idempotency_key,operation_type,result) values(p_user_id,p_idempotency_key,p_transaction_type,result); return result;
exception when unique_violation then select * into existing from public.pledge_operation_keys where user_id=p_user_id and idempotency_key=p_idempotency_key; if found then return existing.result||jsonb_build_object('idempotentReplay',true); end if; raise;
end; $$;
revoke all on function public.pledge_credit_operation(text,numeric,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.pledge_credit_operation(text,numeric,text,text,text,jsonb,text) to service_role;
