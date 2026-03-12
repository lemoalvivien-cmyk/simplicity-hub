/**
 * business-alert-dispatcher
 * ──────────────────────────────────────────────────────────────────────────────
 * Runs the alert cycle (run_alert_cycle RPC) and sends a Resend email to admin
 * for any new critical alerts. Safe to call from cron or admin dashboard.
 *
 * POST /business-alert-dispatcher
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL     = Deno.env.get("ADMIN_ALERT_EMAIL") ?? "admin@wiinup.com";

const log = (msg: string, d?: unknown) =>
  console.log(`[business-alert-dispatcher] ${msg}${d ? " " + JSON.stringify(d) : ""}`);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // ── Step 1: Run the alert cycle ─────────────────────────────────────────
    const { data: cycleResult, error: cycleErr } = await sb.rpc("run_alert_cycle");
    if (cycleErr) {
      log("run_alert_cycle error", cycleErr.message);
    }

    const criticalAlerts: Array<{
      id: string; type: string; severity: string;
      title: string; message: string; value: number; threshold: number;
    }> = cycleResult?.critical_alerts ?? [];

    const newAlerts: number = cycleResult?.new_alerts ?? 0;
    const totalUnresolved: number = cycleResult?.total_unresolved ?? 0;

    log("Cycle result", { newAlerts, criticalAlerts: criticalAlerts.length, totalUnresolved });

    // ── Step 2: Send email if there are critical unresolved alerts ──────────
    let emailSent = false;

    if (criticalAlerts.length > 0 && RESEND_API_KEY) {
      const alertRows = criticalAlerts.map(a =>
        `<tr style="border-bottom:1px solid #e2e8f0">
          <td style="padding:8px 12px;font-weight:600;color:#dc2626">${a.title}</td>
          <td style="padding:8px 12px;color:#374151">${a.message}</td>
          <td style="padding:8px 12px;text-align:right;color:#6b7280">${a.value} / seuil ${a.threshold}</td>
        </tr>`
      ).join("");

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>🚨 Alertes Business Wiinup MAX</title></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#dc2626;padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:20px">🚨 ${criticalAlerts.length} Alerte(s) Critique(s) — Wiinup MAX</h1>
      <p style="color:#fecaca;margin:4px 0 0;font-size:14px">${new Date().toLocaleString("fr-FR")} · ${totalUnresolved} alertes non résolues au total</p>
    </div>
    <div style="padding:24px">
      <p style="color:#374151;margin:0 0 16px">Les alertes suivantes nécessitent votre attention immédiate :</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600">Alerte</th>
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600">Détail</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600">Valeur</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>
      <div style="margin-top:20px;padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca">
        <p style="margin:0;color:#991b1b;font-size:13px">
          ⚡ Actions requises : connectez-vous au dashboard admin Wiinup MAX → Revenue Ops pour traiter ces alertes.
        </p>
      </div>
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#9ca3af;font-size:11px">
        Wiinup MAX — Système d'alertes automatique · ${new Date().toISOString()}
      </p>
    </div>
  </div>
</body>
</html>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    "Wiinup MAX Alerts <alerts@wiinup.com>",
          to:      [ADMIN_EMAIL],
          subject: `🚨 [Wiinup MAX] ${criticalAlerts.length} alerte(s) critique(s) non résolue(s)`,
          html,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
        log("Email sent", { to: ADMIN_EMAIL, alerts: criticalAlerts.length });
      } else {
        const resErr = await resendRes.json().catch(() => ({}));
        log("Resend error", resErr);
      }
    } else if (criticalAlerts.length > 0 && !RESEND_API_KEY) {
      log("RESEND_API_KEY not set — skipping email (alerts exist but no email configured)");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        new_alerts:         newAlerts,
        critical_alerts:    criticalAlerts.length,
        total_unresolved:   totalUnresolved,
        email_sent:         emailSent,
        email_skipped:      criticalAlerts.length > 0 && !RESEND_API_KEY,
        sent:               emailSent ? criticalAlerts.length : 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
