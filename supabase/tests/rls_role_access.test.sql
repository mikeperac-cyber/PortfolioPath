begin;
select plan(8);

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
select ok((select count(*) from public.projects) > 0,'student can read own projects');
select ok((select count(*) from public.evidence) > 0,'student can read own evidence');

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000099';
select is((select count(*) from public.projects),0::bigint,'unrelated authenticated user cannot read projects');

set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000001';
select ok((select count(*) from public.projects) > 0,'approved assigned counselor can read student projects');

reset role;
update public.counselor_student_assignments set active=false where counselor_id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000001';
select is((select count(*) from public.projects),0::bigint,'unassigned counselor cannot read student projects');

reset role;
update public.counselor_student_assignments set active=true where counselor_id='20000000-0000-0000-0000-000000000001';
update public.users set status='pending' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000001';
select is((select count(*) from public.projects),0::bigint,'pending counselor cannot read student projects');

reset role;
update public.users set status='active' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000001';
select ok((select count(*) from public.projects) > 0,'administrator RLS path can read project metadata');

reset role;
set local role anon;
set local "request.jwt.claim.sub" = '';
select throws_ok('select * from public.projects','42501','permission denied for table projects','anonymous session cannot read private projects');

reset role;
select * from finish();
rollback;
