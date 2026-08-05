import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { canCreateProject, resolveEntitlements } from "@/lib/entitlements"
import { findUnsupportedClaims, sanitizePlainText } from "@/lib/security"

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().min(2).max(100),
  motivation: z.string().min(10).max(3000),
  problem: z.string().min(10).max(3000),
  objective: z.string().min(10).max(1500),
  audience: z.string().min(2).max(1000),
  outcome1: z.string().min(3).max(500),
  outcome2: z.string().min(3).max(500),
  outcome3: z.string().min(3).max(500),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  weeklyHours: z.coerce.number().min(1).max(30),
  milestones: z.string().min(5).max(5000),
  evidencePlan: z.string().min(5).max(3000),
  skills: z.string().min(2).max(1000),
  risks: z.string().min(5).max(3000),
  deliverable: z.string().min(3).max(1000),
})

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["student"])
    if (context.error) return context.error

    const { supabase, user } = context
    const claims = findUnsupportedClaims(Object.values(input).join(" "))
    if (claims.length) {
      return NextResponse.json(
        { error: `Qualify unsupported wording before submission: ${claims.join(", ")}` },
        { status: 422 },
      )
    }

    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .neq("status", "archived")
    const entitlements = await resolveEntitlements(supabase, user.id, {
      isPlatformOwner: user.roles.includes("platform_owner"),
    })
    if (!canCreateProject(entitlements, count ?? 0)) {
      return NextResponse.json(
        { error: "Your current plan project limit has been reached. Upgrade or ask your counselor about a complimentary access grant." },
        { status: 403 },
      )
    }

    const { data: category } = await supabase
      .from("project_categories")
      .select("id")
      .eq("name_en", input.category)
      .maybeSingle()
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        student_id: user.id,
        category_id: category?.id ?? null,
        title: sanitizePlainText(input.title),
        personal_motivation: sanitizePlainText(input.motivation),
        problem_opportunity: sanitizePlainText(input.problem),
        main_objective: sanitizePlainText(input.objective),
        target_audience: sanitizePlainText(input.audience),
        start_date: input.startDate,
        end_date: input.endDate,
        weekly_hours: input.weeklyHours,
        risks: sanitizePlainText(input.risks),
        final_deliverable: sanitizePlainText(input.deliverable),
        status: "awaiting_counselor_review",
      })
      .select("id")
      .single()
    if (error) throw error

    const { error: outcomeError } = await supabase.from("project_outcomes").insert(
      [input.outcome1, input.outcome2, input.outcome3].map((description, index) => ({
        project_id: project.id,
        description: sanitizePlainText(description),
        target_value: null,
        sort_order: index,
      })),
    )
    if (outcomeError) throw outcomeError

    const milestones = input.milestones.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
    const { data: weeks, error: weeksError } = await supabase
      .from("project_weeks")
      .insert(milestones.map((milestone, index) => ({ project_id: project.id, week_number: index + 1, milestone: sanitizePlainText(milestone) })))
      .select("id,week_number,milestone")
    if (weeksError) throw weeksError

    const start = new Date(`${input.startDate}T12:00:00Z`)
    const tasks = (weeks ?? []).map((week) => ({
      project_id: project.id,
      week_id: week.id,
      title: `Complete: ${week.milestone}`,
      description: "Document the work you genuinely complete, then attach evidence and a reflection.",
      due_at: new Date(start.getTime() + Math.max(0, week.week_number - 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_minutes: Math.round(Number(input.weeklyHours) * 60),
      status: "not_started" as const,
    }))
    if (tasks.length) {
      const { error: taskError } = await supabase.from("tasks").insert(tasks)
      if (taskError) throw taskError
    }

    const requestedSkills = [...new Set(input.skills.split(/[\n,;]/).map((value) => value.trim().toLowerCase()).filter(Boolean))]
    if (requestedSkills.length) {
      const { data: catalog, error: skillsError } = await supabase.from("skills").select("id,name_en").eq("active", true)
      if (skillsError) throw skillsError
      const selected = (catalog ?? []).filter((skill) => requestedSkills.includes(skill.name_en.toLowerCase()))
      if (selected.length) {
        const { error: projectSkillsError } = await supabase.from("project_skills").insert(selected.map((skill) => ({ project_id: project.id, skill_id: skill.id, status: "target" })))
        if (projectSkillsError) throw projectSkillsError
      }
    }

    return NextResponse.json({ id: project.id, status: "awaiting_counselor_review" }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
