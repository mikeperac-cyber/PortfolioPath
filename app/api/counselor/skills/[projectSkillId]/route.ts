import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizePlainText } from "@/lib/security"

const schema = z.object({ confirmed: z.boolean(), rationale: z.string().trim().min(10).max(1_000) })

export async function PATCH(request: Request, route: { params: Promise<{ projectSkillId: string }> }) {
  try {
    const input = schema.parse(await request.json())
    const { projectSkillId } = await route.params
    const context = await getApiContext(["counselor"])
    if (context.error) return context.error
    const { data: skill } = await context.supabase.from("project_skills").select("id,project_id,skill_id,status").eq("id", projectSkillId).maybeSingle()
    if (!skill) return NextResponse.json({ error: "This skill is not available for your review." }, { status: 404 })
    const admin = createAdminClient()
    if (input.confirmed) {
      const { count, error: evidenceError } = await admin.from("evidence").select("id", { count: "exact", head: true }).eq("project_id", skill.project_id).eq("skill_id", skill.skill_id).eq("review_status", "accepted")
      if (evidenceError) throw evidenceError
      if (!count) return NextResponse.json({ error: "Accept evidence linked to this skill before confirming it." }, { status: 422 })
      const { error: updateError } = await admin.from("project_skills").update({ status: "counselor_confirmed" }).eq("id", skill.id)
      if (updateError) throw updateError
      const { error: confirmationError } = await admin.from("skill_confirmations").upsert({ project_skill_id: skill.id, counselor_id: context.user.id, rationale: sanitizePlainText(input.rationale), confirmed_at: new Date().toISOString() }, { onConflict: "project_skill_id,counselor_id" })
      if (confirmationError) throw confirmationError
    } else {
      const { error: updateError } = await admin.from("project_skills").update({ status: "evidence_supported" }).eq("id", skill.id)
      if (updateError) throw updateError
      const { error: deleteError } = await admin.from("skill_confirmations").delete().eq("project_skill_id", skill.id).eq("counselor_id", context.user.id)
      if (deleteError) throw deleteError
    }
    await admin.from("audit_logs").insert({ actor_id: context.user.id, action: input.confirmed ? "COUNSELOR_SKILL_CONFIRMED" : "COUNSELOR_SKILL_CONFIRMATION_REMOVED", entity_type: "project_skill", entity_id: skill.id, new_data: { rationale: sanitizePlainText(input.rationale) } })
    return NextResponse.json({ confirmed: input.confirmed })
  } catch (error) { return invalid(error) }
}
