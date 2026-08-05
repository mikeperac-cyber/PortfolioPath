import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { getPaymentProviderName } from "@/lib/payments"
import { fulfillPaymentSession, findPaymentSession } from "@/lib/payments/fulfillment"

export async function GET(request: Request) {
  const context = await getApiContext()
  if (context.error) return context.error
  if (getPaymentProviderName() !== "test") return NextResponse.json({ error: "This route is only available for local test payments." }, { status: 404 })
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session")
  const locale = url.searchParams.get("locale") === "tr" ? "tr" : "en"
  const workspace = url.searchParams.get("workspace") === "counselor" ? "counselor" : "student"
  if (!sessionId) return NextResponse.redirect(new URL(`/${locale}/pricing?checkout=failed`, url.origin), 303)
  const session = await findPaymentSession({ id: sessionId })
  if (!session || session.user_id !== context.user.id || session.provider !== "test") return NextResponse.json({ error: "Payment session not found." }, { status: 404 })
  await fulfillPaymentSession(session, { id: `test_${session.id}`, type: "test.checkout_completed", status: "paid", conversationId: session.id, data: {} })
  return NextResponse.redirect(new URL(`/${locale}/${workspace}/subscription?checkout=success`, url.origin), 303)
}
