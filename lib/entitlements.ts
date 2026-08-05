import type { SupabaseClient } from "@supabase/supabase-js";

export type Entitlements = {
  idea_count?: number;
  project_limit?: number;
  student_limit?: number;
  workspace?: boolean;
  evidence?: boolean;
  reflections?: boolean;
  portfolio?: boolean;
  pdf?: boolean;
  parent_access?: boolean;
  mentor_verification?: boolean;
  application_prep?: boolean;
  presentation?: boolean;
  recommendation_evidence?: boolean;
  school_workspace?: boolean;
  download_plan?: boolean;
  reviews?: boolean;
  templates?: boolean;
  progress_summaries?: boolean;
};

export const freeEntitlements: Entitlements = {
  idea_count: 1,
  project_limit: 0,
};
export const ownerEntitlements: Entitlements = {
  idea_count: Number.MAX_SAFE_INTEGER,
  project_limit: Number.MAX_SAFE_INTEGER,
  student_limit: Number.MAX_SAFE_INTEGER,
  workspace: true,
  evidence: true,
  reflections: true,
  portfolio: true,
  pdf: true,
  parent_access: true,
  mentor_verification: true,
  application_prep: true,
  presentation: true,
  recommendation_evidence: true,
  school_workspace: true,
  download_plan: true,
  reviews: true,
  templates: true,
  progress_summaries: true,
};

const numericKeys = ["idea_count", "project_limit", "student_limit"] as const;

export function mergeEntitlements(
  ...sources: Array<Entitlements | null | undefined>
): Entitlements {
  const merged: Entitlements = {};
  for (const source of sources) {
    if (!source) continue;
    for (const key of numericKeys) {
      const value = source[key];
      if (typeof value === "number")
        merged[key] = Math.max(merged[key] ?? 0, value);
    }
    for (const [key, value] of Object.entries(source)) {
      if (numericKeys.includes(key as (typeof numericKeys)[number])) continue;
      if (value === true)
        (merged as Record<string, boolean | number>)[key] = true;
    }
  }
  return merged;
}

export function canCreateProject(
  entitlements: Entitlements,
  currentProjects: number,
) {
  return currentProjects < (entitlements.project_limit ?? 0);
}

export function canAssignStudent(
  entitlements: Entitlements,
  currentStudents: number,
) {
  return currentStudents < (entitlements.student_limit ?? 0);
}

export function projectIdeaLimit(entitlements: Entitlements) {
  return Math.max(1, Math.min(3, entitlements.idea_count ?? 1));
}

export function hasEntitlement(
  entitlements: Entitlements,
  feature: keyof Entitlements,
) {
  return entitlements[feature] === true;
}

type PlanJoin =
  | { entitlements: Entitlements }
  | Array<{ entitlements: Entitlements }>
  | null;
type AccessGrantJoin = {
  grant_kind: "complimentary" | "discount" | "manual" | "owner_internal";
  plan_id?: string | null;
  discount_percent?: number | null;
  entitlements: Entitlements;
  plans: PlanJoin;
};

function joinedEntitlements(value: PlanJoin) {
  if (Array.isArray(value)) return value[0]?.entitlements;
  return value?.entitlements;
}

/**
 * A discount is a commercial record, not an access grant. Keeping this rule
 * pure makes it easy to test and prevents an owner-issued discount from
 * silently unlocking a paid workspace before a payment has succeeded.
 */
export function entitlementsFromAccessGrants(grants: AccessGrantJoin[]) {
  return grants
    .filter(
      (grant) =>
        grant.grant_kind === "complimentary" ||
        grant.grant_kind === "manual" ||
        grant.grant_kind === "owner_internal",
    )
    .flatMap((grant) => [grant.entitlements, joinedEntitlements(grant.plans)]);
}

export function activeDiscountPercent(
  grants: AccessGrantJoin[],
  planId: string,
) {
  return grants
    .filter(
      (grant) => grant.grant_kind === "discount" && grant.plan_id === planId,
    )
    .reduce(
      (highest, grant) => Math.max(highest, grant.discount_percent ?? 0),
      0,
    );
}

export function discountedAmountTry(
  amountTry: number,
  discountPercent: number,
) {
  if (!Number.isFinite(amountTry) || amountTry < 0)
    throw new Error("The plan price is invalid.");
  if (
    !Number.isInteger(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 99
  ) {
    throw new Error(
      "Discounts must be between 0% and 99%. Use a complimentary grant for 100% access.",
    );
  }
  return Math.max(0, Math.round((amountTry * (100 - discountPercent)) / 100));
}

/**
 * Resolves paid subscriptions and owner-issued grants on the server. This must
 * never be reconstructed from client input or editable account metadata.
 */
export async function resolveEntitlements(
  supabase: SupabaseClient,
  userId: string,
  options: { isPlatformOwner?: boolean } = {},
) {
  if (options.isPlatformOwner) return ownerEntitlements;

  const now = new Date().toISOString();
  const [
    { data: subscriptions, error: subscriptionsError },
    { data: grants, error: grantsError },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plans(entitlements)")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("access_grants")
      .select(
        "grant_kind,plan_id,discount_percent,entitlements,plans(entitlements)",
      )
      .eq("user_id", userId)
      .is("revoked_at", null)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`),
  ]);

  if (subscriptionsError) throw subscriptionsError;
  if (grantsError) throw grantsError;

  return mergeEntitlements(
    freeEntitlements,
    ...(subscriptions ?? []).map((subscription) =>
      joinedEntitlements(subscription.plans as PlanJoin),
    ),
    ...entitlementsFromAccessGrants((grants ?? []) as AccessGrantJoin[]),
  );
}
