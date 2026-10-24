-- This function is intended to run only as the trigger attached to pledge_records.
-- It must not be callable as a public RPC by anon or authenticated clients.
revoke all on function public.pledge_sync_investor_mirror() from public, anon, authenticated;
grant execute on function public.pledge_sync_investor_mirror() to service_role;
