import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const context = await getApiContext(["parent"])
  if (context.error) return context.error
  const admin = createAdminClient()
  const { data: links, error } = await admin
    .from("parent_student_links")
    .select("student_id,permissions,created_at")
    .eq("parent_user_id", context.user.id)
    .is("revoked_at", null)
  if (error) return NextResponse.json({ error: "Family access could not be loaded." }, { status: 500 })
  const studentIds = (links ?? []).map((link) => link.student_id)
  if (!studentIds.length) return NextResponse.json({ students: [] })
  const [{ data: students }, { data: projects }, { data: updates }] = await Promise.all([
    admin.from("users").select("id,full_name").in("id", studentIds),
    admin.from("projects").select("id,student_id,title,status,end_date").in("student_id", studentIds).neq("status", "archived").order("updated_at", { ascending: false }),
    admin.from("parent_updates").select("id,student_id,title,body,created_at").in("student_id", studentIds).order("created_at", { ascending: false }).limit(20),
  ])
  const summary = studentIds.map((studentId) => {
    const student = students?.find((row) => row.id === studentId)
    const link = links?.find((row) => row.student_id === studentId)
    const studentProjects = projects?.filter((project) => project.student_id === studentId) ?? []
    return {
      id: studentId,
      name: student?.full_name || "Student",
      permissions: link?.permissions ?? {},
      projects: studentProjects.map((project) => ({ id: project.id, title: project.title, status: project.status, endDate: project.end_date })),
      updates: (updates ?? []).filter((update) => update.student_id === studentId),
    }
  })
  return NextResponse.json({ students: summary })
}
