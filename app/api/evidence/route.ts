import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasEntitlement, resolveEntitlements } from "@/lib/entitlements"
import { assertSafeExternalUrl, sanitizePlainText } from "@/lib/security"

const schema = z.object({
  projectId: z.string().uuid(),
  weekId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  skillId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(180),
  description: z.string().max(1_000).nullable().optional(),
  evidenceType: z.enum(["image", "video", "pdf", "document", "spreadsheet", "link", "repository", "website"]),
  storagePath: z.string().max(900).optional(),
  externalUrl: z.string().url().max(2_000).optional(),
  mimeType: z.string().max(120).nullable().optional(),
  sizeBytes: z.coerce.number().int().positive().max(26_214_400).nullable().optional(),
  explanation: z.string().trim().min(10).max(4_000),
  privacy: z.enum(["private", "portfolio_selected"]).default("private"),
}).refine((value) => Boolean(value.storagePath || value.externalUrl), { message: "Attach a private file or a valid HTTPS/HTTP link." })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["student"])
    if (context.error) return context.error
    const entitlements = await resolveEntitlements(context.supabase, context.user.id, { isPlatformOwner: context.user.roles.includes("platform_owner") })
    if (!hasEntitlement(entitlements, "evidence")) return NextResponse.json({ error: "Evidence uploads require the Complete Student Portfolio plan or an owner-issued grant." }, { status: 403 })
    const { data: project, error: projectError } = await context.supabase.from("projects").select("id").eq("id", input.projectId).eq("student_id", context.user.id).maybeSingle()
    if (projectError) throw projectError
    if (!project) return NextResponse.json({ error: "This project is not available to your account." }, { status: 404 })
    if (input.storagePath && (!input.storagePath.startsWith(`${context.user.id}/${input.projectId}/`) || input.storagePath.includes(".."))) return NextResponse.json({ error: "The selected upload path is not valid for this project." }, { status: 400 })
    const externalUrl = input.externalUrl ? assertSafeExternalUrl(input.externalUrl) : null
    if (input.taskId) {
      const { data: task } = await context.supabase.from("tasks").select("id").eq("id", input.taskId).eq("project_id", input.projectId).maybeSingle()
      if (!task) return NextResponse.json({ error: "Choose a task that belongs to this project." }, { status: 400 })
    }
    const { data, error } = await context.supabase.from("evidence").insert({
      project_id: input.projectId,
      student_id: context.user.id,
      week_id: input.weekId ?? null,
      task_id: input.taskId ?? null,
      skill_id: input.skillId ?? null,
      title: sanitizePlainText(input.title),
      description: input.description ? sanitizePlainText(input.description) : null,
      evidence_type: input.evidenceType,
      storage_path: input.storagePath ?? null,
      external_url: externalUrl,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      student_explanation: sanitizePlainText(input.explanation),
      privacy: input.privacy,
    }).select("id,title,review_status,privacy,uploaded_at").single()
    if (error) throw error
    return NextResponse.json({ evidence: data }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
