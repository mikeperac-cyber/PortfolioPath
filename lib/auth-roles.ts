export type AppRole = "student" | "counselor" | "administrator";
export type PlatformRole =
  | "platform_owner"
  | "administrator"
  | "counselor"
  | "student"
  | "parent"
  | "mentor"
  | "school_admin"
  | "school_counselor";
export type WorkspaceRole =
  | "owner"
  | "administrator"
  | "counselor"
  | "student"
  | "parent"
  | "mentor"
  | "school";

export type CurrentUser = {
  id: string;
  role: AppRole;
  roles: PlatformRole[];
  status: "active" | "pending" | "suspended";
  full_name: string;
  locale: "en" | "tr";
};

export function hasRole(user: CurrentUser, role: PlatformRole | AppRole) {
  return user.roles.includes(role as PlatformRole) || user.role === role;
}

export function workspacePath(locale: string, workspace: WorkspaceRole) {
  const path = workspace === "administrator" ? "admin" : workspace;
  return `/${locale}/${path}/dashboard`;
}

export function defaultWorkspace(user: CurrentUser): WorkspaceRole {
  if (hasRole(user, "platform_owner")) return "owner";
  if (hasRole(user, "administrator")) return "administrator";
  if (hasRole(user, "counselor")) return "counselor";
  if (hasRole(user, "parent")) return "parent";
  if (hasRole(user, "mentor")) return "mentor";
  if (hasRole(user, "school_admin") || hasRole(user, "school_counselor"))
    return "school";
  return "student";
}
