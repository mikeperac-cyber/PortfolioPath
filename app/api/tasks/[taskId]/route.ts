import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { sanitizePlainText } from "@/lib/security"

const schema = z.object({
  status: z.enum(["not_started", "in_progress", "blocked", "submitted_for_review", "complete"]).optional(),
  actualMinutes: z.coerce.number().int().min(0).max(10_000).nullable().optional(),
  obstacleNotes: z.string().max(2_000).nullable().optional(),
  studentReflection: z.string().max(4_000).nullable().optional(),
})

export async function PATCH(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const input = schema.parse(await request.json())
    const { taskId } = await context.params
    const auth = await getApiContext(["student"])
    if (auth.error) return auth.error
    const changes = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.actualMinutes !== undefined ? { actual_minutes: input.actualMinutes } : {}),
      ...(input.obstacleNotes !== undefined ? { obstacle_notes: input.obstacleNotes ? sanitizePlainText(input.obstacleNotes) : null } : {}),
      ...(input.studentReflection !== undefined ? { student_reflection: input.studentReflection ? sanitizePlainText(input.studentReflection) : null } : {}),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await auth.supabase.from("tasks").update(changes).eq("id", taskId).select("id,status,actual_minutes,obstacle_notes,student_reflection,updated_at").maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: "This task is not available to your account." }, { status: 404 })
    return NextResponse.json({ task: data })
  } catch (error) {
    return invalid(error)
  }
}
