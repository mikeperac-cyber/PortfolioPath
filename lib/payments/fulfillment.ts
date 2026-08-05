import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentEvent } from "./types";

type PaymentSession = {
  id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  amount_try: number;
  status: string;
  expires_at: string;
  provider_session_id: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plans: { code: string } | Array<{ code: string }> | null;
};

function planCode(session: PaymentSession) {
  return Array.isArray(session.plans)
    ? session.plans[0]?.code
    : session.plans?.code;
}

function safePaymentPayload(event: PaymentEvent) {
  return {
    eventId: event.id,
    eventType: event.type,
    status: event.status,
    conversationId: event.conversationId ?? null,
    providerCustomerId: event.providerCustomerId ?? null,
    providerSubscriptionId: event.providerSubscriptionId ?? null,
    providerData: Object.fromEntries(
      Object.entries(event.data).filter(
        ([key, value]) =>
          [
            "paymentStatus",
            "paymentId",
            "token",
            "iyziPaymentId",
            "orderReferenceCode",
            "paymentConversationId",
          ].includes(key) &&
          (typeof value === "string" ||
            typeof value === "number" ||
            value === null),
      ),
    ),
  };
}

export async function findPaymentSession(input: {
  id?: string;
  conversationId?: string;
  providerSessionId?: string;
  providerSubscriptionId?: string;
}) {
  const admin = createAdminClient();
  let query = admin
    .from("payment_sessions")
    .select(
      "id,user_id,plan_id,provider,amount_try,status,expires_at,provider_session_id,provider_customer_id,provider_subscription_id,plans(code)",
    )
    .limit(1);
  if (input.id) query = query.eq("id", input.id);
  else if (input.conversationId)
    query = query.eq("conversation_id", input.conversationId);
  else if (input.providerSessionId)
    query = query.eq("provider_session_id", input.providerSessionId);
  else if (input.providerSubscriptionId)
    query = query.eq("provider_subscription_id", input.providerSubscriptionId);
  else return null;
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as PaymentSession | null;
}

export async function fulfillPaymentSession(
  session: PaymentSession,
  event: PaymentEvent,
) {
  const admin = createAdminClient();
  if (session.status === "paid")
    return { paid: true, idempotent: true, session };
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await admin
      .from("payment_sessions")
      .update({ status: "expired" })
      .eq("id", session.id)
      .eq("status", "pending");
    return { paid: false, idempotent: false, session };
  }
  if (event.status !== "paid") {
    const failedStatus = event.status === "canceled" ? "canceled" : "failed";
    await admin
      .from("payment_sessions")
      .update({ status: failedStatus })
      .eq("id", session.id)
      .eq("status", "pending");
    return { paid: false, idempotent: false, session };
  }

  const providerPaymentId = `${session.provider}:${event.id}`;
  const { data: existingPayment, error: existingError } = await admin
    .from("payments")
    .select("id")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existingPayment) {
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        user_id: session.user_id,
        plan_id: session.plan_id,
        provider: session.provider,
        provider_payment_id: providerPaymentId,
        amount_try: session.amount_try,
        status: "paid",
        payload: safePaymentPayload(event),
      })
      .select("id")
      .single();
    if (paymentError) throw paymentError;
    await admin.from("billing_documents").insert({
      user_id: session.user_id,
      payment_id: payment.id,
      provider: session.provider,
      document_kind: "receipt",
      provider_reference: event.id,
    });
  }

  const code = planCode(session);
  if (!code) throw new Error("Payment session plan is unavailable.");
  const periodEnd =
    code === "counselor"
      ? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const { error: subscriptionError } = await admin.from("subscriptions").upsert(
    {
      user_id: session.user_id,
      plan_id: session.plan_id,
      provider: session.provider,
      provider_customer_id:
        event.providerCustomerId ?? session.provider_customer_id,
      provider_subscription_id:
        event.providerSubscriptionId ?? session.provider_subscription_id,
      status: "active",
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,plan_id" },
  );
  if (subscriptionError) throw subscriptionError;

  const { error: sessionError } = await admin
    .from("payment_sessions")
    .update({
      status: "paid",
      provider_customer_id:
        event.providerCustomerId ?? session.provider_customer_id,
      provider_subscription_id:
        event.providerSubscriptionId ?? session.provider_subscription_id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .eq("status", "pending");
  if (sessionError) throw sessionError;
  await admin
    .from("audit_logs")
    .insert({
      actor_id: null,
      action: "PAYMENT_FULFILLED",
      entity_type: "payment_session",
      entity_id: session.id,
      new_data: {
        provider: session.provider,
        planCode: code,
        eventId: event.id,
      },
    });
  return { paid: true, idempotent: Boolean(existingPayment), session };
}
