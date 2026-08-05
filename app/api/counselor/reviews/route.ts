import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { sanitizePlainText } from "@/lib/security"

const schema = z.object({ projectId: z.string().uuid(), decision: z.enum(["approved", "revision_requested", "rejected"]), reason: z.string().trim().min(10).max(2_000) })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["counselor"])
    if (context.error) return context.error
    const { data, error } = await context.supabase.from("project_reviews").insert({ project_id: input.projectId, counselor_id: context.user.id, decision: input.decision, reason: sanitizePlainText(input.reason) }).select("id,decision,reason,created_at").single()
    if (error) throw error
    return NextResponse.json({ review: data }, { status: 201 })
  } catch (error) { return invalid(error) }
}
