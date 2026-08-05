begin;
select plan(4);

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000001';

select ok(
  (public.admin_platform_insights()->'totals'->>'users')::integer >= 3,
  'administrator can read aggregate platform totals'
);
select ok(
  (public.admin_platform_insights()->'funnel'->>'registeredStudents')::integer >= 1,
  'insights include the student activation funnel'
);
select ok(
  public.admin_platform_insights()->'commercial' ? 'recognizedRevenueTry',
  'insights include recognized payment revenue without projections'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
select throws_ok(
  'select public.admin_platform_insights()',
  '42501',
  'Administrator access required.',
  'student cannot read platform insights'
);

reset role;
select * from finish();
rollback;
