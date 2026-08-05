import type { PaymentProvider } from "./types"
import { StripePaymentProvider } from "./stripe-provider"
import { TestPaymentProvider } from "./test-provider"
export function getPaymentProvider(): PaymentProvider { return process.env.PAYMENT_PROVIDER === "stripe" ? new StripePaymentProvider() : new TestPaymentProvider() }
export * from "./types"
