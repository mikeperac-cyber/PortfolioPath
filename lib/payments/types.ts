export type BillablePlanCode = "blueprint" | "complete" | "counselor"

export type BillingCustomer = {
  fullName: string
  identityNumber: string
  phone: string
  address: string
  city: string
  country: string
  postalCode: string
  district?: string
  requestIp?: string
}

export type CheckoutInput = {
  sessionId: string
  userId: string
  email: string
  planCode: BillablePlanCode
  planName: string
  amountTry: number
  locale: "en" | "tr"
  successUrl: string
  cancelUrl: string
  callbackUrl?: string
  customer: BillingCustomer | null
}

export type CheckoutResult = {
  url: string
  providerReference: string
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
}

export type PaymentEvent = {
  id: string
  type: string
  status: "paid" | "pending" | "failed" | "canceled" | "received"
  conversationId?: string | null
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  data: Record<string, unknown>
}

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  createPortal(customerId: string, returnUrl: string): Promise<{ url: string }>
  verifyWebhook(payload: string, headers: Headers): Promise<PaymentEvent>
  retrieveCheckout?(input: { token: string; conversationId: string; locale: "en" | "tr" }): Promise<PaymentEvent>
  cancelSubscription?(subscriptionId: string): Promise<void>
}
