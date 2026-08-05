import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasEntitlement, resolveEntitlements } from "@/lib/entitlements"
import { sanitizePlainText } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ projectId: z.string().uuid(), mentorId: z.string().uuid(), taskId: z.string().uuid().optional(), evidenceId: z.string().uuid().optional(), projectSkillId: z.string().uuid().optional(), studentStatement: z.string().trim().min(10).max(2000), requestedClaim: z.string().trim().min(10).max(500) }).refine((input) => Boolean(input.taskId || input.evidenceId || input.projectSkillId), { message: "Select a task, evidence item, or skill for the mentor to review." })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["student"])
    if (context.error) return context.error
    const entitlements = await resolveEntitlements(context.supabase, context.user.id, { isPlatformOwner: context.user.roles.includes("platform_owner") })
    if (!hasEntitlement(entitlements, "mentor_verification")) return NextResponse.json({ error: "Mentor verification is included with Complete Student Portfolio or an owner-issued grant." }, { status: 403 })
    const { data: project } = await context.supabase.from("projects").select("id").eq("id", input.projectId).eq("student_id", context.user.id).maybeSingle()
    const { data: link } = await context.supabase.from("mentor_student_links").select("id").eq("mentor_user_id", input.mentorId).eq("student_id", context.user.id).eq("status", "active").maybeSingle()
    if (!project || !link) return NextResponse.json({ error: "Choose one of your active mentors and one of your projects." }, { status: 403 })
    const { data, error } = await createAdminClient().from("mentor_verification_requests").insert({ project_id: input.projectId, student_id: context.user.id, mentor_user_id: input.mentorId, task_id: input.taskId ?? null, evidence_id: input.evidenceId ?? null, project_skill_id: input.projectSkillId ?? null, student_statement: sanitizePlainText(input.studentStatement), requested_claim: sanitizePlainText(input.requestedClaim) }).select("id,status").single()
    if (error) throw error
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
