/**
 * track-click — Public click tracker for /r/:code links
 * Increments clicks_count, records link_events, detects qualified interest,
 * creates opportunities + recommendations when threshold is met.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUALIFIED_INTEREST_THRESHOLD = 3; // 3 unique clicks = qualified interest

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(JSON.stringify({ error: "code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the link
    const { data: link, error } = await supabase
      .from("offer_share_links")
      .select("id, facilitator_id, destination_url, clicks_count, unique_clicks_count, qualified_interest_count, opportunity_count, offer_id, company_id")
      .eq("tracking_code", code)
      .single();

    if (error || !link) {
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fingerprint for unique detection
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const fingerprint = `${ip}-${userAgent}`.substring(0, 100);

    // Check if this fingerprint has clicked before
    const { data: existingEvents } = await supabase
      .from("link_events")
      .select("id, event_type")
      .eq("share_link_id", link.id)
      .eq("visitor_fingerprint", fingerprint);

    const previousClickCount = (existingEvents || []).filter(e => e.event_type === "click" || e.event_type === "unique_click").length;
    const isUnique = previousClickCount === 0;
    const isRepeated = previousClickCount >= 1;

    // New unique_clicks total after this click
    const newUniqueClicks = (link.unique_clicks_count || 0) + (isUnique ? 1 : 0);

    // Update counters
    await supabase.from("offer_share_links").update({
      clicks_count: (link.clicks_count || 0) + 1,
      unique_clicks_count: newUniqueClicks,
      last_click_at: new Date().toISOString(),
    }).eq("id", link.id);

    // Record event
    await supabase.from("link_events").insert({
      share_link_id: link.id,
      facilitator_id: link.facilitator_id,
      event_type: isUnique ? "unique_click" : "click",
      visitor_fingerprint: fingerprint,
      ip_country: ip,
      metadata: { user_agent: userAgent, is_unique: isUnique, click_number: previousClickCount + 1 },
    });

    // ── QUALIFIED INTEREST DETECTION ──────────────────────────
    // A repeated visitor (3+ unique clicks from same fingerprint) = qualified interest
    const repeatedCount = (existingEvents || []).filter(
      e => e.event_type === "click" || e.event_type === "unique_click"
    ).length + 1;

    if (repeatedCount >= QUALIFIED_INTEREST_THRESHOLD) {
      // Check if we already created a qualified interest for this fingerprint + link
      const { data: existingInterest } = await supabase
        .from("qualified_interests")
        .select("id, click_count, status")
        .eq("share_link_id", link.id)
        .eq("visitor_fingerprint", fingerprint)
        .single();

      if (existingInterest) {
        // Update click count
        await supabase.from("qualified_interests")
          .update({ click_count: repeatedCount, updated_at: new Date().toISOString() })
          .eq("id", existingInterest.id);
      } else {
        // Create new qualified interest
        const { data: newInterest } = await supabase.from("qualified_interests").insert({
          share_link_id: link.id,
          facilitator_id: link.facilitator_id,
          offer_id: link.offer_id,
          visitor_fingerprint: fingerprint,
          click_count: repeatedCount,
          status: "detected",
          metadata: { ip, user_agent: userAgent, threshold_reached_at: new Date().toISOString() },
        }).select().single();

        // Update qualified_interest_count on the share link
        await supabase.from("offer_share_links").update({
          qualified_interest_count: (link.qualified_interest_count || 0) + 1,
        }).eq("id", link.id);

        // ── AUTO-CREATE OPPORTUNITY ───────────────────────────
        // Fetch offer details
        let offerTitle = "Offre partagée";
        if (link.offer_id) {
          const { data: offerData } = await supabase
            .from("shared_offers")
            .select("title, short_description")
            .eq("id", link.offer_id)
            .single();
          if (offerData) offerTitle = offerData.title;
        }

        const { data: opportunity } = await supabase.from("opportunities").insert({
          user_id: link.facilitator_id,
          company_name: offerTitle,
          summary: `Un intérêt qualifié a été détecté depuis une diffusion passive. ${repeatedCount} clics répétés sur le même lien — signal fort.`,
          origin: "diffusion_passive",
          status: "nouvelle",
          intent_label: "eleve",
          intent_score: Math.min(90, 50 + repeatedCount * 10),
          recommended_next_action: "Contacter le prospect ou faire une introduction vers l'entreprise.",
        }).select().single();

        // Link opportunity to qualified interest
        if (opportunity && newInterest) {
          await supabase.from("qualified_interests")
            .update({ status: "opportunity_created", opportunity_id: opportunity.id })
            .eq("id", newInterest.id);

          // Update opportunity_count on share link
          await supabase.from("offer_share_links").update({
            opportunity_count: (link.opportunity_count || 0) + 1,
            linked_opportunity_id: opportunity.id,
          }).eq("id", link.id);
        }

        // ── CREATE RECOMMENDATION ───────────────────────────
        await supabase.from("openclaw_recommendations").insert({
          user_id: link.facilitator_id,
          title: "Cette diffusion a créé une opportunité.",
          summary: `Un visiteur a cliqué ${repeatedCount} fois sur votre lien pour "${offerTitle}". C'est un signal fort. OpenClaw recommande d'agir maintenant.`,
          type: "opportunite_passive",
          priority: "haute",
          agent_name: "passif",
          recommended_action: "Faire une introduction ou contacter directement l'entreprise.",
          status: "nouvelle",
        });

        // ── CREATE PASSIVE ALERT ────────────────────────────
        await supabase.from("passive_alerts").insert({
          user_id: link.facilitator_id,
          type: "interest_detected",
          title: "Un intérêt réel a été détecté.",
          message: `Quelqu'un a cliqué ${repeatedCount} fois sur votre lien pour "${offerTitle}". Une opportunité vient d'être créée.`,
          entity_type: "link",
          entity_id: link.id,
          priority: "haute",
        });
      }
    } else if (isUnique && newUniqueClicks === 1) {
      // First click alert — low priority
      await supabase.from("passive_alerts").insert({
        user_id: link.facilitator_id,
        type: "link_performing",
        title: "Ce lien commence à performer.",
        message: `Votre lien traqué vient de recevoir son premier clic unique. Continuez à le partager.`,
        entity_type: "link",
        entity_id: link.id,
        priority: "basse",
      }).catch(() => null); // ignore duplicates
    }

    const destination = link.destination_url || "/";
    return new Response(JSON.stringify({
      success: true,
      redirect: destination,
      is_unique: isUnique,
      repeat_count: repeatedCount,
      qualified: repeatedCount >= QUALIFIED_INTEREST_THRESHOLD,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("track-click error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
