import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ reviewStatus: z.enum(["pending", "accepted", "clarification_requested", "rejected", "privacy_concern"]) })

export async function PATCH(request: Request, route: { params: Promise<{ evidenceId: string }> }) {
  try {
    const input = schema.parse(await request.json())
    const { evidenceId } = await route.params
    const context = await getApiContext(["counselor"])
    if (context.error) return context.error
    const { data: evidence } = await context.supabase.from("evidence").select("id,student_id,project_id,skill_id").eq("id", evidenceId).maybeSingle()
    if (!evidence) return NextResponse.json({ error: "This evidence is not available for your review." }, { status: 404 })
    const admin = createAdminClient()
    const { data, error } = await admin.from("evidence").update({ review_status: input.reviewStatus }).eq("id", evidence.id).select("id,review_status").single()
    if (error) throw error
    if (input.reviewStatus === "accepted" && evidence.skill_id) {
      const { error: skillError } = await admin.from("project_skills").update({ status: "evidence_supported" }).eq("project_id", evidence.project_id).eq("skill_id", evidence.skill_id).eq("status", "target")
      if (skillError) throw skillError
    }
    await admin.from("audit_logs").insert({ actor_id: context.user.id, action: "COUNSELOR_EVIDENCE_REVIEW", entity_type: "evidence", entity_id: evidence.id, new_data: { reviewStatus: input.reviewStatus } })
    return NextResponse.json({ evidence: data })
  } catch (error) { return invalid(error) }
}
