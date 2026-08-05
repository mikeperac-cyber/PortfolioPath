import { NextResponse } from "next/server"
import { getApiContext, invalid } from "@/lib/api-auth"
import { hasRole, workspacePath } from "@/lib/auth"
import { getPaymentProvider } from "@/lib/payments"

export async function POST(request: Request) {
  try {
    const context = await getApiContext()
    if (context.error) return context.error
    if (hasRole(context.user, "platform_owner")) return NextResponse.json({ error: "Platform Owner access has no billing portal." }, { status: 403 })
    const { data } = await context.supabase.from("subscriptions").select("provider_customer_id").eq("user_id", context.user.id).not("provider_customer_id", "is", null).limit(1).maybeSingle()
    if (!data?.provider_customer_id) return NextResponse.json({ error: "No payment customer is connected to this account." }, { status: 404 })
    const workspace = hasRole(context.user, "counselor") ? "counselor" : "student"
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
    return NextResponse.json(await getPaymentProvider().createPortal(data.provider_customer_id, `${origin}${workspacePath(context.user.locale, workspace)}/subscription`))
  } catch (error) {
    return invalid(error)
  }
}
