import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasEntitlement, resolveEntitlements } from "@/lib/entitlements"
import { sanitizePlainText } from "@/lib/security"

const schema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  weekId: z.string().uuid().nullable().optional(),
  reflectionType: z.enum(["weekly", "midpoint", "final"]),
  narrative: z.string().trim().min(30).max(5_000),
  submit: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["student"])
    if (context.error) return context.error
    const entitlements = await resolveEntitlements(context.supabase, context.user.id, { isPlatformOwner: context.user.roles.includes("platform_owner") })
    if (!hasEntitlement(entitlements, "reflections")) return NextResponse.json({ error: "Reflections require the Complete Student Portfolio plan or an owner-issued grant." }, { status: 403 })
    const { data: project } = await context.supabase.from("projects").select("id").eq("id", input.projectId).eq("student_id", context.user.id).maybeSingle()
    if (!project) return NextResponse.json({ error: "This project is not available to your account." }, { status: 404 })
    const record = {
      project_id: input.projectId,
      student_id: context.user.id,
      week_id: input.weekId ?? null,
      reflection_type: input.reflectionType,
      narrative: sanitizePlainText(input.narrative),
      submitted_at: input.submit ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    const query = input.id
      ? context.supabase.from("reflections").update(record).eq("id", input.id).select("id,reflection_type,narrative,submitted_at,updated_at").maybeSingle()
      : context.supabase.from("reflections").insert(record).select("id,reflection_type,narrative,submitted_at,updated_at").single()
    const { data, error } = await query
    if (error) throw error
    if (!data) return NextResponse.json({ error: "This reflection is not available to your account." }, { status: 404 })
    return NextResponse.json({ reflection: data }, { status: input.id ? 200 : 201 })
  } catch (error) {
    return invalid(error)
  }
}
