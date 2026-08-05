import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { sanitizePlainText } from "@/lib/security"

const schema = z.object({ projectId: z.string().uuid(), taskId: z.string().uuid().nullable().optional(), evidenceId: z.string().uuid().nullable().optional(), reflectionId: z.string().uuid().nullable().optional(), body: z.string().trim().min(5).max(2_000), clarificationRequested: z.boolean().default(false) })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["counselor"])
    if (context.error) return context.error
    const { data, error } = await context.supabase.from("counselor_comments").insert({ project_id: input.projectId, counselor_id: context.user.id, task_id: input.taskId ?? null, evidence_id: input.evidenceId ?? null, reflection_id: input.reflectionId ?? null, body: sanitizePlainText(input.body), clarification_requested: input.clarificationRequested }).select("id,created_at").single()
    if (error) throw error
    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (error) { return invalid(error) }
}
