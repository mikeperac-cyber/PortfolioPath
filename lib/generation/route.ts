import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { GenerationType } from "@/lib/domain"
import { getApiContext } from "@/lib/api-auth"
import { getGenerationProvider } from "@/lib/generation"
import { hasEntitlement, projectIdeaLimit, resolveEntitlements } from "@/lib/entitlements"
import { hashInput } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"
import type { GeneratedResult, ProjectIdea } from "@/lib/generation/types"

const sourceBoundTypes = new Set<GenerationType>([
  "project_blueprint",
  "portfolio_text",
  "presentation",
  "recommendation_evidence",
  "personal_statement_connection",
  "interview_preparation",
  "progress_summary",
])

function requestedIds(input: Record<string, unknown>) {
  return Array.isArray(input.sourceRecordIds)
    ? input.sourceRecordIds.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))
    : []
}

async function verifiedProjectContext(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
) {
  const projectId = typeof input.projectId === "string" ? input.projectId : ""
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) throw new Error("Choose a project before generating this draft.")

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title,main_objective,personal_motivation,problem_opportunity,final_deliverable,status")
    .eq("id", projectId)
    .maybeSingle()
  if (projectError) throw projectError
  if (!project) throw new Error("This project is not available to your account.")

  const [{ data: tasks, error: tasksError }, { data: evidence, error: evidenceError }, { data: outcomes, error: outcomesError }, { data: skills, error: skillsError }, { data: reflections, error: reflectionsError }] = await Promise.all([
    supabase.from("tasks").select("id,title,obstacle_notes,student_reflection").eq("project_id", projectId).eq("status", "complete"),
    supabase.from("evidence").select("id,title,description,student_explanation").eq("project_id", projectId).eq("review_status", "accepted"),
    supabase.from("project_outcomes").select("id,description,actual_value").eq("project_id", projectId).eq("evidence_supported", true),
    supabase.from("project_skills").select("id,status,skills(name_en)").eq("project_id", projectId).eq("status", "counselor_confirmed"),
    supabase.from("reflections").select("id,narrative").eq("project_id", projectId).not("submitted_at", "is", null),
  ])
  if (tasksError || evidenceError || outcomesError || skillsError || reflectionsError) throw tasksError ?? evidenceError ?? outcomesError ?? skillsError ?? reflectionsError

  const sourceIds = [
    ...(tasks ?? []).map((row) => row.id),
    ...(evidence ?? []).map((row) => row.id),
    ...(outcomes ?? []).map((row) => row.id),
    ...(skills ?? []).map((row) => row.id),
    ...(reflections ?? []).map((row) => row.id),
  ]
  const requested = requestedIds(input)
  if (requested.some((id) => !sourceIds.includes(id))) throw new Error("One or more selected source records are not verified project records.")
  const selectedSourceIds = requested.length ? requested : sourceIds

  const completedActions = (tasks ?? []).map((row) => row.title)
  const confirmedSkills = (skills ?? []).map((row) => {
    const joined = row.skills as unknown as { name_en?: string } | Array<{ name_en?: string }> | null
    return Array.isArray(joined) ? joined[0]?.name_en : joined?.name_en
  }).filter((value): value is string => Boolean(value))
  const selectedOutcomes = (outcomes ?? []).map((row) => row.actual_value || row.description)
  const sourceMoments = (reflections ?? []).map((row) => row.narrative).filter((value): value is string => Boolean(value)).slice(0, 5)
  const acceptedEvidence = (evidence ?? []).map((row) => row.title)
  const submittedReflections = sourceMoments

  return {
    sourceRecordIds: selectedSourceIds,
    verifiedCount: sourceIds.length,
    input: {
      ...input,
      projectId,
      title: project.title,
      objective: project.main_objective ?? "complete a documented objective",
      motivation: project.personal_motivation ?? "",
      problem: project.problem_opportunity ?? "",
      deliverable: project.final_deliverable ?? "",
      completedActions,
      acceptedEvidence,
      submittedReflections,
      outcomes: selectedOutcomes,
      confirmedSkills,
      sourceMoments,
      sourceRecords: [
        ...completedActions,
        ...(evidence ?? []).map((row) => row.title),
        ...selectedOutcomes,
      ],
    },
  }
}

async function runGeneration(type: GenerationType, input: Record<string, unknown>, context: { userId: string; projectId?: string; locale: "en" | "tr"; sourceRecordIds: string[] }): Promise<GeneratedResult<unknown>> {
  const provider = getGenerationProvider()
  switch (type) {
    case "project_ideas": return provider.projectIdeas(input, context)
    case "project_blueprint": return provider.projectBlueprint(input, context)
    case "reflection_support": return provider.reflectionSupport(input, context)
    case "portfolio_text": return provider.portfolioText(input, context)
    case "presentation": return provider.presentation(input, context)
    case "recommendation_evidence": return provider.recommendationEvidence(input, context)
    case "personal_statement_connection": return provider.personalStatementConnection(input, context)
    case "interview_preparation": return provider.interviewPreparation(input, context)
    case "progress_summary": return provider.progressSummary(input, context)
    case "admissions_export": return provider.admissionsExport(input, context)
  }
}

function entitlementFailure(type: GenerationType) {
  if (type === "project_blueprint") return "A Project Blueprint or Complete Portfolio plan is required for this draft."
  if (type === "progress_summary") return "An active Counselor Professional plan is required for progress summaries."
  return "This feature is included with the Complete Student Portfolio plan."
}

function mayGenerate(type: GenerationType, entitlements: Awaited<ReturnType<typeof resolveEntitlements>>) {
  if (type === "project_ideas") return true
  if (type === "project_blueprint") return (entitlements.project_limit ?? 0) > 0
  if (type === "progress_summary") return hasEntitlement(entitlements, "progress_summaries")
  return hasEntitlement(entitlements, "workspace")
}

export async function generateResponse(type: GenerationType, input: Record<string, unknown>, sourceRecordIds: string[] = []) {
  const context = await getApiContext(type === "progress_summary" ? ["counselor"] : ["student", "counselor"])
  if (context.error) return context.error
  const { supabase, user } = context
  const entitlements = await resolveEntitlements(supabase, user.id, { isPlatformOwner: user.roles.includes("platform_owner") })
  if (!mayGenerate(type, entitlements)) return NextResponse.json({ error: entitlementFailure(type) }, { status: 403 })

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase.from("generation_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since)
  if ((count ?? 0) >= 20) return NextResponse.json({ error: "Generation limit reached. Try again later." }, { status: 429, headers: { "Retry-After": "3600" } })

  const locale: "en" | "tr" = input.locale === "tr" ? "tr" : "en"
  let providerInput = input
  let verifiedIds = sourceRecordIds
  if (sourceBoundTypes.has(type)) {
    const verified = await verifiedProjectContext(supabase, input)
    if (type !== "project_blueprint" && verified.verifiedCount === 0) {
      return NextResponse.json({ error: "Add a completed task, accepted evidence, submitted reflection, supported outcome, or confirmed skill before generating this draft." }, { status: 422 })
    }
    providerInput = verified.input
    verifiedIds = verified.sourceRecordIds
    if (type === "progress_summary") {
      providerInput = {
        ...verified.input,
        completed: verified.input.completedActions,
        evidenceReviewed: verified.input.acceptedEvidence,
        reflections: verified.input.submittedReflections,
        confirmedSkills: verified.input.confirmedSkills,
        concerns: [],
        nextSteps: ["Review the current milestone and agree the next factual action with the student."],
      }
    }
  }

  const generationContext = { userId: user.id, projectId: typeof providerInput.projectId === "string" ? providerInput.projectId : undefined, locale, sourceRecordIds: verifiedIds }
  const result = await runGeneration(type, providerInput, generationContext)

  const resultData = type === "project_ideas"
    ? { ...result, data: (result.data as ProjectIdea[]).slice(0, projectIdeaLimit(entitlements)) }
    : result
  const { error: logError } = await createAdminClient().from("generation_requests").insert({
    user_id: user.id,
    project_id: generationContext.projectId ?? null,
    generation_type: type,
    provider: "template",
    source_record_ids: verifiedIds,
    input_hash: hashInput(providerInput),
    output: resultData.data,
    warnings: resultData.provenance.warnings,
  })
  if (logError) return NextResponse.json({ error: "The guidance was not returned because its provenance record could not be stored." }, { status: 500 })
  return NextResponse.json(resultData)
}
