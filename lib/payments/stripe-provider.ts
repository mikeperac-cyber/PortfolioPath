import Stripe from "stripe";
import type { CheckoutInput, PaymentEvent, PaymentProvider } from "./types";

export class StripePaymentProvider implements PaymentProvider {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  async createCheckout(input: CheckoutInput) {
    const price = {
      blueprint: process.env.STRIPE_BLUEPRINT_PRICE_ID,
      complete: process.env.STRIPE_COMPLETE_PRICE_ID,
      counselor: process.env.STRIPE_COUNSELOR_PRICE_ID,
    }[input.planCode];
    if (!price) throw new Error("Stripe price is not configured.");
    const session = await this.stripe.checkout.sessions.create({
      mode: input.planCode === "counselor" ? "subscription" : "payment",
      customer_email: input.email,
      line_items: [{ price, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId,
        planCode: input.planCode,
        paymentSessionId: input.sessionId,
      },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url, providerReference: session.id };
  }
  async createPortal(customerId: string, returnUrl: string) {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }
  async verifyWebhook(payload: string, headers: Headers) {
    const signature = headers.get("stripe-signature");
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
      throw new Error("Invalid webhook signature.");
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    const object = event.data.object as unknown as Record<string, unknown>;
    const metadata = object.metadata as Record<string, unknown> | undefined;
    const status: PaymentEvent["status"] =
      event.type.includes("completed") ||
      event.type.includes("succeeded") ||
      event.type.includes("paid")
        ? "paid"
        : event.type.includes("failed")
          ? "failed"
          : event.type.includes("canceled")
            ? "canceled"
            : "received";
    return {
      id: event.id,
      type: event.type,
      status,
      conversationId:
        typeof metadata?.paymentSessionId === "string"
          ? metadata.paymentSessionId
          : null,
      providerCustomerId:
        typeof object.customer === "string" ? object.customer : null,
      providerSubscriptionId:
        typeof object.subscription === "string" ? object.subscription : null,
      data: object,
    };
  }
  async cancelSubscription(subscriptionId: string) {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }
}
