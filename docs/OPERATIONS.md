# Production operations checklist

## Daily profit scheduler

The `daily-investor-profit.yml` GitHub Actions workflow is the active scheduler. It runs at 23:00 UTC (00:00 Africa/Lagos).

The scheduler is deliberately fail-closed. Configure the same random, high-entropy value as `PLEDGE_CRON_SECRET` in both places before enabling scheduled credits:

1. Supabase Dashboard → Edge Functions → Secrets: add `PLEDGE_CRON_SECRET`.
2. GitHub repository Settings → Secrets and variables → Actions → New repository secret: add `PLEDGE_CRON_SECRET` with the identical value.
3. Open Actions → Daily investor profit → Run workflow for a controlled manual run.
4. Confirm the run reports the Lagos date, credit count, and zero failures before relying on the recurring schedule.

Do not put the secret in source code, `cron.json`, workflow YAML, issues, or chat. The workflow sends only the secret header to the protected endpoint. If any credit fails, the workflow fails so it is visible in Actions.

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
