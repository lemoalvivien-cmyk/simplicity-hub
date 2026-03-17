/**
 * cron-reactivation
 * ─────────────────────────────────────────────────────────────────────────────
 * Called by pg_cron every 24 hours. Identifies dormant users in 3 categories
 * and creates reactivation_jobs + dispatches branded emails for each.
 *
 * SECURITY: Requires x-cron-secret header matching CRON_SECRET env var.
 * Fail-closed — no CRON_SECRET = reject all.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  sendOnboardingReminderEmail,
  sendFirstMissionReminderEmail,
  sendFirstIntroReminderEmail,
} from "../_shared/emailNotifications.ts";

const log = (step: string, d?: unknown) =>
  console.log(`[cron-reactivation] ${step}${d ? " — " + JSON.stringify(d) : ""}`);

const CRON_SECRET       = Deno.env.get("CRON_SECRET") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── SECURITY: cron secret — fail-closed ─────────────────────────────────
  if (!CRON_SECRET) {
    console.error("[cron-reactivation] FATAL: CRON_SECRET not configured");
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerSecret = req.headers.get("x-cron-secret");
  if (!callerSecret || callerSecret !== CRON_SECRET) {
    console.warn("[cron-reactivation] SECURITY: Invalid x-cron-secret — rejected");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let created = 0;
  let emailed = 0;
  const errors: string[] = [];

  // ── QUERY 1: Onboarding incomplete (signup > 48h, < 7 days) ──────────────
  try {
    const { data: stale, error } = await sb.rpc("get_onboarding_incomplete_users");
    // Fallback raw query if RPC not available
    const users = stale ?? [];

    if (error) {
      // Use raw query if RPC not found
      const { data: rawUsers } = await sb
        .from("profiles")
        .select("id, email, prenom")
        .eq("onboarding_done", false)
        .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (rawUsers) {
        for (const u of rawUsers) {
          // Dedup: skip if already sent in last 7 days
          const { data: existing } = await sb
            .from("reactivation_jobs")
            .select("id")
            .eq("user_id", u.id)
            .eq("trigger_type", "onboarding_incomplete")
            .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (existing) continue;

          const { data: job } = await sb
            .from("reactivation_jobs")
            .insert({
              user_id: u.id,
              trigger_type: "onboarding_incomplete",
              status: "pending",
              email: u.email,
              prenom: u.prenom ?? "là",
            })
            .select("id")
            .maybeSingle();

          if (job && u.email) {
            created++;
            const sent = await sendOnboardingReminderEmail({ to: u.email, prenom: u.prenom ?? "là" });
            if (sent) {
              emailed++;
              await sb.from("reactivation_jobs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", job.id);
            }
          }
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`onboarding_incomplete: ${msg}`);
    log("ERROR onboarding_incomplete", { msg });
  }

  // ── QUERY 2: Entreprise with active sub but no missions (> 7 days) ────────
  try {
    const { data: subUsers } = await sb
      .from("profiles")
      .select("id, email, prenom, created_at")
      .eq("role", "entreprise")
      .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (subUsers) {
      for (const u of subUsers) {
        // Check active subscription
        const { data: sub } = await sb
          .from("subscriptions")
          .select("id")
          .eq("user_id", u.id)
          .eq("status", "active")
          .maybeSingle();

        if (!sub) continue;

        // Check no missions
        const { data: missions } = await sb
          .from("missions")
          .select("id")
          .eq("entreprise_id", u.id)
          .limit(1)
          .maybeSingle();

        if (missions) continue;

        // Dedup: skip if sent in last 14 days
        const { data: existing } = await sb
          .from("reactivation_jobs")
          .select("id")
          .eq("user_id", u.id)
          .eq("trigger_type", "mission_no_intro")
          .gt("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existing) continue;

        const { data: job } = await sb
          .from("reactivation_jobs")
          .insert({
            user_id: u.id,
            trigger_type: "mission_no_intro",
            status: "pending",
            email: u.email,
            prenom: u.prenom ?? "là",
          })
          .select("id")
          .maybeSingle();

        if (job && u.email) {
          created++;
          const sent = await sendFirstMissionReminderEmail({ to: u.email, prenom: u.prenom ?? "là" });
          if (sent) {
            emailed++;
            await sb.from("reactivation_jobs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", job.id);
          }
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`mission_no_intro: ${msg}`);
    log("ERROR mission_no_intro", { msg });
  }

  // ── QUERY 3: Facilitateur inactive — no intros, > 14 days ─────────────────
  try {
    const { data: facils } = await sb
      .from("profiles")
      .select("id, email, prenom")
      .eq("role", "facilitateur")
      .lt("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

    if (facils) {
      for (const u of facils) {
        // Check no introductions
        const { data: intros } = await sb
          .from("introductions")
          .select("id")
          .eq("facilitateur_id", u.id)
          .limit(1)
          .maybeSingle();

        if (intros) continue;

        // Dedup: skip if sent in last 30 days
        const { data: existing } = await sb
          .from("reactivation_jobs")
          .select("id")
          .eq("user_id", u.id)
          .eq("trigger_type", "intro_not_validated")
          .gt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existing) continue;

        const { data: job } = await sb
          .from("reactivation_jobs")
          .insert({
            user_id: u.id,
            trigger_type: "intro_not_validated",
            status: "pending",
            email: u.email,
            prenom: u.prenom ?? "là",
          })
          .select("id")
          .maybeSingle();

        if (job && u.email) {
          created++;
          const sent = await sendFirstIntroReminderEmail({ to: u.email, prenom: u.prenom ?? "là" });
          if (sent) {
            emailed++;
            await sb.from("reactivation_jobs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", job.id);
          }
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`intro_not_validated: ${msg}`);
    log("ERROR intro_not_validated", { msg });
  }

  log("Run complete", { created, emailed, errors: errors.length });

  return new Response(
    JSON.stringify({ success: true, jobs_created: created, emails_sent: emailed, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
