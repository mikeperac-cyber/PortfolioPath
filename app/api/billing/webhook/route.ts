import { NextResponse } from "next/server"
import { getPaymentProvider } from "@/lib/payments"
import { fulfillPaymentSession, findPaymentSession } from "@/lib/payments/fulfillment"

export async function POST(request: Request) {
  try {
    const event = await getPaymentProvider().verifyWebhook(await request.text(), request.headers)
    const metadata = event.data.metadata as Record<string, unknown> | undefined
    const paymentSessionId = typeof metadata?.paymentSessionId === "string" ? metadata.paymentSessionId : undefined
    const session = await findPaymentSession({ id: paymentSessionId, conversationId: event.conversationId ?? undefined, providerSubscriptionId: event.providerSubscriptionId ?? undefined })
    if (!session) return NextResponse.json({ received: true, ignored: true })
    const result = await fulfillPaymentSession(session, event)
    return NextResponse.json({ received: true, paid: result.paid, idempotent: result.idempotent })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook rejected." }, { status: 400 })
  }
}
