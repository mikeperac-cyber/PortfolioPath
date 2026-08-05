import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hashInvitationToken } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ token: z.string().min(32).max(128) })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext()
    if (context.error) return context.error
    const admin = createAdminClient()
    const { data: invite, error } = await admin
      .from("relationship_invites")
      .select("id,student_id,invitee_email,invite_role,permissions,expires_at,accepted_at,revoked_at")
      .eq("token_hash", hashInvitationToken(input.token))
      .maybeSingle()
    if (error) throw error
    if (!invite || invite.revoked_at || invite.accepted_at || new Date(invite.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "This invitation is no longer available." }, { status: 410 })
    if (invite.invitee_email.toLowerCase() !== context.user.email.toLowerCase()) return NextResponse.json({ error: "Sign in with the email address that received this invitation." }, { status: 403 })

    const role = invite.invite_role as "parent" | "mentor"
    const { error: grantError } = await admin.from("user_role_grants").insert({ user_id: context.user.id, role, granted_by: invite.student_id }).select("id").maybeSingle()
    if (grantError && !grantError.message.toLowerCase().includes("duplicate")) throw grantError
    if (role === "parent") {
      const { error: profileError } = await admin.from("parent_profiles").upsert({ user_id: context.user.id }, { onConflict: "user_id" })
      if (profileError) throw profileError
      const { error: linkError } = await admin.from("parent_student_links").upsert({ parent_user_id: context.user.id, student_id: invite.student_id, permissions: invite.permissions }, { onConflict: "parent_user_id,student_id" })
      if (linkError) throw linkError
    } else {
      const { error: profileError } = await admin.from("mentor_profiles").upsert({ user_id: context.user.id }, { onConflict: "user_id" })
      if (profileError) throw profileError
      const { error: linkError } = await admin.from("mentor_student_links").upsert({ mentor_user_id: context.user.id, student_id: invite.student_id }, { onConflict: "mentor_user_id,student_id" })
      if (linkError) throw linkError
    }
    const { error: acceptError } = await admin.from("relationship_invites").update({ accepted_by: context.user.id, accepted_at: new Date().toISOString() }).eq("id", invite.id)
    if (acceptError) throw acceptError
    await admin.from("audit_logs").insert({ actor_id: context.user.id, action: "RELATIONSHIP_INVITE_ACCEPTED", entity_type: "relationship_invite", entity_id: invite.id, new_data: { role } })
    return NextResponse.json({ workspace: role })
  } catch (error) {
    return invalid(error)
  }
}
