import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { hasRole } from "@/lib/auth"
import { getPaymentProviderName } from "@/lib/payments"

export async function GET() {
  const context = await getApiContext()
  if (context.error) return context.error
  const provider = getPaymentProviderName()
  const { data: subscriptions } = await context.supabase.from("subscriptions").select("status,plans(code,name_en)").eq("user_id", context.user.id).in("status", ["active", "trialing", "past_due"])
  const { data: documents } = await context.supabase.from("billing_documents").select("id,document_kind,provider,provider_reference,issued_at").eq("user_id", context.user.id).order("issued_at", { ascending: false }).limit(10)
  const activePlans = (subscriptions ?? []).map((subscription) => {
    const plan = Array.isArray(subscription.plans) ? subscription.plans[0] : subscription.plans
    return { code: plan?.code ?? "", name: plan?.name_en ?? "Plan", status: subscription.status }
  }).filter((plan) => plan.code)
  return NextResponse.json({
    provider,
    requiresBillingDetails: provider === "iyzico",
    ownerAccess: hasRole(context.user, "platform_owner"),
    activePlans,
    documents: documents ?? [],
  })
}
