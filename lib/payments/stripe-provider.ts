import Stripe from "stripe"
import type { CheckoutInput, PaymentProvider } from "./types"

export class StripePaymentProvider implements PaymentProvider {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  async createCheckout(input: CheckoutInput) {
    const price = { blueprint: process.env.STRIPE_BLUEPRINT_PRICE_ID, complete: process.env.STRIPE_COMPLETE_PRICE_ID, counselor: process.env.STRIPE_COUNSELOR_PRICE_ID }[input.planCode]
    if (!price) throw new Error("Stripe price is not configured.")
    const session = await this.stripe.checkout.sessions.create({ mode: input.planCode === "counselor" ? "subscription" : "payment", customer_email: input.email, line_items: [{ price, quantity: 1 }], success_url: input.successUrl, cancel_url: input.cancelUrl, metadata: { userId: input.userId, planCode: input.planCode } })
    if (!session.url) throw new Error("Stripe did not return a checkout URL.")
    return { url: session.url, providerReference: session.id }
  }
  async createPortal(customerId: string, returnUrl: string) { const session = await this.stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl }); return { url: session.url } }
  async verifyWebhook(payload: string, signature: string | null) { if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Invalid webhook signature."); const event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET); return { id: event.id, type: event.type, data: event.data.object } }
}
