import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext, invalid } from "@/lib/api-auth";
import { sanitizePlainText } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  userId: z.string().uuid(),
  planCode: z.enum(["blueprint", "complete", "counselor"]),
  grantKind: z
    .enum(["complimentary", "discount", "manual"])
    .default("complimentary"),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
  discountPercent: z.coerce.number().int().min(1).max(99).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const context = await getApiContext(["platform_owner"]);
    if (context.error) return context.error;
    if (input.grantKind === "discount" && !input.discountPercent)
      return NextResponse.json(
        { error: "A discount percentage is required." },
        { status: 400 },
      );

    const admin = createAdminClient();
    const [{ data: target }, { data: plan }] = await Promise.all([
      admin.from("users").select("id").eq("id", input.userId).maybeSingle(),
      admin
        .from("plans")
        .select("id")
        .eq("code", input.planCode)
        .eq("active", true)
        .maybeSingle(),
    ]);
    if (!target || !plan)
      return NextResponse.json(
        { error: "The customer or plan is no longer available." },
        { status: 404 },
      );

    const endsAt = input.durationDays
      ? new Date(
          Date.now() + input.durationDays * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;
    const { data: grant, error } = await admin
      .from("access_grants")
      .insert({
        user_id: input.userId,
        plan_id: plan.id,
        grant_kind: input.grantKind,
        discount_percent:
          input.grantKind === "discount" ? input.discountPercent : null,
        ends_at: endsAt,
        granted_by: context.user.id,
        note: input.note ? sanitizePlainText(input.note) : null,
      })
      .select("id,ends_at")
      .single();
    if (error) throw error;
    await admin
      .from("audit_logs")
      .insert({
        actor_id: context.user.id,
        action: "OWNER_ACCESS_GRANT",
        entity_type: "access_grant",
        entity_id: grant.id,
        new_data: {
          userId: input.userId,
          planCode: input.planCode,
          grantKind: input.grantKind,
          endsAt,
        },
      });
    return NextResponse.json({ grant }, { status: 201 });
  } catch (error) {
    return invalid(error);
  }
}
