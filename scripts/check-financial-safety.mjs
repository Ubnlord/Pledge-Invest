import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api = readFileSync('supabase/functions/pledge-api/index.ts', 'utf8');
const sql = readFileSync('supabase/migrations/202610240001_financial_integrity.sql', 'utf8');

assert.match(api, /export async function dailyInvestorProfit\s*\(/, 'daily profit handler must exist');
assert.match(api, /\.range\(offset,offset\+999\)/, 'daily profit must page through every investor record');
assert.match(api, /async listAll<T = any>\(table: string, pageSize = 1000\)/, 'API must provide complete paginated record reads');
assert.match(api, /POST \/api\/admin\/notifications'.*listAll<any>\('pledge_investors'\)/s, 'broadcast notifications must include all investor pages');
assert.match(api, /GET \/api\/admin\/withdrawals[\s\S]*?listAll<any>\('pledge_investors'\)[\s\S]*?listAll<any>/, 'withdrawal review must not silently cap investors or transactions');
assert.match(api, /GET \/api\/admin\/deposits'.*listAll\('pledge_deposit_requests'\)/s, 'deposit review must include all pages');
assert.match(api, /timeZone:'Africa\/Lagos'/, 'daily profit idempotency date must use Lagos time');
assert.match(api, /daily-profit-'\+day\+'-'/, 'daily profit must use a per-user, per-day idempotency key');
assert.match(api, /'DELETE \/api\/admin\/users\/:id'.*status:'inactive'/s, 'admin delete action must suspend, not erase, investor records');
assert.match(api, /This investor account is inactive\. Contact support for review\./, 'inactive investor accounts must be blocked from authenticated API routes');
assert.match(api, /Inactive investor accounts cannot receive manual credits/, 'inactive investors must not receive manual credits');
assert.match(api, /Status must be active, inactive or suspended/, 'investor status changes must use the supported lifecycle states');
assert.match(api, /Daily profit rate must be between 0 and 100 percent/, 'daily profit configuration must be validated server-side');
assert.match(api, /Referral percentage must be between 0 and 100 percent/, 'referral configuration must be validated server-side');
assert.doesNotMatch(api, /'DELETE \/api\/admin\/users\/:id'.*db\.delete\('pledge_investors'/s, 'admin delete route must not physically delete investor history');

assert.match(sql, /create table if not exists public\.pledge_financial_ledger/i, 'financial ledger table must exist');
assert.match(sql, /unique\(user_id,operation_key\)/i, 'ledger operations must be unique per user and operation key');
assert.match(sql, /p_amount is null or p_amount<=0 or p_amount<>round\(p_amount,2\)/i, 'financial operations must reject invalid money amounts');
assert.match(sql, /pg_advisory_xact_lock/i, 'financial operations must serialize concurrent operations');
assert.match(sql, /revoke all on function public\.pledge_deposit_approve\(uuid,text\) from public,anon,authenticated/i, 'deposit approval must not be callable by public client roles');

console.log('Financial safety source invariants passed.');
