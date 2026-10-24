-- PLEDGE INVEST financial integrity schema.
-- This migration was applied to Supabase project xypcqtqmekrjgytivmsm.
create table if not exists public.pledge_financial_ledger (
 id uuid primary key default gen_random_uuid(), user_id text not null, operation_key text not null,
 operation_type text not null check (operation_type in ('investment','withdrawal_reserve','withdrawal_release','withdrawal_paid','deposit_credit','admin_adjustment')),
 amount numeric(20,2) not null check (amount>0), currency text not null default 'USD' check(currency='USD'),
 balance_before numeric(20,2) not null, balance_after numeric(20,2) not null, status text not null default 'posted',
 reference text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(user_id,operation_key)
);
create index if not exists pledge_financial_ledger_user_created_idx on public.pledge_financial_ledger(user_id,created_at desc);
create table if not exists public.pledge_operation_keys (
 user_id text not null, idempotency_key text not null, operation_type text not null, result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), primary key(user_id,idempotency_key)
);
alter table public.pledge_financial_ledger enable row level security;
alter table public.pledge_operation_keys enable row level security;
revoke all on public.pledge_financial_ledger from anon,authenticated;
revoke all on public.pledge_operation_keys from anon,authenticated;
grant select,insert,update on public.pledge_financial_ledger to service_role;
grant select,insert,update on public.pledge_operation_keys to service_role;

create or replace function public.pledge_financial_operation(p_user_id text,p_operation_type text,p_amount numeric,p_idempotency_key text,p_reference text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_account public.pledge_records%rowtype; v_txid uuid; v_record jsonb; v_before numeric(20,2); v_after numeric(20,2); v_existing public.pledge_operation_keys%rowtype; v_result jsonb; v_now bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if p_user_id is null or length(p_user_id)=0 then raise exception 'USER_REQUIRED'; end if;
 if p_operation_type not in ('investment','withdrawal_reserve') then raise exception 'INVALID_OPERATION'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'INVALID_AMOUNT'; end if;
 if p_idempotency_key is null or length(trim(p_idempotency_key))<8 or length(p_idempotency_key)>200 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
 select * into v_existing from public.pledge_operation_keys where user_id=p_user_id and idempotency_key=p_idempotency_key;
 if found then if v_existing.operation_type<>p_operation_type then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if; return v_existing.result||jsonb_build_object('idempotentReplay',true); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id,0));
 select * into v_account from public.pledge_records where table_name='pledge_account_'||p_user_id order by created_at asc limit 1 for update;
 if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
 v_record:=v_account.record; v_before:=coalesce((v_record->>'balance')::numeric,0);
 if v_before<p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
 v_after:=v_before-p_amount;
 if p_operation_type='investment' then v_record:=jsonb_set(jsonb_set(v_record,'{balance}',to_jsonb(v_after),true),'{invested}',to_jsonb(coalesce((v_record->>'invested')::numeric,0)+p_amount),true);
 else v_record:=jsonb_set(v_record,'{balance}',to_jsonb(v_after),true); end if;
 v_record:=jsonb_set(v_record,'{updated_at}',to_jsonb(v_now),true);
 update public.pledge_records set record=v_record,updated_at=now() where id=v_account.id;
 insert into public.pledge_records(table_name,record) values('pledge_transactions_'||p_user_id,jsonb_build_object('type',case when p_operation_type='investment' then 'Investment' else 'Withdrawal' end,'amount',p_amount,'status',case when p_operation_type='investment' then 'Active' else 'Pending' end,'reference',coalesce(p_reference,p_operation_type),'operation_key',p_idempotency_key,'currency','USD','created_at',v_now,'metadata',coalesce(p_metadata,'{}'::jsonb))) returning id into v_txid;
 insert into public.pledge_financial_ledger(user_id,operation_key,operation_type,amount,balance_before,balance_after,status,reference,metadata) values(p_user_id,p_idempotency_key,p_operation_type,p_amount,v_before,v_after,'posted',p_reference,coalesce(p_metadata,'{}'::jsonb));
 v_result:=jsonb_build_object('success',true,'transactionId',v_txid,'balance',v_after,'amount',p_amount,'currency','USD','status',case when p_operation_type='investment' then 'Active' else 'Pending' end);
 insert into public.pledge_operation_keys(user_id,idempotency_key,operation_type,result) values(p_user_id,p_idempotency_key,p_operation_type,v_result); return v_result;
exception when unique_violation then select * into v_existing from public.pledge_operation_keys where user_id=p_user_id and idempotency_key=p_idempotency_key; if found then return v_existing.result||jsonb_build_object('idempotentReplay',true); end if; raise;
end; $$;
create or replace function public.pledge_withdrawal_decision(p_user_id text,p_operation_key text,p_decision text,p_admin_email text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_tx public.pledge_records%rowtype; v_account public.pledge_records%rowtype; v_rec jsonb; v_amt numeric(20,2); v_before numeric(20,2); v_after numeric(20,2); v_op_key text; v_existing public.pledge_operation_keys%rowtype; v_result jsonb; v_now bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if p_decision not in ('approved','rejected','cancelled') then raise exception 'INVALID_DECISION'; end if;
 if p_admin_email is null or lower(p_admin_email) not in ('pledgeinvest4@gmail.com') then raise exception 'ADMIN_FORBIDDEN'; end if;
 v_op_key:='withdrawal_decision:'||p_operation_key||':'||p_decision;
 select * into v_existing from public.pledge_operation_keys where user_id=p_user_id and idempotency_key=v_op_key;
 if found then return v_existing.result||jsonb_build_object('idempotentReplay',true); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id,0));
 select * into v_tx from public.pledge_records where table_name='pledge_transactions_'||p_user_id and record->>'operation_key'=p_operation_key and record->>'type'='Withdrawal' order by created_at desc limit 1 for update;
 if not found then raise exception 'WITHDRAWAL_NOT_FOUND'; end if;
 if coalesce(v_tx.record->>'status','')<>'Pending' then raise exception 'WITHDRAWAL_NOT_PENDING'; end if;
 v_amt:=(v_tx.record->>'amount')::numeric;
 select * into v_account from public.pledge_records where table_name='pledge_account_'||p_user_id order by created_at asc limit 1 for update;
 if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
 v_rec:=v_account.record; v_before:=coalesce((v_rec->>'balance')::numeric,0); v_after:=v_before;
 if p_decision in ('rejected','cancelled') then v_after:=v_before+v_amt; v_rec:=jsonb_set(v_rec,'{balance}',to_jsonb(v_after),true); v_rec:=jsonb_set(v_rec,'{updated_at}',to_jsonb(v_now),true); update public.pledge_records set record=v_rec,updated_at=now() where id=v_account.id; end if;
 update public.pledge_records set record=record||jsonb_build_object('status',case when p_decision='approved' then 'Approved' when p_decision='rejected' then 'Rejected' else 'Cancelled' end,'reviewed_at',v_now,'reviewed_by',p_admin_email,'review_reason',coalesce(p_reason,'')),updated_at=now() where id=v_tx.id;
 if p_decision in ('rejected','cancelled') then insert into public.pledge_financial_ledger(user_id,operation_key,operation_type,amount,balance_before,balance_after,status,reference,metadata) values(p_user_id,v_op_key,'withdrawal_release',v_amt,v_before,v_after,'posted',p_operation_key,jsonb_build_object('decision',p_decision,'admin',p_admin_email,'reason',coalesce(p_reason,''))); end if;
 v_result:=jsonb_build_object('success',true,'decision',p_decision,'amount',v_amt,'balance',v_after,'currency','USD');
 insert into public.pledge_operation_keys(user_id,idempotency_key,operation_type,result) values(p_user_id,v_op_key,'withdrawal_decision',v_result);
 insert into public.pledge_records(table_name,record) values('pledge_audit',jsonb_build_object('action','Withdrawal '||p_decision,'detail',p_user_id||' amount '||v_amt||' by '||p_admin_email||' reason '||coalesce(p_reason,''),'created_at',v_now)); return v_result;
end; $$;
revoke all on function public.pledge_financial_operation(text,text,numeric,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.pledge_withdrawal_decision(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.pledge_financial_operation(text,text,numeric,text,text,jsonb) to service_role;
grant execute on function public.pledge_withdrawal_decision(text,text,text,text,text) to service_role;

create table if not exists public.pledge_investment_plans(id text primary key,name text not null unique,min_amount numeric(20,2) not null check(min_amount>0),max_amount numeric(20,2) not null check(max_amount>=min_amount),advertised_rate numeric(9,4) not null check(advertised_rate>=0),duration_days integer not null check(duration_days>0),active boolean not null default true,terms jsonb not null default '{}'::jsonb,updated_by text,updated_at timestamptz not null default now());
alter table public.pledge_investment_plans enable row level security;
revoke all on public.pledge_investment_plans from anon,authenticated;
grant select,insert,update on public.pledge_investment_plans to service_role;
insert into public.pledge_investment_plans(id,name,min_amount,max_amount,advertised_rate,duration_days,active,terms) values
('starter','Starter',50,499,3.5,30,true,'{"source":"existing frontend plan configuration","return_label":"3.5% advertised rate; not guaranteed"}'::jsonb),
('growth','Growth',500,4999,6.5,60,true,'{"source":"existing frontend plan configuration","return_label":"6.5% advertised rate; not guaranteed"}'::jsonb),
('premium','Premium',5000,25000,10,90,true,'{"source":"existing frontend plan configuration","return_label":"10% advertised rate; not guaranteed"}'::jsonb) on conflict(id) do nothing;
create or replace function public.pledge_deposit_approve(p_deposit_id uuid,p_admin_email text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.pledge_records%rowtype; u public.pledge_records%rowtype; a public.pledge_records%rowtype; ar jsonb; ur jsonb; n numeric(20,2); before_balance numeric(20,2); after_balance numeric(20,2); uid text; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint; op_key text; result jsonb;
begin
 if p_admin_email is null or lower(p_admin_email) not in ('pledgeinvest4@gmail.com') then raise exception 'ADMIN_FORBIDDEN'; end if;
 select * into d from public.pledge_records where table_name='pledge_deposit_requests' and id=p_deposit_id for update;
 if not found or d.record->>'status'<>'Pending' then raise exception 'PENDING_DEPOSIT_NOT_FOUND'; end if;
 n:=(d.record->>'amount')::numeric; if n<=0 or n<>round(n,2) then raise exception 'INVALID_AMOUNT'; end if;
 select * into u from public.pledge_records where table_name='pledge_investors' and lower(record->>'email')=lower(d.record->>'email') order by created_at asc limit 1 for update;
 if not found then raise exception 'INVESTOR_NOT_FOUND'; end if;
 uid:=coalesce(u.record->>'user_id','');
 if uid<>'' then perform pg_advisory_xact_lock(hashtextextended(uid,0)); select * into a from public.pledge_records where table_name='pledge_account_'||uid order by created_at asc limit 1 for update;
  if found then ar:=a.record; before_balance:=coalesce((ar->>'balance')::numeric,0); after_balance:=before_balance+n; ar:=jsonb_set(ar,'{balance}',to_jsonb(after_balance),true); ar:=jsonb_set(ar,'{updated_at}',to_jsonb(now_ms),true); update public.pledge_records set record=ar,updated_at=now() where id=a.id; op_key:='deposit:'||p_deposit_id::text;
   insert into public.pledge_financial_ledger(user_id,operation_key,operation_type,amount,balance_before,balance_after,status,reference,metadata) values(uid,op_key,'deposit_credit',n,before_balance,after_balance,'posted',coalesce(d.record->>'tx_hash',p_deposit_id::text),jsonb_build_object('admin',p_admin_email,'deposit_id',p_deposit_id));
   insert into public.pledge_records(table_name,record) values('pledge_transactions_'||uid,jsonb_build_object('type','Deposit','amount',n,'status','Completed','reference',coalesce(d.record->>'tx_hash',p_deposit_id::text),'operation_key',op_key,'currency','USD','created_at',now_ms));
  else before_balance:=coalesce((u.record->>'balance')::numeric,0); after_balance:=before_balance+n; end if;
 else before_balance:=coalesce((u.record->>'balance')::numeric,0); after_balance:=before_balance+n; end if;
 ur:=jsonb_set(u.record,'{balance}',to_jsonb(after_balance),true); ur:=jsonb_set(ur,'{updated_at}',to_jsonb(now_ms),true); update public.pledge_records set record=ur,updated_at=now() where id=u.id;
 update public.pledge_records set record=record||jsonb_build_object('status','Approved','reviewed_at',now_ms,'reviewed_by',p_admin_email),updated_at=now() where id=d.id;
 insert into public.pledge_records(table_name,record) values('pledge_transactions',jsonb_build_object('investor_id',u.record->>'investor_id','user_id',uid,'type','Deposit','amount',n,'status','Completed','reference',coalesce(d.record->>'tx_hash',p_deposit_id::text),'operation_key','deposit:'||p_deposit_id::text,'currency','USD','created_at',now_ms));
 insert into public.pledge_records(table_name,record) values('pledge_audit',jsonb_build_object('action','Deposit approved','detail',coalesce(u.record->>'investor_id',uid)||' +'||n||' by '||p_admin_email,'created_at',now_ms));
 return jsonb_build_object('success',true,'user_id',uid,'balance',after_balance,'amount',n,'currency','USD','deposit_id',p_deposit_id);
end; $$;
revoke all on function public.pledge_deposit_approve(uuid,text) from public,anon,authenticated;
grant execute on function public.pledge_deposit_approve(uuid,text) to service_role;
create or replace function public.pledge_sync_investor_mirror()
returns trigger language plpgsql security definer set search_path=public as $$
declare uid text; rec jsonb; investor public.pledge_records%rowtype;
begin
 if new.table_name not like 'pledge_account_%' then return new; end if; uid:=new.record->>'user_id'; if uid is null or uid='' then return new; end if;
 select * into investor from public.pledge_records where table_name='pledge_investors' and record->>'user_id'=uid order by created_at asc limit 1 for update;
 if not found then return new; end if; rec:=investor.record;
 rec:=jsonb_set(rec,'{balance}',to_jsonb(coalesce((new.record->>'balance')::numeric,0)),true);
 rec:=jsonb_set(rec,'{invested}',to_jsonb(coalesce((new.record->>'invested')::numeric,0)),true);
 rec:=jsonb_set(rec,'{profit_earned}',to_jsonb(coalesce((new.record->>'profit_earned')::numeric,0)),true);
 rec:=jsonb_set(rec,'{updated_at}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)::bigint),true);
 update public.pledge_records set record=rec,updated_at=now() where id=investor.id; return new;
end; $$;
drop trigger if exists pledge_sync_investor_mirror_trigger on public.pledge_records;
create trigger pledge_sync_investor_mirror_trigger after update of record on public.pledge_records for each row when (new.table_name like 'pledge_account_%') execute function public.pledge_sync_investor_mirror();
