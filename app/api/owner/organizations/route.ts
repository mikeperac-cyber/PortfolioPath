import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { sanitizePlainText } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), seatLimit: z.coerce.number().int().min(1).max(10000).default(25) })

export async function GET() {
  const context = await getApiContext(["platform_owner"])
  if (context.error) return context.error
  const { data, error } = await createAdminClient().from("organizations").select("id,name,slug,status,seat_limit,annual_contract_ends_at,created_at").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Organizations could not be loaded." }, { status: 500 })
  return NextResponse.json({ organizations: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["platform_owner"])
    if (context.error) return context.error
    const admin = createAdminClient()
    const { data: organization, error } = await admin.from("organizations").insert({ name: sanitizePlainText(input.name), slug: input.slug, kind: "school", status: "prospect", seat_limit: input.seatLimit, created_by: context.user.id }).select("id,name,slug").single()
    if (error) throw error
    await admin.from("organization_memberships").insert({ organization_id: organization.id, user_id: context.user.id, role: "owner" })
    await admin.from("audit_logs").insert({ actor_id: context.user.id, action: "OWNER_ORGANIZATION_CREATED", entity_type: "organization", entity_id: organization.id, new_data: { name: organization.name } })
    return NextResponse.json({ organization }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
