/**
 * track-click — Public click tracker for /r/:code links
 * Increments clicks_count, records link_events, redirects
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      .select("id, facilitator_id, destination_url, clicks_count, unique_clicks_count")
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

    // Check if unique
    const { data: existing } = await supabase
      .from("link_events")
      .select("id")
      .eq("share_link_id", link.id)
      .eq("visitor_fingerprint", fingerprint)
      .eq("event_type", "click")
      .single();

    const isUnique = !existing;

    // Update counters
    await supabase.from("offer_share_links").update({
      clicks_count: (link.clicks_count || 0) + 1,
      unique_clicks_count: isUnique ? (link.unique_clicks_count || 0) + 1 : (link.unique_clicks_count || 0),
      last_click_at: new Date().toISOString(),
    }).eq("id", link.id);

    // Record event
    await supabase.from("link_events").insert({
      share_link_id: link.id,
      facilitator_id: link.facilitator_id,
      event_type: isUnique ? "unique_click" : "click",
      visitor_fingerprint: fingerprint,
      ip_country: ip,
      metadata: { user_agent: userAgent, is_unique: isUnique },
    });

    const destination = link.destination_url || "/";
    return new Response(JSON.stringify({ success: true, redirect: destination, is_unique: isUnique }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("track-click error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
