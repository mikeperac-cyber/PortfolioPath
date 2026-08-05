import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  defaultWorkspace,
  hasRole,
  type AppRole,
  type CurrentUser,
  type PlatformRole,
  workspacePath,
} from "@/lib/auth-roles";

export { defaultWorkspace, hasRole, workspacePath } from "@/lib/auth-roles";
export type {
  AppRole,
  CurrentUser,
  PlatformRole,
  WorkspaceRole,
} from "@/lib/auth-roles";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims?.sub;
  if (!id) return null;
  const { data } = await supabase
    .from("users")
    .select("id, role, status, full_name, locale")
    .eq("id", id)
    .single();
  if (!data) return null;
  const base = data as Omit<CurrentUser, "roles">;
  const roles = new Set<PlatformRole>([base.role]);
  // The fallback keeps existing accounts usable while the additive migration is
  // being rolled out; authorization still happens server-side on each action.
  const { data: grants } = await supabase
    .from("user_role_grants")
    .select("role")
    .eq("user_id", id)
    .eq("active", true)
    .is("revoked_at", null);
  for (const grant of grants ?? []) roles.add(grant.role as PlatformRole);
  return { ...base, roles: [...roles] };
});

export async function requireUser(locale = "en") {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.status === "suspended") redirect(`/${locale}/account-suspended`);
  return user;
}

export async function requireRole(role: PlatformRole | AppRole, locale = "en") {
  const user = await requireUser(locale);
  if (!hasRole(user, role))
    redirect(workspacePath(locale, defaultWorkspace(user)));
  if (role === "counselor" && user.status !== "active")
    redirect(`/${locale}/counselor/pending`);
  return user;
}

export async function requireAnyRole(
  roles: Array<PlatformRole | AppRole>,
  locale = "en",
) {
  const user = await requireUser(locale);
  if (!roles.some((role) => hasRole(user, role)))
    redirect(workspacePath(locale, defaultWorkspace(user)));
  return user;
}
