import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasEntitlement, resolveEntitlements } from "@/lib/entitlements"
import { findUnsupportedClaims, sanitizePlainText } from "@/lib/security"

const sectionSchema = z.object({
  sectionType: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(160),
  content: z.string().max(8_000),
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100),
})
const updateSchema = z.object({ sections: z.array(sectionSchema).min(1).max(20), confirmFactualAccuracy: z.boolean().optional() })

function listText(items: string[], fallback: string) {
  return items.length ? items.map((item) => `• ${item}`).join("\n") : fallback
}

async function assertPortfolioAccess(projectId: string) {
  const context = await getApiContext(["student"])
  if (context.error) return { error: context.error }
  const entitlements = await resolveEntitlements(context.supabase, context.user.id, { isPlatformOwner: context.user.roles.includes("platform_owner") })
  if (!hasEntitlement(entitlements, "portfolio")) return { error: NextResponse.json({ error: "Portfolio tools require the Complete Student Portfolio plan or an owner-issued grant." }, { status: 403 }) }
  const { data: project, error } = await context.supabase.from("projects").select("id,title,personal_motivation,main_objective,problem_opportunity,final_deliverable,start_date,end_date").eq("id", projectId).eq("student_id", context.user.id).maybeSingle()
  if (error) throw error
  if (!project) return { error: NextResponse.json({ error: "This project is not available to your account." }, { status: 404 }) }
  return { context, project }
}

export async function GET(_request: Request, route: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await route.params
    const access = await assertPortfolioAccess(projectId)
    if (access.error) return access.error
    const { data: page, error } = await access.context.supabase.from("portfolio_pages").select("id,project_id,title,status,confirmed_at,updated_at,portfolio_sections(id,section_type,title,content,visible,sort_order)").eq("project_id", projectId).maybeSingle()
    if (error) throw error
    return NextResponse.json({ project: access.project, portfolio: page ? { ...page, sections: (page.portfolio_sections ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) } : null })
  } catch (error) {
    return invalid(error)
  }
}

export async function POST(_request: Request, route: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await route.params
    const access = await assertPortfolioAccess(projectId)
    if (access.error) return access.error
    const { context, project } = access
    const [tasksResult, evidenceResult, outcomesResult, reflectionsResult, skillsResult] = await Promise.all([
      context.supabase.from("tasks").select("title").eq("project_id", projectId).eq("status", "complete"),
      context.supabase.from("evidence").select("title").eq("project_id", projectId).eq("review_status", "accepted").eq("privacy", "portfolio_selected"),
      context.supabase.from("project_outcomes").select("description,actual_value").eq("project_id", projectId).eq("evidence_supported", true),
      context.supabase.from("reflections").select("narrative").eq("project_id", projectId).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(2),
      context.supabase.from("project_skills").select("skills(name_en)").eq("project_id", projectId).eq("status", "counselor_confirmed"),
    ])
    const firstError = [tasksResult.error, evidenceResult.error, outcomesResult.error, reflectionsResult.error, skillsResult.error].find(Boolean)
    if (firstError) throw firstError
    const completedTasks = (tasksResult.data ?? []).map((task) => task.title)
    const selectedEvidence = (evidenceResult.data ?? []).map((item) => item.title)
    const outcomes = (outcomesResult.data ?? []).map((outcome) => outcome.actual_value || outcome.description)
    const reflections = (reflectionsResult.data ?? []).map((reflection) => reflection.narrative).filter((value): value is string => Boolean(value))
    const confirmedSkills = (skillsResult.data ?? []).map((item) => {
      const skill = item.skills as unknown as { name_en?: string } | Array<{ name_en?: string }> | null
      return Array.isArray(skill) ? skill[0]?.name_en : skill?.name_en
    }).filter((value): value is string => Boolean(value))
    const { data: page, error: pageError } = await context.supabase.from("portfolio_pages").upsert({ project_id: projectId, student_id: context.user.id, title: sanitizePlainText(project.title), status: "draft", confirmed_at: null, updated_at: new Date().toISOString() }, { onConflict: "project_id" }).select("id,title,status,confirmed_at").single()
    if (pageError) throw pageError
    const sections = [
      ["summary", "Project summary", `This editable draft is based on records in PortfolioPath. Planned objective: ${project.main_objective || "Add a project objective."}`],
      ["motivation", "Personal motivation", project.personal_motivation || "Add the student's personal motivation."],
      ["objective", "Objective", project.main_objective ? `Planned objective: ${project.main_objective}` : "Add a planned objective."],
      ["problem", "Problem or opportunity", project.problem_opportunity || "Add the problem, interest, or opportunity."],
      ["actions", "Actions completed", listText(completedTasks, "No completed tasks are selected yet.")],
      ["timeline", "Timeline", `Planned dates: ${project.start_date ?? "not set"} to ${project.end_date ?? "not set"}.`],
      ["evidence", "Selected evidence", listText(selectedEvidence, "No accepted evidence has been explicitly selected for sharing yet.")],
      ["outcomes", "Evidence-supported outcomes", listText(outcomes, "No evidence-supported outcomes are recorded yet.")],
      ["skills", "Counselor-confirmed skills", listText(confirmedSkills, "No counselor-confirmed skills are recorded yet.")],
      ["reflection", "Student reflection", listText(reflections, "Add a submitted student reflection before sharing." )],
      ["future", "Future development", project.final_deliverable ? `Planned final deliverable: ${project.final_deliverable}` : "Describe the next realistic step separately from completed work."],
    ].map(([sectionType, title, content], sortOrder) => ({ portfolio_page_id: page.id, section_type: sectionType, title, content, visible: true, sort_order: sortOrder }))
    const { error: sectionError } = await context.supabase.from("portfolio_sections").upsert(sections, { onConflict: "portfolio_page_id,section_type" })
    if (sectionError) throw sectionError
    return NextResponse.json({ portfolio: page }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}

export async function PATCH(request: Request, route: { params: Promise<{ projectId: string }> }) {
  try {
    const input = updateSchema.parse(await request.json())
    const { projectId } = await route.params
    const access = await assertPortfolioAccess(projectId)
    if (access.error) return access.error
    const { data: page, error: pageError } = await access.context.supabase.from("portfolio_pages").select("id").eq("project_id", projectId).maybeSingle()
    if (pageError) throw pageError
    if (!page) return NextResponse.json({ error: "Create a portfolio draft before editing it." }, { status: 404 })
    const content = input.sections.map((section) => section.content).join(" ")
    const unsupported = findUnsupportedClaims(content)
    if (unsupported.length) return NextResponse.json({ error: `Qualify unsupported wording before saving: ${unsupported.join(", ")}` }, { status: 422 })
    const sections = input.sections.map((section) => ({ portfolio_page_id: page.id, section_type: section.sectionType, title: sanitizePlainText(section.title), content: sanitizePlainText(section.content), visible: section.visible, sort_order: section.sortOrder }))
    const { error: sectionError } = await access.context.supabase.from("portfolio_sections").upsert(sections, { onConflict: "portfolio_page_id,section_type" })
    if (sectionError) throw sectionError
    const { data: updated, error: updateError } = await access.context.supabase.from("portfolio_pages").update({ status: input.confirmFactualAccuracy ? "published" : "ready", confirmed_at: input.confirmFactualAccuracy ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", page.id).select("id,status,confirmed_at,updated_at").single()
    if (updateError) throw updateError
    return NextResponse.json({ portfolio: updated })
  } catch (error) {
    return invalid(error)
  }
}
