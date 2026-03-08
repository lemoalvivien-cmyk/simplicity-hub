import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { consumeLaunchSlotIfEligible } from "../_shared/quotaEngine.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    if (!webhookSecret) {
      logStep("FATAL: STRIPE_WEBHOOK_SECRET not configured — rejecting request");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Signature verification is mandatory — no fallback.
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });

    // Dedup by stripe_event_id — ignoreDuplicates prevents double-processing on re-delivery
    const { data: eventRow, error: eventError } = await supabase
      .from("billing_events")
      .upsert(
        {
          stripe_event_id: event.id,
          event_type: event.type,
          payload: event as unknown as Record<string, unknown>,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "stripe_event_id", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();

    if (!eventError && !eventRow) {
      logStep("Duplicate event — skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const getEmailFromCustomer = async (customerId: string): Promise<string | null> => {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) return null;
        return (customer as Stripe.Customer).email;
      } catch {
        return null;
      }
    };

    const getUserIdByEmail = async (email: string): Promise<string | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      return data?.id ?? null;
    };

    const upsertSubscription = async (
      userId: string,
      customerId: string,
      sub: Stripe.Subscription
    ) => {
      const now = new Date().toISOString();
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          stripe_price_id: sub.items.data[0]?.price.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id });
        if (session.mode === "subscription" && session.subscription) {
          const customerId = session.customer as string;
          const email = await getEmailFromCustomer(customerId);
          if (email) {
            const userId = session.metadata?.user_id || (await getUserIdByEmail(email));
            if (userId) {
              const sub = await stripe.subscriptions.retrieve(session.subscription as string);
              await upsertSubscription(userId, customerId, sub);

              // Quota consumption delegated entirely to shared quotaEngine module.
              // This is the ONLY call site — no duplicate logic in this file.
              const consumeResult = await consumeLaunchSlotIfEligible(
                supabase,
                sub.id,
                session.metadata?.offer_type,
                sub.items.data[0]?.price.id,
                logStep
              );
              logStep("Quota consume result", { consumeResult, subId: sub.id });

              logStep("Subscription synced after checkout", { userId });
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(customerId);
        if (email) {
          const userId = sub.metadata?.user_id || (await getUserIdByEmail(email));
          if (userId) {
            await upsertSubscription(userId, customerId, sub);
            logStep("Subscription upserted", { userId, status: sub.status });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(customerId);
        if (email) {
          const userId = await getUserIdByEmail(email);
          if (userId) {
            await supabase
              .from("subscriptions")
              .update({
                status: "canceled",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            logStep("Subscription canceled", { userId });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const email = await getEmailFromCustomer(customerId);
        if (email) {
          const userId = await getUserIdByEmail(email);
          if (userId) {
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            logStep("Subscription marked past_due", { userId });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
