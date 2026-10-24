-- Persistent rate limiting for the second factor used by the admin API.
create table if not exists public.pledge_admin_login_limits (
  identifier_hash text primary key check (length(identifier_hash)=64),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists pledge_admin_login_limits_updated_idx
  on public.pledge_admin_login_limits(updated_at);
alter table public.pledge_admin_login_limits enable row level security;
revoke all on public.pledge_admin_login_limits from public, anon, authenticated;
grant select, insert, update, delete on public.pledge_admin_login_limits to service_role;

create or replace function public.pledge_admin_auth_attempt(p_identifier_hash text, p_success boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_row public.pledge_admin_login_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
  v_window_started timestamptz;
  v_blocked_until timestamptz;
begin
  if p_identifier_hash is null or length(p_identifier_hash)<>64 or p_success is null then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENT';
  end if;

  insert into public.pledge_admin_login_limits(identifier_hash)
  values(p_identifier_hash)
  on conflict(identifier_hash) do nothing;

  select * into v_row
  from public.pledge_admin_login_limits
  where identifier_hash=p_identifier_hash
  for update;

  if v_row.blocked_until is not null and v_row.blocked_until > v_now then
    return jsonb_build_object(
      'allowed',false,
      'retry_after_seconds',greatest(1,ceil(extract(epoch from (v_row.blocked_until-v_now)))::integer)
    );
  end if;

  v_attempts := v_row.attempts;
  v_window_started := v_row.window_started_at;
  v_blocked_until := null;

  if v_window_started < v_now - interval '15 minutes' then
    v_attempts := 0;
    v_window_started := v_now;
  end if;

  if p_success then
    update public.pledge_admin_login_limits
    set attempts=0,window_started_at=v_now,blocked_until=null,updated_at=v_now
    where identifier_hash=p_identifier_hash;
    return jsonb_build_object('allowed',true,'retry_after_seconds',0);
  end if;

  v_attempts := v_attempts + 1;
  if v_attempts >= 5 then
    v_blocked_until := v_now + interval '15 minutes';
  end if;

  update public.pledge_admin_login_limits
  set attempts=v_attempts,window_started_at=v_window_started,blocked_until=v_blocked_until,updated_at=v_now
  where identifier_hash=p_identifier_hash;

  return jsonb_build_object(
    'allowed',v_attempts < 5,
    'retry_after_seconds',case when v_blocked_until is null then 0 else 900 end
  );
end; $$;

revoke all on function public.pledge_admin_auth_attempt(text,boolean) from public,anon,authenticated;
grant execute on function public.pledge_admin_auth_attempt(text,boolean) to service_role;
