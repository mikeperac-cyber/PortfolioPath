import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const context = await getApiContext(["student"])
  if (context.error) return context.error
  const { supabase, user } = context
  const [{ data: profile, error: profileError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.from("student_profiles").select("onboarding_completed, onboarding_step, intended_major, target_application_year").eq("user_id", user.id).maybeSingle(),
    supabase.from("projects").select("id,title,status,start_date,end_date,main_objective,final_deliverable,updated_at,created_at").eq("student_id", user.id).order("updated_at", { ascending: false }),
  ])
  if (profileError || projectsError) return NextResponse.json({ error: "Your workspace could not be loaded." }, { status: 500 })
  const projectIds = (projects ?? []).map((project) => project.id)
  if (!projectIds.length) return NextResponse.json({ profile, projects: [], weeks: [], tasks: [], evidence: [], reflections: [], skills: [], comments: [], portfolios: [], mentors: [], parents: [] })

  const [weeksResult, tasksResult, evidenceResult, reflectionsResult, skillsResult, commentsResult, portfoliosResult, mentorsResult, parentsResult] = await Promise.all([
    supabase.from("project_weeks").select("id,project_id,week_number,milestone,starts_on,ends_on").in("project_id", projectIds).order("week_number"),
    supabase.from("tasks").select("id,project_id,week_id,title,description,due_at,priority,estimated_minutes,actual_minutes,status,obstacle_notes,student_reflection,updated_at").in("project_id", projectIds).order("due_at"),
    supabase.from("evidence").select("id,project_id,week_id,task_id,skill_id,title,description,evidence_type,storage_path,external_url,mime_type,size_bytes,student_explanation,review_status,privacy,uploaded_at").in("project_id", projectIds).order("uploaded_at", { ascending: false }),
    supabase.from("reflections").select("id,project_id,week_id,reflection_type,narrative,submitted_at,updated_at").in("project_id", projectIds).order("updated_at", { ascending: false }),
    supabase.from("project_skills").select("id,project_id,status,skills(id,name_en,name_tr)").in("project_id", projectIds),
    supabase.from("counselor_comments").select("id,project_id,task_id,evidence_id,reflection_id,body,clarification_requested,created_at").in("project_id", projectIds).order("created_at", { ascending: false }),
    supabase.from("portfolio_pages").select("id,project_id,title,status,confirmed_at,updated_at").in("project_id", projectIds),
    supabase.from("mentor_student_links").select("mentor_user_id,status").eq("student_id", user.id).eq("status", "active"),
    supabase.from("parent_student_links").select("parent_user_id,permissions,created_at").eq("student_id", user.id).is("revoked_at", null),
  ])
  const errors = [weeksResult.error, tasksResult.error, evidenceResult.error, reflectionsResult.error, skillsResult.error, commentsResult.error, portfoliosResult.error, mentorsResult.error, parentsResult.error].filter(Boolean)
  if (errors.length) return NextResponse.json({ error: "Some private workspace records could not be loaded." }, { status: 500 })

  return NextResponse.json({
    profile,
    projects: projects ?? [],
    weeks: weeksResult.data ?? [],
    tasks: tasksResult.data ?? [],
    evidence: evidenceResult.data ?? [],
    reflections: reflectionsResult.data ?? [],
    skills: skillsResult.data ?? [],
    comments: commentsResult.data ?? [],
    portfolios: portfoliosResult.data ?? [],
    mentors: mentorsResult.data ?? [],
    parents: parentsResult.data ?? [],
  })
}
