import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasEntitlement, resolveEntitlements } from "@/lib/entitlements"
import { enforceRateLimit } from "@/lib/rate-limit"
import { createInvitationToken, hashInvitationToken } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({
  role: z.enum(["parent", "mentor"]),
  email: z.string().trim().email().max(254),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(14),
})

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["student"])
    if (context.error) return context.error
    const rate = enforceRateLimit(request, `relationship-invite:${context.user.id}`, 12, 60 * 60 * 1000)
    if (!rate.allowed) return NextResponse.json({ error: "Too many invitations were created. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } })
    const entitlements = await resolveEntitlements(context.supabase, context.user.id, { isPlatformOwner: context.user.roles.includes("platform_owner") })
    const permitted = input.role === "parent" ? hasEntitlement(entitlements, "parent_access") : hasEntitlement(entitlements, "mentor_verification")
    if (!permitted) return NextResponse.json({ error: input.role === "parent" ? "Parent access is included with Complete Student Portfolio or an owner-issued grant." : "Mentor verification is included with Complete Student Portfolio or an owner-issued grant." }, { status: 403 })
    const token = createInvitationToken()
    const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    const { data: invitation, error } = await createAdminClient()
      .from("relationship_invites")
      .insert({
        student_id: context.user.id,
        requested_by: context.user.id,
        invitee_email: input.email.toLowerCase(),
        invite_role: input.role,
        token_hash: hashInvitationToken(token),
        expires_at: expiresAt,
        permissions: input.role === "parent" ? { project_progress: true, selected_evidence: true, counselor_updates: true } : {},
      })
      .select("id,expires_at")
      .single()
    if (error) throw error
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
    await createAdminClient().from("audit_logs").insert({ actor_id: context.user.id, action: "RELATIONSHIP_INVITE_CREATED", entity_type: "relationship_invite", entity_id: invitation.id, new_data: { role: input.role, expiresAt } })
    return NextResponse.json({ invitation: { id: invitation.id, expiresAt: invitation.expires_at, url: `${origin}/${context.user.locale}/invite/${token}` } }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
