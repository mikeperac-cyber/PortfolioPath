import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const context = await getApiContext(["mentor"])
  if (context.error) return context.error
  const admin = createAdminClient()
  const { data: requests, error } = await admin
    .from("mentor_verification_requests")
    .select("id,project_id,student_id,student_statement,requested_claim,status,mentor_response,created_at,responded_at")
    .eq("mentor_user_id", context.user.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Verification requests could not be loaded." }, { status: 500 })
  const projectIds = [...new Set((requests ?? []).map((row) => row.project_id))]
  const studentIds = [...new Set((requests ?? []).map((row) => row.student_id))]
  const [{ data: projects }, { data: students }] = await Promise.all([
    projectIds.length ? admin.from("projects").select("id,title").in("id", projectIds) : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    studentIds.length ? admin.from("users").select("id,full_name").in("id", studentIds) : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
  ])
  return NextResponse.json({ requests: (requests ?? []).map((requestRow) => ({ ...requestRow, projectTitle: projects?.find((project) => project.id === requestRow.project_id)?.title ?? "Project", studentName: students?.find((student) => student.id === requestRow.student_id)?.full_name ?? "Student" })) })
}
