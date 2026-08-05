begin;

select plan(1);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

insert into public.project_reviews (project_id, counselor_id, decision, reason)
values (
  '70000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'approved',
  'The proposal is feasible and keeps planned outcomes distinct from completed work.'
);

select is(
  (select status::text from public.projects where id = '70000000-0000-0000-0000-000000000002'),
  'approved',
  'an authorized counselor review transitions the project status'
);

select * from finish();
rollback;
