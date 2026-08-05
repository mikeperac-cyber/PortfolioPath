import type { PaymentProvider } from "./types";
import { IyzicoPaymentProvider } from "./iyzico-provider";
import { StripePaymentProvider } from "./stripe-provider";
import { TestPaymentProvider } from "./test-provider";
export type PaymentProviderName = "test" | "stripe" | "iyzico";

export function getPaymentProviderName(): PaymentProviderName {
  return process.env.PAYMENT_PROVIDER === "iyzico" ||
    process.env.PAYMENT_PROVIDER === "stripe"
    ? process.env.PAYMENT_PROVIDER
    : "test";
}

export function getPaymentProviderForName(
  provider: PaymentProviderName | string,
): PaymentProvider {
  if (provider === "iyzico") return new IyzicoPaymentProvider();
  if (provider === "stripe") return new StripePaymentProvider();
  return new TestPaymentProvider();
}

export function getPaymentProvider(): PaymentProvider {
  return getPaymentProviderForName(getPaymentProviderName());
}
export * from "./types";
