import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET() {
  const context = await getApiContext(["counselor"])
  if (context.error) return context.error
  const { supabase, user } = context

  const { data: assignments, error: assignmentsError } = await supabase.from("counselor_student_assignments").select("student_id,assigned_at").eq("counselor_id", user.id).eq("active", true)
  if (assignmentsError) return NextResponse.json({ error: "Assigned students could not be loaded." }, { status: 500 })
  const studentIds = (assignments ?? []).map((assignment) => assignment.student_id)
  if (!studentIds.length) {
    const response = NextResponse.json({ students: [], projects: [], tasks: [], evidence: [], reflections: [], skills: [] })
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=120")
    return response
  }
  const admin = createAdminClient()
  const { data: projects, error: projectsError } = await supabase.from("projects").select("id,student_id,title,status,main_objective,updated_at").in("student_id", studentIds).order("updated_at", { ascending: false })
  if (projectsError) return NextResponse.json({ error: "Assigned projects could not be loaded." }, { status: 500 })
  const projectIds = (projects ?? []).map((project) => project.id)
  const [{ data: users }, { data: profiles }, { data: tasks }, { data: evidence }, { data: reflections }, { data: skills }] = await Promise.all([
    admin.from("users").select("id,full_name,status").in("id", studentIds),
    admin.from("student_profiles").select("user_id,intended_major,target_application_year,onboarding_completed").in("user_id", studentIds),
    supabase.from("tasks").select("id,project_id,title,status,due_at,student_reflection,obstacle_notes,updated_at").order("updated_at", { ascending: false }),
    supabase.from("evidence").select("id,project_id,student_id,title,student_explanation,review_status,privacy,uploaded_at,skill_id").order("uploaded_at", { ascending: false }),
    supabase.from("reflections").select("id,project_id,student_id,reflection_type,narrative,submitted_at,updated_at").not("submitted_at", "is", null).order("updated_at", { ascending: false }),
    projectIds.length ? supabase.from("project_skills").select("id,project_id,skill_id,status,skills(name_en)").in("project_id", projectIds) : Promise.resolve({ data: [] }),
  ])
  const studentRows = studentIds.map((studentId) => {
    const account = users?.find((row) => row.id === studentId)
    const profile = profiles?.find((row) => row.user_id === studentId)
    const studentProjects = (projects ?? []).filter((project) => project.student_id === studentId)
    const incomplete = (tasks ?? []).filter((task) => studentProjects.some((project) => project.id === task.project_id) && task.status !== "complete" && task.due_at && new Date(task.due_at).getTime() < Date.now()).length

    // Check if stalled for > 10 days
    const latestProjectUpdate = studentProjects.length > 0
      ? Math.max(...studentProjects.map(p => new Date(p.updated_at || Date.now()).getTime()))
      : Date.now();
    const daysSinceUpdate = (Date.now() - latestProjectUpdate) / (1000 * 60 * 60 * 24);
    const stalled = studentProjects.length > 0 && daysSinceUpdate > 10;

    return { id: studentId, name: account?.full_name || "Student", accountStatus: account?.status ?? "active", intendedMajor: profile?.intended_major ?? "Not set", applicationYear: profile?.target_application_year ?? null, onboardingCompleted: Boolean(profile?.onboarding_completed), overdueTasks: incomplete, projectCount: studentProjects.length, stalled, daysSinceUpdate: Math.floor(daysSinceUpdate) }
  })

  const response = NextResponse.json({ students: studentRows, projects: projects ?? [], tasks: tasks ?? [], evidence: evidence ?? [], reflections: reflections ?? [], skills: skills ?? [] })
  response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=120")
  return response
}
