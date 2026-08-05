-- The server-only Supabase key bypasses RLS but still needs table privileges.
-- Keep audit logs append-only while allowing trusted server routes to perform
-- provenance, billing, sharing, and administrative operations.
grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.users,
  public.student_profiles,
  public.counselor_profiles,
  public.counselor_student_assignments,
  public.projects,
  public.project_objectives,
  public.project_outcomes,
  public.project_weeks,
  public.tasks,
  public.evidence,
  public.reflections,
  public.skills,
  public.project_skills,
  public.skill_confirmations,
  public.counselor_comments,
  public.project_reviews,
  public.portfolio_pages,
  public.portfolio_sections,
  public.share_links,
  public.project_templates,
  public.project_categories,
  public.plans,
  public.subscriptions,
  public.payments,
  public.notifications,
  public.content_flags,
  public.generation_requests
to service_role;

grant select, insert on public.audit_logs to service_role;
grant usage, select on all sequences in schema public to service_role;
