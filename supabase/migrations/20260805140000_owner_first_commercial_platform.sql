-- Owner-first commercial platform expansion.
-- Additive only: existing student records and their privacy boundaries remain intact.

do $$ begin
  create type public.platform_role as enum (
    'platform_owner', 'administrator', 'counselor', 'student',
    'parent', 'mentor', 'school_admin', 'school_counselor'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.organization_kind as enum ('school', 'counselor_practice');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.organization_member_role as enum ('owner', 'administrator', 'counselor', 'staff');
exception when duplicate_object then null; end $$;

alter type public.generation_type add value if not exists 'project_blueprint';
alter type public.generation_type add value if not exists 'reflection_support';
alter type public.generation_type add value if not exists 'portfolio_text';
alter type public.generation_type add value if not exists 'personal_statement_connection';
alter type public.generation_type add value if not exists 'interview_preparation';

create table if not exists public.user_role_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.platform_role not null,
  organization_id uuid,
  granted_by uuid references public.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists user_role_grants_unique_active_scope
  on public.user_role_grants(user_id, role, coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;
create index if not exists user_role_grants_user_active_idx on public.user_role_grants(user_id, active) where revoked_at is null;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind public.organization_kind not null default 'school',
  country text default 'Türkiye',
  status text not null default 'prospect' check (status in ('prospect', 'active', 'suspended', 'archived')),
  annual_contract_ends_at timestamptz,
  seat_limit integer not null default 25 check (seat_limit between 1 and 10000),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_role_grants
  add constraint user_role_grants_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete cascade;

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.organization_member_role not null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create index if not exists organization_memberships_user_active_idx on public.organization_memberships(user_id, active);
create index if not exists organization_memberships_org_active_idx on public.organization_memberships(organization_id, active);

create table if not exists public.school_cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  graduation_year smallint,
  created_at timestamptz not null default now(),
  unique(organization_id, name)
);

create table if not exists public.school_cohort_students (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.school_cohorts(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(cohort_id, student_id)
);

create index if not exists school_cohort_students_student_idx on public.school_cohort_students(student_id);

create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  grant_kind text not null check (grant_kind in ('complimentary', 'discount', 'manual', 'owner_internal')),
  entitlements jsonb not null default '{}'::jsonb,
  discount_percent smallint check (discount_percent between 1 and 100),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  granted_by uuid not null references public.users(id) on delete restrict,
  note text check (char_length(coalesce(note, '')) <= 500),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists access_grants_active_user_idx on public.access_grants(user_id, starts_at, ends_at) where revoked_at is null;

create table if not exists public.parent_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  relationship_label text,
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  permissions jsonb not null default '{"project_progress": true, "selected_evidence": true, "counselor_updates": true}'::jsonb,
  consented_by_student_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(parent_user_id, student_id)
);

create index if not exists parent_student_links_student_active_idx on public.parent_student_links(student_id) where revoked_at is null;

create table if not exists public.mentor_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  organization text,
  title text,
  updated_at timestamptz not null default now()
);

create table if not exists public.mentor_student_links (
  id uuid primary key default gen_random_uuid(),
  mentor_user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(mentor_user_id, student_id)
);

create index if not exists mentor_student_links_mentor_active_idx on public.mentor_student_links(mentor_user_id) where status = 'active';

create table if not exists public.relationship_invites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  requested_by uuid not null references public.users(id) on delete cascade,
  invitee_email text not null check (char_length(invitee_email) <= 254),
  invite_role public.platform_role not null check (invite_role in ('parent', 'mentor')),
  token_hash text not null unique,
  permissions jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  accepted_by uuid references public.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '30 days')
);

create index if not exists relationship_invites_student_active_idx on public.relationship_invites(student_id, expires_at) where revoked_at is null and accepted_at is null;

create table if not exists public.mentor_verification_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  mentor_user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  evidence_id uuid references public.evidence(id) on delete set null,
  project_skill_id uuid references public.project_skills(id) on delete set null,
  student_statement text not null check (char_length(student_statement) between 10 and 2000),
  requested_claim text not null check (char_length(requested_claim) between 10 and 500),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'clarification_requested', 'declined', 'revoked')),
  mentor_response text check (char_length(coalesce(mentor_response, '')) <= 2000),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (task_id is not null or evidence_id is not null or project_skill_id is not null)
);

create index if not exists mentor_verification_requests_mentor_status_idx on public.mentor_verification_requests(mentor_user_id, status, created_at desc);
create index if not exists mentor_verification_requests_project_status_idx on public.mentor_verification_requests(project_id, status);

create table if not exists public.parent_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  counselor_id uuid references public.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 2 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists parent_updates_student_created_idx on public.parent_updates(student_id, created_at desc);

create table if not exists public.application_profiles (
  student_id uuid primary key references public.users(id) on delete cascade,
  intended_destinations text[] not null default '{}',
  intended_major text,
  target_application_year smallint,
  updated_at timestamptz not null default now()
);

create table if not exists public.application_artifacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  artifact_type text not null check (artifact_type in ('personal_statement_connection', 'interview_preparation')),
  locale text not null default 'en' check (locale in ('en', 'tr')),
  content jsonb not null default '{}'::jsonb,
  source_record_ids uuid[] not null default '{}',
  factual_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_artifacts_student_type_idx on public.application_artifacts(student_id, artifact_type, updated_at desc);

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_name text not null check (event_name ~ '^[a-z0-9_]{3,80}$'),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists product_events_name_time_idx on public.product_events(event_name, occurred_at desc);
create index if not exists product_events_user_time_idx on public.product_events(user_id, occurred_at desc);

create table if not exists public.school_quote_requests (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  work_email text not null check (char_length(work_email) <= 254),
  organization_name text not null check (char_length(organization_name) between 2 and 160),
  estimated_students integer check (estimated_students between 1 and 10000),
  message text check (char_length(coalesce(message, '')) <= 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.billing_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  document_kind text not null check (document_kind in ('receipt', 'invoice', 'refund')),
  document_url text,
  provider_reference text,
  issued_at timestamptz not null default now()
);

create index if not exists billing_documents_user_issued_idx on public.billing_documents(user_id, issued_at desc);

insert into public.user_role_grants(user_id, role, active)
select u.id, u.role::text::public.platform_role, true
from public.users u
on conflict do nothing;

create or replace function private.has_platform_role(required_role public.platform_role, check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_role_grants grant_row
    join public.users u on u.id = grant_row.user_id
    where grant_row.user_id = check_user
      and grant_row.role = required_role
      and grant_row.active
      and grant_row.revoked_at is null
      and u.status = 'active'
  )
  or exists (
    select 1 from public.users u
    where u.id = check_user
      and u.status = 'active'
      and u.role::text = required_role::text
  );
$$;

create or replace function private.is_platform_owner(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_platform_role('platform_owner'::public.platform_role, check_user);
$$;

create or replace function private.is_admin(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_platform_role('administrator'::public.platform_role, check_user);
$$;

create or replace function private.is_approved_counselor(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_platform_role('counselor'::public.platform_role, check_user);
$$;

create or replace function private.is_org_member(check_organization uuid, check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = check_organization
      and membership.user_id = check_user
      and membership.active
  );
$$;

create or replace function private.is_parent_with_scope(check_student uuid, required_scope text, check_parent uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.parent_student_links link_row
    where link_row.student_id = check_student
      and link_row.parent_user_id = check_parent
      and link_row.revoked_at is null
      and coalesce((link_row.permissions ->> required_scope)::boolean, false)
  );
$$;

grant execute on function private.has_platform_role(public.platform_role, uuid), private.is_platform_owner(uuid), private.is_org_member(uuid, uuid), private.is_parent_with_scope(uuid, text, uuid) to authenticated;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare safe_role public.user_role;
begin
  safe_role := case when new.raw_user_meta_data->>'role' = 'counselor' then 'counselor'::public.user_role else 'student'::public.user_role end;
  insert into public.users(id, role, status, full_name, locale)
  values(new.id, safe_role, case when safe_role = 'counselor' then 'pending'::public.account_status else 'active'::public.account_status end, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(nullif(new.raw_user_meta_data->>'locale',''),'en'));
  insert into public.user_role_grants(user_id, role, active)
  values(new.id, safe_role::text::public.platform_role, true)
  on conflict do nothing;
  if safe_role = 'student' then
    insert into public.student_profiles(user_id) values(new.id);
  else
    insert into public.counselor_profiles(user_id) values(new.id);
  end if;
  return new;
end $$;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated using (
  (select auth.uid()) = student_id
  or private.is_assigned_counselor(student_id)
  or private.is_admin()
  or private.is_parent_with_scope(student_id, 'project_progress')
);

drop policy if exists outcomes_select on public.project_outcomes;
create policy outcomes_select on public.project_outcomes for select to authenticated using (
  private.owns_project(project_id)
  or private.can_review_project(project_id)
  or private.is_admin()
  or exists(select 1 from public.projects p where p.id = project_id and private.is_parent_with_scope(p.student_id, 'project_progress'))
);

drop policy if exists weeks_select on public.project_weeks;
create policy weeks_select on public.project_weeks for select to authenticated using (
  private.owns_project(project_id)
  or private.can_review_project(project_id)
  or private.is_admin()
  or exists(select 1 from public.projects p where p.id = project_id and private.is_parent_with_scope(p.student_id, 'project_progress'))
);

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (
  private.owns_project(project_id)
  or private.can_review_project(project_id)
  or private.is_admin()
  or exists(select 1 from public.projects p where p.id = project_id and private.is_parent_with_scope(p.student_id, 'project_progress'))
);

drop policy if exists evidence_select on public.evidence;
create policy evidence_select on public.evidence for select to authenticated using (
  (select auth.uid()) = student_id
  or private.is_assigned_counselor(student_id)
  or (privacy = 'portfolio_selected'::public.privacy_setting and private.is_parent_with_scope(student_id, 'selected_evidence'))
);

alter table public.user_role_grants enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.school_cohorts enable row level security;
alter table public.school_cohort_students enable row level security;
alter table public.access_grants enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.mentor_student_links enable row level security;
alter table public.relationship_invites enable row level security;
alter table public.mentor_verification_requests enable row level security;
alter table public.parent_updates enable row level security;
alter table public.application_profiles enable row level security;
alter table public.application_artifacts enable row level security;
alter table public.product_events enable row level security;
alter table public.school_quote_requests enable row level security;
alter table public.billing_documents enable row level security;

create policy role_grants_self_select on public.user_role_grants for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());
create policy organizations_member_select on public.organizations for select to authenticated using (private.is_org_member(id) or private.is_platform_owner());
create policy organization_memberships_member_select on public.organization_memberships for select to authenticated using ((select auth.uid()) = user_id or private.is_org_member(organization_id) or private.is_platform_owner());
create policy school_cohorts_member_select on public.school_cohorts for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy school_cohort_students_member_select on public.school_cohort_students for select to authenticated using (private.is_platform_owner() or exists(select 1 from public.school_cohorts c where c.id = cohort_id and private.is_org_member(c.organization_id)) or (select auth.uid()) = student_id);
create policy access_grants_recipient_select on public.access_grants for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());
create policy parent_profiles_self_select on public.parent_profiles for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());
create policy parent_profiles_self_update on public.parent_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy parent_links_related_select on public.parent_student_links for select to authenticated using ((select auth.uid()) in (parent_user_id, student_id) or private.is_platform_owner());
create policy mentor_profiles_self_select on public.mentor_profiles for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());
create policy mentor_profiles_self_update on public.mentor_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy mentor_links_related_select on public.mentor_student_links for select to authenticated using ((select auth.uid()) in (mentor_user_id, student_id) or private.is_platform_owner());
create policy relationship_invites_related_select on public.relationship_invites for select to authenticated using ((select auth.uid()) in (student_id, requested_by, accepted_by) or private.is_platform_owner());
create policy mentor_requests_select on public.mentor_verification_requests for select to authenticated using ((select auth.uid()) in (student_id, mentor_user_id) or private.can_review_project(project_id) or private.is_admin());
create policy parent_updates_select on public.parent_updates for select to authenticated using ((select auth.uid()) = student_id or private.can_review_project(project_id) or private.is_admin() or private.is_parent_with_scope(student_id, 'counselor_updates'));
create policy application_profiles_select on public.application_profiles for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id) or private.is_admin());
create policy application_profiles_student_all on public.application_profiles for all to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);
create policy application_artifacts_select on public.application_artifacts for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id) or private.is_admin());
create policy application_artifacts_student_all on public.application_artifacts for all to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);
create policy product_events_owner_select on public.product_events for select to authenticated using (private.is_platform_owner());
create policy school_quote_requests_owner_select on public.school_quote_requests for select to authenticated using (private.is_platform_owner());
create policy billing_documents_self_select on public.billing_documents for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());

grant select on public.user_role_grants, public.organizations, public.organization_memberships, public.school_cohorts, public.school_cohort_students, public.access_grants, public.parent_profiles, public.parent_student_links, public.mentor_profiles, public.mentor_student_links, public.relationship_invites, public.mentor_verification_requests, public.parent_updates, public.application_profiles, public.application_artifacts, public.product_events, public.school_quote_requests, public.billing_documents to authenticated;
grant update on public.parent_profiles, public.mentor_profiles to authenticated;
grant insert, update, delete on public.application_profiles, public.application_artifacts to authenticated;

create trigger audit_user_role_grants after insert or update or delete on public.user_role_grants for each row execute function private.audit_change();
create trigger audit_access_grants after insert or update or delete on public.access_grants for each row execute function private.audit_change();
create trigger audit_parent_links after insert or update or delete on public.parent_student_links for each row execute function private.audit_change();
create trigger audit_mentor_requests after insert or update or delete on public.mentor_verification_requests for each row execute function private.audit_change();
create trigger audit_organizations after insert or update or delete on public.organizations for each row execute function private.audit_change();
create trigger audit_organization_memberships after insert or update or delete on public.organization_memberships for each row execute function private.audit_change();

create or replace function public.owner_platform_insights()
returns jsonb
language plpgsql
security definer
set search_path = '' as $$
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generatedAt', now(),
    'customers', jsonb_build_object(
      'students', (select count(*) from public.users where role = 'student'),
      'counselors', (select count(*) from public.users where role = 'counselor' and status = 'active'),
      'parents', (select count(*) from public.parent_student_links where revoked_at is null),
      'mentors', (select count(*) from public.mentor_student_links where status = 'active'),
      'schools', (select count(*) from public.organizations where kind = 'school' and status = 'active')
    ),
    'activation', jsonb_build_object(
      'onboardedStudents', (select count(*) from public.student_profiles where onboarding_completed),
      'studentsWithProjects', (select count(distinct student_id) from public.projects),
      'studentsWithEvidence', (select count(distinct student_id) from public.evidence),
      'publishedPortfolios', (select count(*) from public.portfolio_pages where status = 'published')
    ),
    'commercial', jsonb_build_object(
      'recognizedRevenueTry', (select coalesce(sum(amount_try), 0) from public.payments where lower(status) in ('succeeded', 'paid', 'complete', 'completed')),
      'activePaidAccounts', (select count(distinct s.user_id) from public.subscriptions s join public.plans p on p.id = s.plan_id where s.status = 'active' and p.price_try > 0),
      'complimentaryAccess', (select count(*) from public.access_grants where grant_kind = 'complimentary' and revoked_at is null and starts_at <= now() and (ends_at is null or ends_at > now())),
      'openSchoolQuotes', (select count(*) from public.school_quote_requests where status in ('new', 'contacted', 'qualified'))
    ),
    'quality', jsonb_build_object(
      'awaitingCounselorReview', (select count(*) from public.projects where status = 'awaiting_counselor_review'),
      'pendingMentorRequests', (select count(*) from public.mentor_verification_requests where status = 'pending'),
      'openEthicalFlags', (select count(*) from public.content_flags where status in ('open', 'reviewing')),
      'evidenceAwaitingReview', (select count(*) from public.evidence where review_status = 'pending')
    )
  );
end;
$$;

revoke all on function public.owner_platform_insights() from public, anon;
grant execute on function public.owner_platform_insights() to authenticated;

-- Checkout state is server-owned. It intentionally contains no card details, identity numbers,
-- addresses, or raw provider payloads. Those values are passed only to the payment provider.
create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  provider text not null,
  conversation_id text not null unique,
  provider_session_id text unique,
  provider_customer_id text,
  provider_subscription_id text,
  amount_try integer not null check (amount_try >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled', 'expired')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_sessions_user_status_idx on public.payment_sessions(user_id, status, created_at desc);
create index if not exists payment_sessions_provider_subscription_idx on public.payment_sessions(provider_subscription_id) where provider_subscription_id is not null;

alter table public.payment_sessions enable row level security;
create policy payment_sessions_self_select on public.payment_sessions for select to authenticated using ((select auth.uid()) = user_id or private.is_platform_owner());
grant select on public.payment_sessions to authenticated;
grant select, insert, update on public.payment_sessions to service_role;
grant select, insert, update, delete on
  public.user_role_grants,
  public.organizations,
  public.organization_memberships,
  public.school_cohorts,
  public.school_cohort_students,
  public.access_grants,
  public.parent_profiles,
  public.parent_student_links,
  public.mentor_profiles,
  public.mentor_student_links,
  public.relationship_invites,
  public.mentor_verification_requests,
  public.parent_updates,
  public.application_profiles,
  public.application_artifacts,
  public.school_quote_requests
to service_role;
grant select, insert on public.product_events, public.billing_documents to service_role;

create trigger audit_payment_sessions after insert or update or delete on public.payment_sessions for each row execute function private.audit_change();
