import type { CheckoutInput, PaymentProvider } from "./types"
export class TestPaymentProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput) {
    const url = new URL(input.successUrl)
    url.searchParams.set("testPayment", "success")
    url.searchParams.set("plan", input.planCode)
    return { url: url.toString(), providerReference: `test_${crypto.randomUUID()}` }
  }
  async createPortal(_customerId: string, returnUrl: string) { return { url: `${returnUrl}?testPortal=true` } }
  async verifyWebhook(payload: string) {
    const parsed = JSON.parse(payload) as { id?: string; type?: string; data?: Record<string, unknown>; status?: "paid" | "pending" | "failed" | "canceled" | "received" }
    return { id: parsed.id ?? crypto.randomUUID(), type: parsed.type ?? "test.completed", status: parsed.status ?? "paid", data: parsed.data ?? {} }
  }
}
