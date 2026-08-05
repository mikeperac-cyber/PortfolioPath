create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('student', 'counselor', 'administrator');
create type public.account_status as enum ('active', 'pending', 'suspended');
create type public.project_status as enum ('draft', 'awaiting_counselor_review', 'revision_requested', 'approved', 'active', 'paused', 'completed', 'archived');
create type public.task_status as enum ('not_started', 'in_progress', 'blocked', 'submitted_for_review', 'complete');
create type public.evidence_status as enum ('pending', 'accepted', 'clarification_requested', 'rejected', 'privacy_concern');
create type public.skill_status as enum ('target', 'evidence_supported', 'counselor_confirmed');
create type public.reflection_type as enum ('weekly', 'midpoint', 'final');
create type public.review_decision as enum ('approved', 'revision_requested', 'rejected');
create type public.privacy_setting as enum ('private', 'portfolio_selected');
create type public.billing_status as enum ('inactive', 'trialing', 'active', 'past_due', 'canceled');
create type public.generation_type as enum ('project_ideas', 'presentation', 'recommendation_evidence', 'progress_summary');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  status public.account_status not null default 'active',
  full_name text not null default '',
  locale text not null default 'en' check (locale in ('en','tr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  age smallint check (age between 14 and 19),
  school_year text,
  city text,
  country text default 'Türkiye',
  target_application_year smallint,
  intended_destinations text[] not null default '{}',
  intended_major text,
  career_interests text[] not null default '{}',
  personal_interests text[] not null default '{}',
  current_activities text[] not null default '{}',
  existing_skills text[] not null default '{}',
  target_skills text[] not null default '{}',
  causes text[] not null default '{}',
  weekly_hours numeric(4,1),
  budget_try integer,
  technology_access text[] not null default '{}',
  preferred_categories uuid[] not null default '{}',
  previous_experiences text,
  onboarding_step smallint not null default 1,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.counselor_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  organization text,
  title text,
  bio text,
  verified_at timestamptz,
  student_capacity integer not null default 25 check (student_capacity between 1 and 100),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_tr text not null,
  price_try integer not null check (price_try >= 0),
  billing_interval text not null check (billing_interval in ('free','one_time','month')),
  entitlements jsonb not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  provider text not null default 'test',
  provider_customer_id text,
  provider_subscription_id text,
  status public.billing_status not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  plan_id uuid references public.plans(id),
  provider text not null,
  provider_payment_id text not null unique,
  amount_try integer not null check (amount_try >= 0),
  status text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.counselor_student_assignments (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  active boolean not null default true,
  assigned_by uuid references public.users(id),
  assigned_at timestamptz not null default now(),
  unique(counselor_id, student_id)
);

create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_tr text not null,
  description_en text,
  description_tr text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.project_categories(id),
  title_en text not null,
  title_tr text not null,
  summary_en text not null,
  summary_tr text not null,
  intended_major_tags text[] not null default '{}',
  suggested_duration_weeks integer not null default 6,
  suggested_weekly_hours numeric(4,1) not null default 3,
  estimated_cost_try integer not null default 0,
  template_data jsonb not null default '{}',
  ethical_notes jsonb not null default '{}',
  active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  category_id uuid references public.project_categories(id),
  template_id uuid references public.project_templates(id),
  title text not null,
  personal_motivation text,
  problem_opportunity text,
  main_objective text,
  target_audience text,
  start_date date,
  end_date date,
  weekly_hours numeric(4,1),
  risks text,
  alternative_plan text,
  final_deliverable text,
  status public.project_status not null default 'draft',
  factual_accuracy_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_objectives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  sort_order integer not null default 0
);

create table public.project_outcomes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  target_value text,
  actual_value text,
  evidence_supported boolean not null default false,
  sort_order integer not null default 0
);

create table public.project_weeks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  milestone text not null,
  starts_on date,
  ends_on date,
  unique(project_id, week_number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  week_id uuid references public.project_weeks(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  estimated_minutes integer check (estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes >= 0),
  status public.task_status not null default 'not_started',
  obstacle_notes text,
  student_reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_tr text not null,
  active boolean not null default true
);

create table public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  status public.skill_status not null default 'target',
  unique(project_id, skill_id)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  week_id uuid references public.project_weeks(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  title text not null,
  description text,
  evidence_type text not null,
  storage_path text,
  external_url text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  student_explanation text,
  review_status public.evidence_status not null default 'pending',
  privacy public.privacy_setting not null default 'private',
  uploaded_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  week_id uuid references public.project_weeks(id) on delete set null,
  reflection_type public.reflection_type not null,
  responses jsonb not null default '{}',
  narrative text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_confirmations (
  id uuid primary key default gen_random_uuid(),
  project_skill_id uuid not null references public.project_skills(id) on delete cascade,
  counselor_id uuid not null references public.users(id),
  rationale text not null,
  confirmed_at timestamptz not null default now(),
  unique(project_skill_id, counselor_id)
);

create table public.counselor_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  counselor_id uuid not null references public.users(id),
  task_id uuid references public.tasks(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete cascade,
  reflection_id uuid references public.reflections(id) on delete cascade,
  body text not null,
  clarification_requested boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  counselor_id uuid not null references public.users(id),
  decision public.review_decision not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function private.apply_project_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projects
  set status = case new.decision
    when 'approved' then 'approved'::public.project_status
    when 'revision_requested' then 'revision_requested'::public.project_status
    when 'rejected' then 'archived'::public.project_status
  end,
  updated_at = now()
  where id = new.project_id;
  return new;
end;
$$;

create table public.portfolio_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft','ready','published')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_sections (
  id uuid primary key default gen_random_uuid(),
  portfolio_page_id uuid not null references public.portfolio_pages(id) on delete cascade,
  section_type text not null,
  title text not null,
  content jsonb not null default '{}',
  visible boolean not null default true,
  sort_order integer not null default 0,
  unique(portfolio_page_id, section_type)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  portfolio_page_id uuid not null references public.portfolio_pages(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '90 days')
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.content_flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id),
  project_id uuid references public.projects(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  generation_type public.generation_type not null,
  provider text not null default 'template',
  source_record_ids uuid[] not null default '{}',
  input_hash text not null,
  output jsonb not null,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index projects_student_status_idx on public.projects(student_id, status);
create index tasks_project_due_idx on public.tasks(project_id, due_at);
create index evidence_project_status_idx on public.evidence(project_id, review_status);
create index assignments_counselor_active_idx on public.counselor_student_assignments(counselor_id, active);
create index assignments_student_active_idx on public.counselor_student_assignments(student_id, active);
create index comments_project_created_idx on public.counselor_comments(project_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, read_at) where read_at is null;
create index generation_rate_idx on public.generation_requests(user_id, generation_type, created_at desc);
create index share_token_active_idx on public.share_links(token_hash, expires_at) where revoked_at is null;

create function private.is_admin(check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.users u where u.id = check_user and u.role = 'administrator' and u.status = 'active') $$;

create function private.is_approved_counselor(check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.users u where u.id = check_user and u.role = 'counselor' and u.status = 'active') $$;

create function private.is_assigned_counselor(check_student uuid, check_counselor uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$ select private.is_approved_counselor(check_counselor) and exists(select 1 from public.counselor_student_assignments a where a.student_id = check_student and a.counselor_id = check_counselor and a.active) $$;

create function private.owns_project(check_project uuid, check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.projects p where p.id = check_project and p.student_id = check_user) $$;

create function private.can_review_project(check_project uuid, check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.projects p where p.id = check_project and private.is_assigned_counselor(p.student_id, check_user)) $$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(uuid), private.is_approved_counselor(uuid), private.is_assigned_counselor(uuid,uuid), private.owns_project(uuid,uuid), private.can_review_project(uuid,uuid) to authenticated;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare safe_role public.user_role;
begin
  safe_role := case when new.raw_user_meta_data->>'role' = 'counselor' then 'counselor'::public.user_role else 'student'::public.user_role end;
  insert into public.users(id, role, status, full_name, locale)
  values(new.id, safe_role, case when safe_role = 'counselor' then 'pending'::public.account_status else 'active'::public.account_status end, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(nullif(new.raw_user_meta_data->>'locale',''),'en'));
  if safe_role = 'student' then insert into public.student_profiles(user_id) values(new.id); else insert into public.counselor_profiles(user_id) values(new.id); end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function private.audit_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data)
  values(auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id)::text, case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end, case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_projects after insert or update or delete on public.projects for each row execute function private.audit_change();
create trigger audit_evidence after insert or update or delete on public.evidence for each row execute function private.audit_change();
create trigger audit_assignments after insert or update or delete on public.counselor_student_assignments for each row execute function private.audit_change();
create trigger audit_share_links after insert or update or delete on public.share_links for each row execute function private.audit_change();
create trigger audit_content_flags after insert or update or delete on public.content_flags for each row execute function private.audit_change();
create trigger audit_users after update on public.users for each row execute function private.audit_change();
create trigger audit_skill_confirmations after insert or delete on public.skill_confirmations for each row execute function private.audit_change();
create trigger audit_project_reviews after insert on public.project_reviews for each row execute function private.audit_change();
create trigger apply_project_review after insert on public.project_reviews for each row execute function private.apply_project_review();
create trigger audit_subscriptions after insert or update or delete on public.subscriptions for each row execute function private.audit_change();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function private.audit_change();
create trigger audit_generation_requests after insert on public.generation_requests for each row execute function private.audit_change();

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.counselor_profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.counselor_student_assignments enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_templates enable row level security;
alter table public.projects enable row level security;
alter table public.project_objectives enable row level security;
alter table public.project_outcomes enable row level security;
alter table public.project_weeks enable row level security;
alter table public.tasks enable row level security;
alter table public.skills enable row level security;
alter table public.project_skills enable row level security;
alter table public.evidence enable row level security;
alter table public.reflections enable row level security;
alter table public.skill_confirmations enable row level security;
alter table public.counselor_comments enable row level security;
alter table public.project_reviews enable row level security;
alter table public.portfolio_pages enable row level security;
alter table public.portfolio_sections enable row level security;
alter table public.share_links enable row level security;
alter table public.notifications enable row level security;
alter table public.content_flags enable row level security;
alter table public.generation_requests enable row level security;
alter table public.audit_logs enable row level security;

create policy users_self_or_related_select on public.users for select to authenticated using ((select auth.uid()) = id or private.is_admin() or private.is_assigned_counselor(id) or exists(select 1 from public.counselor_student_assignments a where a.student_id = auth.uid() and a.counselor_id = users.id and a.active));
create policy student_profile_select on public.student_profiles for select to authenticated using ((select auth.uid()) = user_id or private.is_admin() or private.is_assigned_counselor(user_id));
create policy student_profile_update on public.student_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy counselor_profile_select on public.counselor_profiles for select to authenticated using ((select auth.uid()) = user_id or private.is_admin() or exists(select 1 from public.counselor_student_assignments a where a.student_id = auth.uid() and a.counselor_id = counselor_profiles.user_id and a.active));
create policy counselor_profile_update on public.counselor_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy plans_public_select on public.plans for select to anon, authenticated using (active);
create policy categories_public_select on public.project_categories for select to anon, authenticated using (active);
create policy templates_public_select on public.project_templates for select to anon, authenticated using (active);
create policy skills_public_select on public.skills for select to anon, authenticated using (active);
create policy subscriptions_self_select on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id or private.is_admin());
create policy payments_self_select on public.payments for select to authenticated using ((select auth.uid()) = user_id or private.is_admin());
create policy assignments_related_select on public.counselor_student_assignments for select to authenticated using ((select auth.uid()) in (student_id, counselor_id) or private.is_admin());

create policy projects_select on public.projects for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id) or private.is_admin());
create policy projects_insert on public.projects for insert to authenticated with check ((select auth.uid()) = student_id and exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'student' and u.status = 'active'));
create policy projects_update on public.projects for update to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);
create policy projects_delete on public.projects for delete to authenticated using ((select auth.uid()) = student_id and status in ('draft','archived'));

create policy objectives_select on public.project_objectives for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy objectives_student_all on public.project_objectives for all to authenticated using (private.owns_project(project_id)) with check (private.owns_project(project_id));
create policy outcomes_select on public.project_outcomes for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy outcomes_student_all on public.project_outcomes for all to authenticated using (private.owns_project(project_id)) with check (private.owns_project(project_id));
create policy weeks_select on public.project_weeks for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy weeks_student_all on public.project_weeks for all to authenticated using (private.owns_project(project_id)) with check (private.owns_project(project_id));
create policy tasks_select on public.tasks for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy tasks_student_all on public.tasks for all to authenticated using (private.owns_project(project_id)) with check (private.owns_project(project_id));
create policy project_skills_select on public.project_skills for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy project_skills_student_all on public.project_skills for all to authenticated using (private.owns_project(project_id)) with check (private.owns_project(project_id));

create policy evidence_select on public.evidence for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id));
create policy evidence_admin_flagged_select on public.evidence for select to authenticated using (private.is_admin() and exists(select 1 from public.content_flags f where f.evidence_id = evidence.id and f.status in ('open','reviewing')));
create policy evidence_student_all on public.evidence for all to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id and private.owns_project(project_id));
create policy reflections_select on public.reflections for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id) or private.is_admin());
create policy reflections_student_all on public.reflections for all to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id and private.owns_project(project_id));

create policy confirmations_select on public.skill_confirmations for select to authenticated using (exists(select 1 from public.project_skills ps join public.projects p on p.id = ps.project_id where ps.id = project_skill_id and (p.student_id = auth.uid() or private.is_assigned_counselor(p.student_id) or private.is_admin())));
create policy confirmations_counselor_insert on public.skill_confirmations for insert to authenticated with check ((select auth.uid()) = counselor_id and exists(select 1 from public.project_skills ps where ps.id = project_skill_id and private.can_review_project(ps.project_id)));
create policy confirmations_counselor_delete on public.skill_confirmations for delete to authenticated using ((select auth.uid()) = counselor_id);
create policy comments_select on public.counselor_comments for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy comments_counselor_insert on public.counselor_comments for insert to authenticated with check ((select auth.uid()) = counselor_id and private.can_review_project(project_id));
create policy reviews_select on public.project_reviews for select to authenticated using (private.owns_project(project_id) or private.can_review_project(project_id) or private.is_admin());
create policy reviews_counselor_insert on public.project_reviews for insert to authenticated with check ((select auth.uid()) = counselor_id and private.can_review_project(project_id));

create policy portfolios_select on public.portfolio_pages for select to authenticated using ((select auth.uid()) = student_id or private.is_assigned_counselor(student_id) or private.is_admin());
create policy portfolios_student_all on public.portfolio_pages for all to authenticated using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id and private.owns_project(project_id));
create policy sections_select on public.portfolio_sections for select to authenticated using (exists(select 1 from public.portfolio_pages pp where pp.id = portfolio_page_id and (pp.student_id = auth.uid() or private.is_assigned_counselor(pp.student_id) or private.is_admin())));
create policy sections_student_all on public.portfolio_sections for all to authenticated using (exists(select 1 from public.portfolio_pages pp where pp.id = portfolio_page_id and pp.student_id = auth.uid())) with check (exists(select 1 from public.portfolio_pages pp where pp.id = portfolio_page_id and pp.student_id = auth.uid()));
create policy share_links_student_all on public.share_links for all to authenticated using ((select auth.uid()) = student_id or private.is_admin()) with check ((select auth.uid()) = student_id and expires_at <= now() + interval '90 days');

create policy notifications_self_select on public.notifications for select to authenticated using ((select auth.uid()) = user_id or private.is_admin());
create policy notifications_self_update on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy flags_reporter_select on public.content_flags for select to authenticated using ((select auth.uid()) = reporter_id or private.is_admin());
create policy flags_authenticated_insert on public.content_flags for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy generations_self_select on public.generation_requests for select to authenticated using ((select auth.uid()) = user_id or private.is_admin());
create policy audit_admin_select on public.audit_logs for select to authenticated using (private.is_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('evidence','evidence',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy evidence_storage_select on storage.objects for select to authenticated using (bucket_id = 'evidence' and ((storage.foldername(name))[1] = (select auth.uid())::text or exists(select 1 from public.evidence e where e.storage_path = name and private.is_assigned_counselor(e.student_id)) or (private.is_admin() and exists(select 1 from public.evidence e join public.content_flags f on f.evidence_id=e.id where e.storage_path=name and f.status in ('open','reviewing')))));
create policy evidence_storage_update on storage.objects for update to authenticated using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy evidence_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant usage on schema public to anon, authenticated;
grant select on public.plans, public.project_categories, public.project_templates, public.skills to anon, authenticated;
grant select on public.users, public.student_profiles, public.counselor_profiles, public.subscriptions, public.payments, public.counselor_student_assignments, public.projects, public.project_objectives, public.project_outcomes, public.project_weeks, public.tasks, public.project_skills, public.evidence, public.reflections, public.skill_confirmations, public.counselor_comments, public.project_reviews, public.portfolio_pages, public.portfolio_sections, public.share_links, public.notifications, public.content_flags, public.generation_requests, public.audit_logs to authenticated;
grant insert, update on public.student_profiles, public.counselor_profiles, public.projects, public.project_objectives, public.project_outcomes, public.project_weeks, public.tasks, public.project_skills, public.evidence, public.reflections, public.portfolio_pages, public.portfolio_sections, public.share_links, public.notifications, public.content_flags to authenticated;
grant delete on public.projects, public.project_objectives, public.project_outcomes, public.project_weeks, public.tasks, public.project_skills, public.evidence, public.reflections, public.portfolio_sections, public.share_links to authenticated;
grant insert on public.skill_confirmations, public.counselor_comments, public.project_reviews to authenticated;
grant delete on public.skill_confirmations to authenticated;
revoke insert, update, delete on public.audit_logs, public.payments, public.subscriptions, public.generation_requests from anon, authenticated;
