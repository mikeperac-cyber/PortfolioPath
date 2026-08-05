-- Students and counselors may update only their own display name and locale.
-- Column-level grants prevent role or account-status changes through this policy.
grant update (full_name, locale, updated_at) on public.users to authenticated;

create policy users_update_own_profile
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
