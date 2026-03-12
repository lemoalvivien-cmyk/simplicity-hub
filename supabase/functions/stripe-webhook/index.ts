import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { consumeLaunchSlotIfEligible } from "../_shared/quotaEngine.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// ── Pre-flight secret check ───────────────────────────────────────────────────
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!STRIPE_SECRET_KEY) {
  console.error("[STRIPE-WEBHOOK] FATAL: STRIPE_SECRET_KEY is not set.");
}
if (!STRIPE_WEBHOOK_SECRET) {
  console.error("[STRIPE-WEBHOOK] FATAL: STRIPE_WEBHOOK_SECRET is not set.");
}

// ── Shared helpers ────────────────────────────────────────────────────────────

async function getEmailFromCustomer(
  stripe: Stripe,
  customerId: string
): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).email;
  } catch {
    return null;
  }
}

async function getUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  customerId: string,
  sub: Stripe.Subscription
) {
  const LAUNCH_PRICE_ID = Deno.env.get("STRIPE_PRICE_LAUNCH") ?? "price_1T8GOWEG497aCUFxjNjFjk4t";
  const priceId = sub.items.data[0]?.price.id;
  const offerType = priceId === LAUNCH_PRICE_ID ? "launch" : "standard";
  const now = new Date().toISOString();

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      status: sub.status,
      offer_type: offerType,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  logStep("Subscription upserted", { userId, status: sub.status, offerType });
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // stripe-webhook is server-to-server. Reject browser preflight.
  if (req.method === "OPTIONS") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: STRIPE_SECRET_KEY not set." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: STRIPE_WEBHOOK_SECRET not set." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();

    // ── Mandatory signature ────────────────────────────────────────────────
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("REJECTED: Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // constructEventAsync throws on bad signature → bubbles to outer catch → 400
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    logStep("Event verified", { type: event.type, id: event.id });

    // ── Idempotency: dedup by stripe_event_id ─────────────────────────────
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

    // ── Event routing ─────────────────────────────────────────────────────
    switch (event.type) {
      // ── checkout.session.completed ───────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, mode: session.mode });

        if (session.mode !== "subscription" || !session.subscription) break;

        const customerId = session.customer as string;
        const email = await getEmailFromCustomer(stripe, customerId);
        if (!email) { logStep("No email from customer", { customerId }); break; }

        const userId = session.metadata?.user_id || (await getUserIdByEmail(supabase, email));
        if (!userId) { logStep("No user found for email", { email }); break; }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(supabase, userId, customerId, sub);

        // Quota consumption (delegated to shared module)
        const consumeResult = await consumeLaunchSlotIfEligible(
          supabase,
          sub.id,
          session.metadata?.offer_type,
          sub.items.data[0]?.price.id,
          logStep
        );
        logStep("Quota consume result", { consumeResult, subId: sub.id });

        // Notification: paiement confirmé
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "gain_valide",
          title: "Abonnement activé avec succès",
          body: "Votre paiement a été confirmé. Votre accès est maintenant actif.",
          href: "/account",
        });

        logStep("checkout.session.completed fully processed", { userId });
        break;
      }

      // ── customer.subscription.created / updated ──────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(stripe, customerId);
        if (!email) break;

        const userId = sub.metadata?.user_id || (await getUserIdByEmail(supabase, email));
        if (!userId) break;

        await upsertSubscription(supabase, userId, customerId, sub);
        logStep("subscription.updated processed", { userId, status: sub.status });
        break;
      }

      // ── customer.subscription.deleted ────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(stripe, customerId);
        if (!email) break;

        const userId = await getUserIdByEmail(supabase, email);
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        logStep("subscription.deleted processed — status=canceled", { userId });
        break;
      }

      // ── invoice.paid ─────────────────────────────────────────────────────
      // Fires on initial payment AND every renewal — always re-sync subscription
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("invoice.paid", { invoiceId: invoice.id, customerId });

        if (!invoice.subscription) break;

        const email = await getEmailFromCustomer(stripe, customerId);
        if (!email) break;

        const userId = await getUserIdByEmail(supabase, email);
        if (!userId) break;

        // Re-sync subscription state (catches renewals)
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        await upsertSubscription(supabase, userId, customerId, sub);

        logStep("invoice.paid subscription re-synced", { userId, subId: sub.id });
        break;
      }

      // ── invoice.payment_failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const email = await getEmailFromCustomer(stripe, customerId);
        if (!email) break;

        const userId = await getUserIdByEmail(supabase, email);
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        logStep("invoice.payment_failed — status=past_due", { userId });
        break;
      }

      // ── invoice.payment_action_required ──────────────────────────────────
      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("invoice.payment_action_required", { invoiceId: invoice.id });
        // No DB action needed — Stripe emails the customer automatically
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
