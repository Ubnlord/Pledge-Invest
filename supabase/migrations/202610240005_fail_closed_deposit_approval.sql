-- Fail closed when a linked investor has no wallet account or is inactive.
-- This prevents approving a deposit while leaving the authenticated wallet unchanged.
create or replace function public.pledge_deposit_approve(p_deposit_id uuid,p_admin_email text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 d public.pledge_records%rowtype;
 u public.pledge_records%rowtype;
 a public.pledge_records%rowtype;
 ar jsonb;
 ur jsonb;
 n numeric(20,2);
 before_balance numeric(20,2);
 after_balance numeric(20,2);
 uid text;
 now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 op_key text;
begin
 if p_admin_email is null or lower(p_admin_email) not in ('pledgeinvest4@gmail.com') then
  raise exception 'ADMIN_FORBIDDEN';
 end if;

 select * into d
 from public.pledge_records
 where table_name='pledge_deposit_requests' and id=p_deposit_id
 for update;
 if not found or d.record->>'status'<>'Pending' then
  raise exception 'PENDING_DEPOSIT_NOT_FOUND';
 end if;

 n:=(d.record->>'amount')::numeric;
 if n<=0 or n<>round(n,2) then raise exception 'INVALID_AMOUNT'; end if;

 select * into u
 from public.pledge_records
 where table_name='pledge_investors'
   and lower(record->>'email')=lower(d.record->>'email')
 order by created_at asc limit 1 for update;
 if not found then raise exception 'INVESTOR_NOT_FOUND'; end if;
 if lower(coalesce(u.record->>'status','active'))<>'active' then
  raise exception 'INVESTOR_INACTIVE';
 end if;

 uid:=coalesce(u.record->>'user_id','');
 if uid<>'' then
  perform pg_advisory_xact_lock(hashtextextended(uid,0));
  select * into a
  from public.pledge_records
  where table_name='pledge_account_'||uid
  order by created_at asc limit 1 for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;

  if lower(coalesce(a.record->>'status','active'))<>'active' then
   raise exception 'INVESTOR_INACTIVE';
  end if;

  ar:=a.record;
  before_balance:=coalesce((ar->>'balance')::numeric,0);
  after_balance:=before_balance+n;
  ar:=jsonb_set(ar,'{balance}',to_jsonb(after_balance),true);
  ar:=jsonb_set(ar,'{updated_at}',to_jsonb(now_ms),true);
  update public.pledge_records set record=ar,updated_at=now() where id=a.id;

  op_key:='deposit:'||p_deposit_id::text;
  insert into public.pledge_financial_ledger
   (user_id,operation_key,operation_type,amount,balance_before,balance_after,status,reference,metadata)
  values(uid,op_key,'deposit_credit',n,before_balance,after_balance,'posted',
   coalesce(d.record->>'tx_hash',p_deposit_id::text),
   jsonb_build_object('admin',p_admin_email,'deposit_id',p_deposit_id));

  insert into public.pledge_records(table_name,record)
  values('pledge_transactions_'||uid,jsonb_build_object(
   'type','Deposit','amount',n,'status','Completed',
   'reference',coalesce(d.record->>'tx_hash',p_deposit_id::text),
   'operation_key',op_key,'currency','USD','created_at',now_ms));
 else
  -- Legacy records without an authenticated wallet remain mirror-only.
  before_balance:=coalesce((u.record->>'balance')::numeric,0);
  after_balance:=before_balance+n;
 end if;

 ur:=jsonb_set(u.record,'{balance}',to_jsonb(after_balance),true);
 ur:=jsonb_set(ur,'{updated_at}',to_jsonb(now_ms),true);
 update public.pledge_records set record=ur,updated_at=now() where id=u.id;

 update public.pledge_records
 set record=record||jsonb_build_object('status','Approved','reviewed_at',now_ms,'reviewed_by',p_admin_email),
     updated_at=now()
 where id=d.id;

 insert into public.pledge_records(table_name,record)
 values('pledge_transactions',jsonb_build_object(
  'investor_id',u.record->>'investor_id','user_id',uid,'type','Deposit',
  'amount',n,'status','Completed',
  'reference',coalesce(d.record->>'tx_hash',p_deposit_id::text),
  'operation_key','deposit:'||p_deposit_id::text,'currency','USD','created_at',now_ms));

 insert into public.pledge_records(table_name,record)
 values('pledge_audit',jsonb_build_object(
  'action','Deposit approved','detail',coalesce(u.record->>'investor_id',uid)||' +'||n||' by '||p_admin_email,
  'created_at',now_ms));

 return jsonb_build_object('success',true,'user_id',uid,'balance',after_balance,
  'amount',n,'currency','USD','deposit_id',p_deposit_id);
end; $$;

revoke all on function public.pledge_deposit_approve(uuid,text) from public,anon,authenticated;
grant execute on function public.pledge_deposit_approve(uuid,text) to service_role;
