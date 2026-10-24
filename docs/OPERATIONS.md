# Production operations checklist

## Daily profit scheduler

The `daily-investor-profit.yml` GitHub Actions workflow is the active scheduler. It runs at 23:00 UTC (00:00 Africa/Lagos).

The scheduler is deliberately fail-closed and uses GitHub Actions OpenID Connect (OIDC), so it does not require a shared cron secret. The Edge Function accepts only tokens issued by GitHub for the `Ubnlord/Pledge-Invest` repository, the `main` branch, and this exact workflow. The workflow requests the `pledge-investor-profit-scheduler` audience and reports any failed credit in Actions.

Before enabling daily accrual, verify the configured daily rate and `dailyProfitEnabled` setting in the admin dashboard. The rate is applied to each active investor's `invested` amount and is not a guaranteed return.
## Notification delivery

- In-app notifications are recorded in the platform database.
- Email delivery requires `RESEND_API_KEY` in Supabase Edge Function secrets; `RESEND_FROM_EMAIL` is optional.
- Browser push is **not configured**. The API reports push delivery as failed/unavailable instead of claiming it was sent. A real push provider, VAPID keys, browser subscription storage, and a service worker still need to be configured before browser push can be enabled.

## Deposit integrity

- Deposit settlement now refuses to credit inactive investors or linked users with a missing wallet.
- A unique index prevents the same transaction hash from being submitted more than once on the same network.
- Admins must independently verify the transaction, network, amount, and destination before approving a deposit.
- A rejected duplicate should be reviewed through the existing request; do not create another credit for the same blockchain transaction.

## Authentication hardening

The Supabase security advisor currently reports leaked-password protection as disabled. Enable it in Supabase Dashboard → Authentication → Settings / Password Security (the exact label can vary) so compromised passwords are rejected. This is a project Auth setting, not a repository change. The mirror-trigger function's direct RPC privileges have been revoked; its trigger continues to run with the required service role privileges.
