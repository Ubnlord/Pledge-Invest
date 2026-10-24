-- Align the database-backed investment catalogue with the seven plans shown in the dashboard.
-- The API and investment validation both read this table, so updating it keeps the UI
-- and server-side amount/duration checks consistent.
begin;

update public.pledge_investment_plans
set active = false,
    updated_at = now()
where active = true;

insert into public.pledge_investment_plans
  (id, name, min_amount, max_amount, advertised_rate, duration_days, active, terms, updated_at)
values
  ('starter', 'Capital Preservation Plan', 100, 500, 5, 60, true,
   '{"return_label":"5% indicative target; not guaranteed"}'::jsonb, now()),
  ('growth', 'Fixed Income Plan', 500, 1000, 5, 120, true,
   '{"return_label":"5% indicative target; not guaranteed"}'::jsonb, now()),
  ('premium', 'Balanced Portfolio', 1000, 1500, 7, 180, true,
   '{"return_label":"7% indicative target; not guaranteed"}'::jsonb, now()),
  ('global-index', 'Global Index Plan', 1500, 2000, 7, 240, true,
   '{"return_label":"7% indicative target; not guaranteed"}'::jsonb, now()),
  ('sustainable-growth', 'Sustainable Growth Plan', 2000, 4000, 10, 300, true,
   '{"return_label":"10% indicative target; not guaranteed"}'::jsonb, now()),
  ('technology-growth', 'Technology Growth Plan', 5000, 10000, 10, 365, true,
   '{"return_label":"10% indicative target; not guaranteed"}'::jsonb, now()),
  ('project-target', 'Project Target Plan', 10000, 50000, 10, 1825, true,
   '{"return_label":"10% indicative target; not guaranteed"}'::jsonb, now())
on conflict (id) do update set
  name = excluded.name,
  min_amount = excluded.min_amount,
  max_amount = excluded.max_amount,
  advertised_rate = excluded.advertised_rate,
  duration_days = excluded.duration_days,
  active = excluded.active,
  terms = excluded.terms,
  updated_at = now();

commit;
