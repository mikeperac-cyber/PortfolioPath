import { NextResponse } from "next/server"
import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import { sanitizePlainText } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ contactName: z.string().trim().min(2).max(120), workEmail: z.string().trim().email().max(254), organizationName: z.string().trim().min(2).max(160), estimatedStudents: z.coerce.number().int().min(1).max(10000).optional(), message: z.string().max(2000).optional() })

export async function POST(request: Request) {
  try {
    const rate = enforceRateLimit(request, "school-quote", 5, 60 * 60 * 1000)
    if (!rate.allowed) return NextResponse.json({ error: "Too many quote requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } })
    const input = schema.parse(await request.json())
    const { error } = await createAdminClient().from("school_quote_requests").insert({
      contact_name: sanitizePlainText(input.contactName),
      work_email: input.workEmail.toLowerCase(),
      organization_name: sanitizePlainText(input.organizationName),
      estimated_students: input.estimatedStudents ?? null,
      message: input.message ? sanitizePlainText(input.message) : null,
    })
    if (error) throw error
    return NextResponse.json({ received: true }, { status: 201 })
  } catch (error) {
    return invalid(error)
  }
}
