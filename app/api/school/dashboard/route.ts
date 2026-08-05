import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const context = await getApiContext(["school_admin", "school_counselor"])
  if (context.error) return context.error
  const admin = createAdminClient()
  const { data: memberships, error } = await admin
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", context.user.id)
    .eq("active", true)
  if (error) return NextResponse.json({ error: "School access could not be loaded." }, { status: 500 })
  const organizationIds = (memberships ?? []).map((membership) => membership.organization_id)
  if (!organizationIds.length) return NextResponse.json({ organizations: [] })
  const { data: organizations } = await admin.from("organizations").select("id,name,status,seat_limit,annual_contract_ends_at").in("id", organizationIds)
  const { data: cohorts } = await admin.from("school_cohorts").select("id,organization_id,name,graduation_year").in("organization_id", organizationIds)
  const cohortIds = (cohorts ?? []).map((cohort) => cohort.id)
  const { data: cohortStudents } = cohortIds.length ? await admin.from("school_cohort_students").select("cohort_id,student_id").in("cohort_id", cohortIds) : { data: [] as Array<{ cohort_id: string; student_id: string }> }
  return NextResponse.json({ organizations: (organizations ?? []).map((organization) => ({ ...organization, membershipRole: memberships?.find((membership) => membership.organization_id === organization.id)?.role, cohorts: (cohorts ?? []).filter((cohort) => cohort.organization_id === organization.id).map((cohort) => ({ ...cohort, studentCount: (cohortStudents ?? []).filter((membership) => membership.cohort_id === cohort.id).length })) })) })
}
