create or replace function public.admin_platform_insights()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generatedAt', now(),
    'totals', jsonb_build_object(
      'users', (select count(*) from public.users),
      'activeCounselors', (select count(*) from public.users where role = 'counselor' and status = 'active'),
      'projects', (select count(*) from public.projects),
      'activeProjects', (select count(*) from public.projects where status = 'active'),
      'completedProjects', (select count(*) from public.projects where status = 'completed'),
      'evidence', (select count(*) from public.evidence),
      'acceptedEvidence', (select count(*) from public.evidence where review_status = 'accepted'),
      'reflections', (select count(*) from public.reflections),
      'publishedPortfolios', (select count(*) from public.portfolio_pages where status = 'published')
    ),
    'funnel', jsonb_build_object(
      'registeredStudents', (select count(*) from public.users where role = 'student'),
      'onboardedStudents', (select count(*) from public.student_profiles where onboarding_completed),
      'studentsWithProjects', (select count(distinct student_id) from public.projects),
      'studentsWithEvidence', (select count(distinct student_id) from public.evidence),
      'studentsWithPortfolioReady', (
        select count(distinct student_id)
        from public.portfolio_pages
        where status in ('ready', 'published')
      )
    ),
    'commercial', jsonb_build_object(
      'activePaidAccounts', (
        select count(distinct s.user_id)
        from public.subscriptions s
        join public.plans p on p.id = s.plan_id
        where s.status = 'active' and p.price_try > 0
      ),
      'recognizedRevenueTry', (
        select coalesce(sum(amount_try), 0)
        from public.payments
        where lower(status) in ('succeeded', 'paid', 'complete', 'completed')
      ),
      'recognizedRevenueTry30d', (
        select coalesce(sum(amount_try), 0)
        from public.payments
        where lower(status) in ('succeeded', 'paid', 'complete', 'completed')
          and created_at >= now() - interval '30 days'
      ),
      'planMix', (
        select coalesce(jsonb_object_agg(code, account_count), '{}'::jsonb)
        from (
          select p.code, count(distinct s.user_id) as account_count
          from public.plans p
          left join public.subscriptions s on s.plan_id = p.id and s.status = 'active'
          group by p.code
        ) mix
      )
    ),
    'operations', jsonb_build_object(
      'pendingCounselors', (select count(*) from public.users where role = 'counselor' and status = 'pending'),
      'projectsAwaitingReview', (select count(*) from public.projects where status = 'awaiting_counselor_review'),
      'openFlags', (select count(*) from public.content_flags where status in ('open', 'reviewing')),
      'newStudents30d', (select count(*) from public.users where role = 'student' and created_at >= now() - interval '30 days'),
      'newProjects30d', (select count(*) from public.projects where created_at >= now() - interval '30 days'),
      'evidenceAdded30d', (select count(*) from public.evidence where uploaded_at >= now() - interval '30 days')
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_platform_insights() from public, anon;
grant execute on function public.admin_platform_insights() to authenticated;
