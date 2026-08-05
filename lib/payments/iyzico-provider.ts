import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { buildIyzicoAuthorization } from "./iyzico-signature";
import type { CheckoutInput, PaymentEvent, PaymentProvider } from "./types";

type IyzicoResult = {
  status?: string;
  errorMessage?: string;
  errorCode?: string;
  token?: string;
  paymentPageUrl?: string;
  conversationId?: string;
  paymentStatus?: string;
  paymentId?: string | number;
  customerReferenceCode?: string;
  subscriptionReferenceCode?: string;
  [key: string]: unknown;
};

function value(input: unknown) {
  return typeof input === "string" || typeof input === "number"
    ? String(input)
    : "";
}

function isSuccess(input: unknown) {
  return String(input).toUpperCase() === "SUCCESS";
}

function safeEqual(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

/**
 * A dependency-free implementation of iyzico's documented IYZWSv2 protocol.
 * The current official Node package pulls a vulnerable legacy HTTP client, so
 * this adapter uses native server fetch and the same HMAC authorization scheme.
 */
export class IyzicoPaymentProvider implements PaymentProvider {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    if (!apiKey || !secretKey)
      throw new Error(
        "iyzico is not configured. Add IYZICO_API_KEY and IYZICO_SECRET_KEY on the server.",
      );
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = (
      process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com"
    ).replace(/\/+$/, "");
  }

  private async request(
    path: string,
    method: "POST" | "GET",
    body: Record<string, unknown> = {},
  ) {
    const randomKey = randomBytes(16).toString("hex");
    const bodyText = JSON.stringify(body);
    const authorization = buildIyzicoAuthorization({
      apiKey: this.apiKey,
      secretKey: this.secretKey,
      randomKey,
      path,
      bodyText,
    });
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        "x-iyzi-rnd": randomKey,
        "x-iyzi-client-version": "portfoliopath/1.0",
      },
      body: method === "POST" ? bodyText : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const responseText = await response.text();
    let result: IyzicoResult;
    try {
      result = JSON.parse(responseText) as IyzicoResult;
    } catch {
      throw new Error("iyzico returned an unreadable payment response.");
    }
    if (!response.ok || !isSuccess(result.status)) {
      const code = value(result.errorCode);
      throw new Error(
        code
          ? `iyzico could not initialize the payment (${code}).`
          : "iyzico could not initialize the payment.",
      );
    }
    return result;
  }

  private address(customer: NonNullable<CheckoutInput["customer"]>) {
    return {
      contactName: customer.fullName,
      city: customer.city,
      district: customer.district || customer.city,
      country: customer.country,
      address: customer.address,
      zipCode: customer.postalCode,
    };
  }

  private buyer(input: CheckoutInput) {
    if (!input.customer)
      throw new Error(
        "iyzico checkout requires the authorized payer's billing details.",
      );
    const [firstName, ...rest] = input.customer.fullName.trim().split(/\s+/);
    return {
      id: input.userId,
      name: firstName || input.customer.fullName,
      surname: rest.join(" ") || "-",
      gsmNumber: input.customer.phone,
      email: input.email,
      identityNumber: input.customer.identityNumber,
      registrationAddress: input.customer.address,
      ip: input.customer.requestIp || "0.0.0.0",
      city: input.customer.city,
      country: input.customer.country,
      zipCode: input.customer.postalCode,
    };
  }

  async createCheckout(input: CheckoutInput) {
    if (!input.customer)
      throw new Error(
        "iyzico checkout requires the authorized payer's billing details.",
      );
    if (!input.callbackUrl)
      throw new Error("iyzico checkout requires a server callback URL.");

    if (input.planCode === "counselor") {
      const pricingPlanReferenceCode =
        process.env.IYZICO_COUNSELOR_PRICING_PLAN_REFERENCE_CODE;
      if (!pricingPlanReferenceCode)
        throw new Error(
          "The iyzico Counselor Professional pricing plan is not configured.",
        );
      const result = await this.request(
        "/v2/subscription/checkoutform/initialize",
        "POST",
        {
          locale: input.locale,
          conversationId: input.sessionId,
          callbackUrl: input.callbackUrl,
          pricingPlanReferenceCode,
          subscriptionInitialStatus: "ACTIVE",
          customer: {
            ...this.buyer(input),
            billingAddress: this.address(input.customer),
            shippingAddress: this.address(input.customer),
          },
        },
      );
      if (!result.paymentPageUrl || !result.token)
        throw new Error("iyzico did not return a hosted checkout URL.");
      return {
        url: result.paymentPageUrl,
        providerReference: result.token,
        providerCustomerId: value(result.customerReferenceCode) || null,
        providerSubscriptionId: value(result.subscriptionReferenceCode) || null,
      };
    }

    const price = Number(input.amountTry.toFixed(2));
    const result = await this.request(
      "/payment/iyzipos/checkoutform/initialize/auth/ecom",
      "POST",
      {
        locale: input.locale,
        conversationId: input.sessionId,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: `portfoliopath:${input.sessionId}`,
        paymentGroup: "PRODUCT",
        paymentChannel: "WEB",
        callbackUrl: input.callbackUrl,
        enabledInstallments: [1],
        buyer: this.buyer(input),
        shippingAddress: this.address(input.customer),
        billingAddress: this.address(input.customer),
        basketItems: [
          {
            id: input.planCode,
            name: input.planName,
            category1: "Digital education",
            itemType: "VIRTUAL",
            price,
          },
        ],
      },
    );
    if (!result.paymentPageUrl || !result.token)
      throw new Error("iyzico did not return a hosted checkout URL.");
    return { url: result.paymentPageUrl, providerReference: result.token };
  }

  async createPortal(
    customerId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    void customerId;
    void returnUrl;
    throw new Error(
      "iyzico does not provide a self-service billing portal. Contact support or use the subscription cancellation control.",
    );
  }

  async retrieveCheckout(input: {
    token: string;
    conversationId: string;
    locale: "en" | "tr";
  }): Promise<PaymentEvent> {
    const result = await this.request(
      "/payment/iyzipos/checkoutform/auth/ecom/detail",
      "POST",
      {
        locale: input.locale,
        conversationId: input.conversationId,
        token: input.token,
      },
    );
    const paid = isSuccess(result.paymentStatus);
    return {
      id: value(result.paymentId) || input.token,
      type: "iyzico.checkout_form",
      status: paid ? "paid" : "failed",
      conversationId: value(result.conversationId) || input.conversationId,
      data: {
        paymentStatus: value(result.paymentStatus),
        paymentId: value(result.paymentId),
        token: input.token,
      },
    };
  }

  async verifyWebhook(
    payload: string,
    headers: Headers,
  ): Promise<PaymentEvent> {
    const body = JSON.parse(payload) as Record<string, unknown>;
    const signature = headers.get("x-iyz-signature-v3");
    if (!signature) throw new Error("Missing iyzico webhook signature.");

    const eventType = value(body.iyziEventType);
    const isSubscription = eventType.startsWith("subscription.");
    const message = isSubscription
      ? `${value(body.merchantId)}${this.secretKey}${eventType}${value(body.subscriptionReferenceCode)}${value(body.orderReferenceCode)}${value(body.customerReferenceCode)}`
      : `${this.secretKey}${eventType}${value(body.iyziPaymentId)}${value(body.token)}${value(body.paymentConversationId)}${value(body.status)}`;
    const expected = createHmac("sha256", this.secretKey)
      .update(message)
      .digest("hex");
    if (!safeEqual(signature, expected))
      throw new Error("Invalid iyzico webhook signature.");

    const paid = isSubscription
      ? eventType === "subscription.order.success"
      : isSuccess(body.status);
    const status: PaymentEvent["status"] = paid
      ? "paid"
      : eventType.includes("failure") ||
          String(body.status).toUpperCase() === "FAILURE"
        ? "failed"
        : "received";
    return {
      id:
        value(body.iyziReferenceCode) ||
        value(body.iyziPaymentId) ||
        value(body.orderReferenceCode),
      type: eventType || "iyzico.webhook",
      status,
      conversationId: value(body.paymentConversationId) || null,
      providerCustomerId: value(body.customerReferenceCode) || null,
      providerSubscriptionId: value(body.subscriptionReferenceCode) || null,
      data: {
        status: value(body.status),
        token: value(body.token),
        paymentConversationId: value(body.paymentConversationId),
        iyziPaymentId: value(body.iyziPaymentId),
        orderReferenceCode: value(body.orderReferenceCode),
      },
    };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.request(
      `/v2/subscription/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      "POST",
    );
  }
}
