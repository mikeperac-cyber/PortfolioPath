import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { sanitizePlainText } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ requestId: z.string().uuid(), status: z.enum(["confirmed", "clarification_requested", "declined"]), response: z.string().trim().min(10).max(2000) })

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    const context = await getApiContext(["mentor"])
    if (context.error) return context.error
    const admin = createAdminClient()
    const { data: requestRow } = await admin.from("mentor_verification_requests").select("id").eq("id", input.requestId).eq("mentor_user_id", context.user.id).eq("status", "pending").maybeSingle()
    if (!requestRow) return NextResponse.json({ error: "This verification request is unavailable." }, { status: 404 })
    const { error } = await admin.from("mentor_verification_requests").update({ status: input.status, mentor_response: sanitizePlainText(input.response), responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", input.requestId)
    if (error) throw error
    await admin.from("audit_logs").insert({ actor_id: context.user.id, action: "MENTOR_VERIFICATION_RESPONDED", entity_type: "mentor_verification_request", entity_id: input.requestId, new_data: { status: input.status } })
    return NextResponse.json({ saved: true })
  } catch (error) {
    return invalid(error)
  }
}
