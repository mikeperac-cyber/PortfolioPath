import type { CheckoutInput, PaymentProvider } from "./types"
export class TestPaymentProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput) { return { url: `${input.successUrl}?testPayment=success&plan=${input.planCode}`, providerReference: `test_${crypto.randomUUID()}` } }
  async createPortal(_customerId: string, returnUrl: string) { return { url: `${returnUrl}?testPortal=true` } }
  async verifyWebhook(payload: string) { const parsed = JSON.parse(payload) as { id?: string; type?: string; data?: unknown }; return { id: parsed.id ?? crypto.randomUUID(), type: parsed.type ?? "test.completed", data: parsed.data } }
}
