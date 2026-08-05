import { NextResponse } from "next/server"
import { getPaymentProvider, getPaymentProviderName } from "@/lib/payments"
import { fulfillPaymentSession, findPaymentSession } from "@/lib/payments/fulfillment"

function redirect(request: Request, session: { plans: { code: string } | Array<{ code: string }> | null } | null, query: string) {
  const locale = new URL(request.url).searchParams.get("locale") === "tr" ? "tr" : "en"
  const plan = Array.isArray(session?.plans) ? session?.plans[0] : session?.plans
  const workspace = plan?.code === "counselor" ? "counselor" : "student"
  return NextResponse.redirect(new URL(`/${locale}/${workspace}/subscription?${query}`, process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin), 303)
}

export async function POST(request: Request) {
  if (getPaymentProviderName() !== "iyzico") return NextResponse.json({ error: "Not found." }, { status: 404 })
  const sessionId = new URL(request.url).searchParams.get("session")
  const session = sessionId ? await findPaymentSession({ id: sessionId }) : null
  if (!session || session.provider !== "iyzico") return redirect(request, null, "checkout=failed")
  try {
    const form = await request.formData()
    const token = String(form.get("token") ?? "")
    if (!token || (session.provider_session_id && token !== session.provider_session_id)) return redirect(request, session, "checkout=failed")
    const plan = Array.isArray(session.plans) ? session.plans[0] : session.plans
    if (plan?.code === "counselor") return redirect(request, session, "checkout=processing")
    const provider = getPaymentProvider()
    if (!provider.retrieveCheckout) return redirect(request, session, "checkout=failed")
    const event = await provider.retrieveCheckout({ token, conversationId: session.id, locale: new URL(request.url).searchParams.get("locale") === "tr" ? "tr" : "en" })
    const result = await fulfillPaymentSession(session, event)
    return redirect(request, session, result.paid ? "checkout=success" : "checkout=failed")
  } catch {
    return redirect(request, session, "checkout=failed")
  }
}
