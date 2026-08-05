export type CheckoutInput = { userId: string; email: string; planCode: "blueprint" | "complete" | "counselor"; successUrl: string; cancelUrl: string }
export type CheckoutResult = { url: string; providerReference: string }
export interface PaymentProvider { createCheckout(input: CheckoutInput): Promise<CheckoutResult>; createPortal(customerId: string, returnUrl: string): Promise<{ url: string }>; verifyWebhook(payload: string, signature: string | null): Promise<{ id: string; type: string; data: unknown }> }
