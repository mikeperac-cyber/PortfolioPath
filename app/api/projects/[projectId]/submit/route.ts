import { NextResponse } from "next/server"
import { getApiContext, invalid } from "@/lib/api-auth"

export async function POST(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params
    const auth = await getApiContext(["student"])
    if (auth.error) return auth.error
    const { data: project, error: projectError } = await auth.supabase.from("projects").select("id,status,title,main_objective,personal_motivation,final_deliverable").eq("id", projectId).eq("student_id", auth.user.id).maybeSingle()
    if (projectError) throw projectError
    if (!project) return NextResponse.json({ error: "This project is not available to your account." }, { status: 404 })
    if (!["draft", "revision_requested"].includes(project.status)) return NextResponse.json({ error: "Only a draft or revision-requested project can be submitted." }, { status: 409 })
    if (!project.title || !project.main_objective || !project.personal_motivation || !project.final_deliverable) return NextResponse.json({ error: "Complete the project title, motivation, objective, and final deliverable before submitting." }, { status: 422 })
    const { count, error: outcomesError } = await auth.supabase.from("project_outcomes").select("id", { count: "exact", head: true }).eq("project_id", projectId)
    if (outcomesError) throw outcomesError
    if ((count ?? 0) < 3) return NextResponse.json({ error: "Add three planned measurable outcomes before submitting." }, { status: 422 })
    const { data, error } = await auth.supabase.from("projects").update({ status: "awaiting_counselor_review", updated_at: new Date().toISOString() }).eq("id", projectId).select("id,status,updated_at").single()
    if (error) throw error
    return NextResponse.json({ project: data })
  } catch (error) {
    return invalid(error)
  }
}
