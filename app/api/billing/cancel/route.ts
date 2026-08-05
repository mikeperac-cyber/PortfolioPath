import { NextResponse } from "next/server";
import { getApiContext, invalid } from "@/lib/api-auth";
import { getPaymentProviderForName } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const context = await getApiContext(["counselor"]);
    if (context.error) return context.error;
    const admin = createAdminClient();
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("id,provider,provider_subscription_id,plans!inner(code)")
      .eq("user_id", context.user.id)
      .eq("status", "active")
      .eq("plans.code", "counselor")
      .maybeSingle();
    if (!subscription)
      return NextResponse.json(
        { error: "No active Counselor Professional subscription was found." },
        { status: 404 },
      );
    if (subscription.provider_subscription_id) {
      const provider = getPaymentProviderForName(subscription.provider);
      if (!provider.cancelSubscription)
        return NextResponse.json(
          {
            error:
              "This payment provider does not support online cancellation.",
          },
          { status: 409 },
        );
      await provider.cancelSubscription(subscription.provider_subscription_id);
    }
    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);
    await admin
      .from("audit_logs")
      .insert({
        actor_id: context.user.id,
        action: "COUNSELOR_SUBSCRIPTION_CANCELED",
        entity_type: "subscription",
        entity_id: subscription.id,
        new_data: { provider: subscription.provider },
      });
    return NextResponse.json({ canceled: true });
  } catch (error) {
    return invalid(error);
  }
}
