# Pledge Invest

Investor website frontend and Supabase Edge Function API.

## Backend
- Supabase project: `xypcqtqmekrjgytivmsm`
- API: `supabase/functions/pledge-api/index.ts`
- Private compatibility store: `public.pledge_records` (service-role access only)
- Frontend adapter: `src/lib/platform.ts`

## Setup required before live financial use
- Configure Supabase Auth providers and redirect URLs.
- Set `PLEDGE_ADMIN_AUTH_CODE` in Supabase Edge Function secrets.
- Confirm the administrator allowlist in the Edge Function.
- Import and reconcile legacy AppDeploy records. The new Supabase project was empty at migration start, so no legacy financial records have been copied.
- Test sign-in, admin authorization, deposit approval, wallet credits, withdrawals, referral rewards, and profit accrual with test accounts.

The public frontend key is intentionally publishable; never expose a service-role key or admin authentication code in frontend code.
