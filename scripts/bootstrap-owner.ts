import { createClient } from "@supabase/supabase-js";

const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !url || !serviceKey) {
  throw new Error(
    "Set BOOTSTRAP_OWNER_EMAIL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUser() {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

const user = await findExistingUser();
if (!user) {
  throw new Error(
    "No existing account matches BOOTSTRAP_OWNER_EMAIL. Sign up through PortfolioPath first; this command intentionally never creates owner accounts.",
  );
}

for (const role of ["platform_owner", "counselor", "student"] as const) {
  const { data: current, error: currentError } = await admin
    .from("user_role_grants")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .is("organization_id", null)
    .is("revoked_at", null)
    .maybeSingle();
  if (currentError) throw currentError;

  const { error } = current
    ? await admin
        .from("user_role_grants")
        .update({ active: true })
        .eq("id", current.id)
    : await admin
        .from("user_role_grants")
        .insert({ user_id: user.id, role, active: true, granted_by: user.id });
  if (error) throw error;
}

const { error: counselorProfileError } = await admin
  .from("counselor_profiles")
  .upsert(
    { user_id: user.id },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
if (counselorProfileError) throw counselorProfileError;

const { error: auditError } = await admin.from("audit_logs").insert({
  actor_id: user.id,
  action: "OWNER_BOOTSTRAPPED",
  entity_type: "user",
  entity_id: user.id,
  new_data: {
    roles: ["platform_owner", "counselor", "student"],
    method: "explicit_bootstrap",
  },
});
if (auditError) throw auditError;

process.stdout.write(
  `Owner roles enabled for ${email}. Sign out and sign back in to refresh the workspace switcher.\n`,
);
