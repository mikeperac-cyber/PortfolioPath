import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext, invalid } from "@/lib/api-auth";
import { hasRole, workspacePath } from "@/lib/auth";
import { activeDiscountPercent, discountedAmountTry } from "@/lib/entitlements";
import { getPaymentProvider, getPaymentProviderName } from "@/lib/payments";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const billingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  identityNumber: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[\p{L}\p{N}-]+$/u, "Use a valid identity or tax identifier."),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^\+?[0-9 ()-]+$/, "Use a valid phone number."),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(2).max(20),
  district: z.string().trim().max(80).optional(),
  payerAuthorized: z.literal(true, {
    error:
      "Confirm that the billing information belongs to the authorized payer.",
  }),
});

const schema = z.object({
  planCode: z.enum(["blueprint", "complete", "counselor"]),
  locale: z.enum(["en", "tr"]).default("en"),
  billing: billingSchema.optional(),
});

function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim().slice(0, 64) ||
    request.headers.get("x-real-ip")?.slice(0, 64) ||
    undefined
  );
}

export async function POST(request: Request) {
  let paymentSessionId: string | null = null;
  try {
    const input = schema.parse(await request.json());
    const context = await getApiContext();
    if (context.error) return context.error;
    const limit = enforceRateLimit(
      request,
      "billing-checkout",
      8,
      10 * 60 * 1000,
    );
    if (!limit.allowed)
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    if (hasRole(context.user, "platform_owner"))
      return NextResponse.json(
        {
          error:
            "Platform Owner access never uses checkout. Grant customer access from the Owner Console when needed.",
        },
        { status: 403 },
      );
    if (input.planCode === "counselor" && !hasRole(context.user, "counselor"))
      return NextResponse.json(
        {
          error:
            "Counselor Professional is available only to approved counselor accounts.",
        },
        { status: 403 },
      );
    if (input.planCode !== "counselor" && !hasRole(context.user, "student"))
      return NextResponse.json(
        { error: "Student plans are available only to student accounts." },
        { status: 403 },
      );

    const admin = createAdminClient();
    const { data: plan, error: planError } = await admin
      .from("plans")
      .select("id,code,name_en,price_try")
      .eq("code", input.planCode)
      .eq("active", true)
      .maybeSingle();
    if (planError) throw planError;
    if (!plan)
      return NextResponse.json(
        { error: "This plan is not currently available." },
        { status: 404 },
      );
    const { data: activeSubscription } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", context.user.id)
      .eq("plan_id", plan.id)
      .eq("status", "active")
      .maybeSingle();
    if (activeSubscription)
      return NextResponse.json(
        { error: "This plan is already active for your account." },
        { status: 409 },
      );

    const now = new Date().toISOString();
    const { data: discounts, error: discountsError } = await admin
      .from("access_grants")
      .select(
        "grant_kind,plan_id,discount_percent,entitlements,plans(entitlements)",
      )
      .eq("user_id", context.user.id)
      .eq("plan_id", plan.id)
      .eq("grant_kind", "discount")
      .is("revoked_at", null)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`);
    if (discountsError) throw discountsError;
    const discountPercent = activeDiscountPercent(discounts ?? [], plan.id);
    const amountTry = discountedAmountTry(plan.price_try, discountPercent);

    const providerName = getPaymentProviderName();
    if (providerName === "iyzico" && !input.billing)
      return NextResponse.json(
        {
          error:
            "Enter the authorized payer's billing details for iyzico checkout.",
        },
        { status: 400 },
      );
    paymentSessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data: session, error: sessionError } = await admin
      .from("payment_sessions")
      .insert({
        id: paymentSessionId,
        user_id: context.user.id,
        plan_id: plan.id,
        provider: providerName,
        conversation_id: paymentSessionId,
        amount_try: amountTry,
        expires_at: expiresAt,
      })
      .select("id,conversation_id")
      .single();
    if (sessionError) throw sessionError;

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const workspace = input.planCode === "counselor" ? "counselor" : "student";
    const subscriptionPath = `${origin}${workspacePath(input.locale, workspace)}/subscription`;
    const callbackUrl = `${origin}/api/billing/iyzico/callback?session=${encodeURIComponent(session.id)}&locale=${input.locale}`;
    const testSuccessUrl = `${origin}/api/billing/test-success?session=${encodeURIComponent(session.id)}&locale=${input.locale}&workspace=${workspace}`;
    const checkout = await getPaymentProvider().createCheckout({
      sessionId: session.id,
      userId: context.user.id,
      email: context.user.email,
      planCode: input.planCode,
      planName: plan.name_en,
      amountTry,
      locale: input.locale,
      successUrl:
        providerName === "test"
          ? testSuccessUrl
          : `${subscriptionPath}?checkout=processing`,
      cancelUrl: `${origin}/${input.locale}/pricing?checkout=canceled`,
      callbackUrl: providerName === "iyzico" ? callbackUrl : undefined,
      customer: input.billing
        ? { ...input.billing, requestIp: requestIp(request) }
        : null,
    });
    const { error: providerSessionError } = await admin
      .from("payment_sessions")
      .update({
        provider_session_id: checkout.providerReference,
        provider_customer_id: checkout.providerCustomerId ?? null,
        provider_subscription_id: checkout.providerSubscriptionId ?? null,
      })
      .eq("id", session.id);
    if (providerSessionError) throw providerSessionError;
    await admin
      .from("product_events")
      .insert({
        user_id: context.user.id,
        event_name: "checkout_started",
        properties: {
          planCode: input.planCode,
          provider: providerName,
          discountPercent,
        },
      });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    if (paymentSessionId) {
      try {
        await createAdminClient()
          .from("payment_sessions")
          .update({ status: "failed" })
          .eq("id", paymentSessionId)
          .eq("status", "pending");
      } catch {
        // Preserve the original checkout error. A scheduled reconciliation can
        // still find an expired pending session if the provider is unavailable.
      }
    }
    return invalid(error);
  }
}
