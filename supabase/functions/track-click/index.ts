/**
 * track-click — Public click tracker for /r/:code links
 *
 * HARDENING (prod):
 *  - Input validation: code param sanitized, max length enforced
 *  - Rate-limit guard: max 20 requests / IP / minute via simple in-memory counter
 *    (edge function restarts reset the counter — a Redis/KV rate limiter is
 *     the prod-grade solution; this is a best-effort guard for the current stack)
 *  - No sensitive data leaked in error responses
 *  - Structured logs on all paths
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Input validation constants ────────────────────────────────────────────────
const CODE_MAX_LENGTH = 64;
const CODE_PATTERN    = /^[a-zA-Z0-9_-]+$/; // only safe URL chars

// ── Simple in-process rate limiter ───────────────────────────────────────────
// Caveat: resets on cold start. Provides burst protection, not a hard guarantee.
const RATE_LIMIT_RPM  = 20;
const RATE_WINDOW_MS  = 60_000;
const ipCounters      = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = ipCounters.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipCounters.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_RPM;
}

// ── Structured logger ─────────────────────────────────────────────────────────
const log = (level: "info" | "warn" | "error", step: string, detail?: unknown) => {
  const d = detail ? ` ${JSON.stringify(detail)}` : "";
  console[level === "error" ? "error" : "log"](`[TRACK-CLICK][${level.toUpperCase()}] ${step}${d}`);
};

const QUALIFIED_INTEREST_THRESHOLD = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    // ── Rate limit ──────────────────────────────────────────────────────────
    if (isRateLimited(ip)) {
      log("warn", "Rate limit exceeded", { ip });
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // ── Input validation ────────────────────────────────────────────────────
    const url  = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response(JSON.stringify({ error: "code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (code.length > CODE_MAX_LENGTH) {
      log("warn", "code too long", { length: code.length });
      return new Response(JSON.stringify({ error: "invalid code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!CODE_PATTERN.test(code)) {
      log("warn", "code failed pattern check", { code: code.substring(0, 20) });
      return new Response(JSON.stringify({ error: "invalid code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DB client ───────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Find link ───────────────────────────────────────────────────────────
    const { data: link, error } = await supabase
      .from("offer_share_links")
      .select("id, facilitator_id, destination_url, clicks_count, unique_clicks_count, qualified_interest_count, opportunity_count, offer_id, company_id")
      .eq("tracking_code", code)
      .single();

    if (error || !link) {
      log("warn", "link not found", { code });
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("info", "link resolved", { linkId: link.id });

    // ── Fingerprint ─────────────────────────────────────────────────────────
    const userAgent   = (req.headers.get("user-agent") ?? "").substring(0, 200);
    const fingerprint = `${ip}-${userAgent}`.substring(0, 100);

    // ── Check prior clicks ──────────────────────────────────────────────────
    const { data: existingEvents } = await supabase
      .from("link_events")
      .select("id, event_type")
      .eq("share_link_id", link.id)
      .eq("visitor_fingerprint", fingerprint);

    const previousClickCount = (existingEvents ?? []).filter(
      e => e.event_type === "click" || e.event_type === "unique_click"
    ).length;
    const isUnique      = previousClickCount === 0;
    const newUniqueClicks = (link.unique_clicks_count ?? 0) + (isUnique ? 1 : 0);

    // ── Update counters ──────────────────────────────────────────────────────
    await supabase.from("offer_share_links").update({
      clicks_count:        (link.clicks_count ?? 0) + 1,
      unique_clicks_count: newUniqueClicks,
      last_click_at:       new Date().toISOString(),
    }).eq("id", link.id);

    // ── Record event ─────────────────────────────────────────────────────────
    await supabase.from("link_events").insert({
      share_link_id:       link.id,
      facilitator_id:      link.facilitator_id,
      event_type:          isUnique ? "unique_click" : "click",
      visitor_fingerprint: fingerprint,
      ip_country:          ip,
      metadata:            { is_unique: isUnique, click_number: previousClickCount + 1 },
    });

    // ── Qualified interest detection ─────────────────────────────────────────
    const repeatedCount = previousClickCount + 1;

    if (repeatedCount >= QUALIFIED_INTEREST_THRESHOLD) {
      const { data: existingInterest } = await supabase
        .from("qualified_interests")
        .select("id, click_count, status")
        .eq("share_link_id", link.id)
        .eq("visitor_fingerprint", fingerprint)
        .single();

      if (existingInterest) {
        await supabase.from("qualified_interests")
          .update({ click_count: repeatedCount, updated_at: new Date().toISOString() })
          .eq("id", existingInterest.id);
      } else {
        let offerTitle = "Offre partagée";
        if (link.offer_id) {
          const { data: offerData } = await supabase
            .from("shared_offers").select("title").eq("id", link.offer_id).single();
          if (offerData?.title) offerTitle = offerData.title.substring(0, 200);
        }

        const { data: newInterest } = await supabase.from("qualified_interests").insert({
          share_link_id:       link.id,
          facilitator_id:      link.facilitator_id,
          offer_id:            link.offer_id,
          visitor_fingerprint: fingerprint,
          click_count:         repeatedCount,
          status:              "detected",
          metadata:            { threshold_reached_at: new Date().toISOString() },
        }).select().single();

        await supabase.from("offer_share_links").update({
          qualified_interest_count: (link.qualified_interest_count ?? 0) + 1,
        }).eq("id", link.id);

        const { data: opportunity } = await supabase.from("opportunities").insert({
          user_id:                  link.facilitator_id,
          company_name:             offerTitle,
          summary:                  `Intérêt qualifié détecté. ${repeatedCount} clics répétés — signal fort.`,
          origin:                   "diffusion_passive",
          status:                   "nouvelle",
          intent_label:             "eleve",
          intent_score:             Math.min(90, 50 + repeatedCount * 10),
          recommended_next_action:  "Contacter le prospect ou faire une introduction.",
        }).select().single();

        if (opportunity && newInterest) {
          await supabase.from("qualified_interests")
            .update({ status: "opportunity_created", opportunity_id: opportunity.id })
            .eq("id", newInterest.id);
          await supabase.from("offer_share_links").update({
            opportunity_count:     (link.opportunity_count ?? 0) + 1,
            linked_opportunity_id: opportunity.id,
          }).eq("id", link.id);
        }

        await supabase.from("openclaw_recommendations").insert({
          user_id:            link.facilitator_id,
          title:              "Diffusion passive : opportunité créée.",
          summary:            `${repeatedCount} clics sur "${offerTitle}". Signal fort — agir maintenant.`,
          type:               "opportunite_passive",
          priority:           "haute",
          agent_name:         "passif",
          recommended_action: "Faire une introduction ou contacter l'entreprise.",
          status:             "nouvelle",
        });

        await supabase.from("passive_alerts").insert({
          user_id:     link.facilitator_id,
          type:        "interest_detected",
          title:       "Intérêt réel détecté.",
          message:     `${repeatedCount} clics sur "${offerTitle}". Opportunité créée.`,
          entity_type: "link",
          entity_id:   link.id,
          priority:    "haute",
        });

        log("info", "qualified interest + opportunity created", { linkId: link.id, clicks: repeatedCount });
      }
    } else if (isUnique && newUniqueClicks === 1) {
      await supabase.from("passive_alerts").insert({
        user_id:     link.facilitator_id,
        type:        "link_performing",
        title:       "Premier clic unique sur ce lien.",
        message:     "Votre lien traqué vient de recevoir son premier clic unique.",
        entity_type: "link",
        entity_id:   link.id,
        priority:    "basse",
      }).catch(() => null);
    }

    const destination = link.destination_url ?? "/";
    log("info", "click processed", { linkId: link.id, isUnique, repeatedCount });

    return new Response(JSON.stringify({
      success:    true,
      redirect:   destination,
      is_unique:  isUnique,
      repeat_count: repeatedCount,
      qualified:  repeatedCount >= QUALIFIED_INTEREST_THRESHOLD,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    log("error", "Unhandled exception", { message: err instanceof Error ? err.message : String(err) });
    // Do NOT leak internal details in prod response
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
