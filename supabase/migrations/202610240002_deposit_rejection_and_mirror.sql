-- Applied to the linked production Supabase project after 202610240001_financial_integrity.sql.
-- Adds transactional deposit rejection and keeps the existing investor summary mirror aligned.
create or replace function public.pledge_deposit_reject(p_deposit_id uuid,p_admin_email text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.pledge_records%rowtype; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if p_admin_email is null or lower(p_admin_email) not in ('pledgeinvest4@gmail.com') then raise exception 'ADMIN_FORBIDDEN'; end if;
 select * into d from public.pledge_records where table_name='pledge_deposit_requests' and id=p_deposit_id for update;
 if not found or d.record->>'status'<>'Pending' then raise exception 'PENDING_DEPOSIT_NOT_FOUND'; end if;
 update public.pledge_records set record=record||jsonb_build_object('status','Rejected','reviewed_at',now_ms,'reviewed_by',p_admin_email,'review_reason',coalesce(p_reason,'')),updated_at=now() where id=d.id;
 insert into public.pledge_records(table_name,record) values('pledge_audit',jsonb_build_object('action','Deposit rejected','detail',coalesce(d.record->>'email','')||' amount '||coalesce(d.record->>'amount','')||' by '||p_admin_email||' reason '||coalesce(p_reason,''),'created_at',now_ms));
 return jsonb_build_object('success',true,'deposit_id',p_deposit_id,'status','Rejected');
end; $$;
revoke all on function public.pledge_deposit_reject(uuid,text,text) from public,anon,authenticated;
grant execute on function public.pledge_deposit_reject(uuid,text,text) to service_role;
create or replace function public.pledge_sync_investor_mirror()
returns trigger language plpgsql security definer set search_path=public as $$
declare uid text; rec jsonb; investor public.pledge_records%rowtype;
begin
 if new.table_name not like 'pledge_account_%' then return new; end if;
 uid:=new.record->>'user_id'; if uid is null or uid='' then return new; end if;
 select * into investor from public.pledge_records where table_name='pledge_investors' and record->>'user_id'=uid order by created_at asc limit 1 for update;
 if not found then return new; end if;
 rec:=investor.record;
 rec:=jsonb_set(rec,'{balance}',to_jsonb(coalesce((new.record->>'balance')::numeric,0)),true);
 rec:=jsonb_set(rec,'{invested}',to_jsonb(coalesce((new.record->>'invested')::numeric,0)),true);
 rec:=jsonb_set(rec,'{profit_earned}',to_jsonb(coalesce((new.record->>'profit_earned')::numeric,0)),true);
 rec:=jsonb_set(rec,'{updated_at}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)::bigint),true);
 update public.pledge_records set record=rec,updated_at=now() where id=investor.id; return new;
end; $$;
drop trigger if exists pledge_sync_investor_mirror_trigger on public.pledge_records;
create trigger pledge_sync_investor_mirror_trigger after update of record on public.pledge_records for each row when (new.table_name like 'pledge_account_%') execute function public.pledge_sync_investor_mirror();
