/**
 * send-reactivation-email
 * ─────────────────────────
 * Sends a transactional reactivation email via Resend.
 * Called by admin UI from Reactivation.tsx.
 *
 * POST /send-reactivation-email
 * Authorization: Bearer <admin_jwt>
 * Body: { job_id: string }
 *
 * PROOF:REACTIVATION_EMAIL_V1:resend_provider_wired
 * HONEST LIMITS:
 *   - Requires RESEND_API_KEY secret configured in Lovable Cloud.
 *   - Requires FROM_EMAIL env var (default: noreply@wiinupmax.com — must be verified in Resend).
 *   - Job must exist in reactivation_jobs table.
 *   - Caller must have admin role.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, detail?: unknown) => {
  const d = detail ? ` — ${JSON.stringify(detail)}` : "";
  console.log(`[send-reactivation-email] ${step}${d}`);
};

// ── Email templates by trigger type ───────────────────────────────────────────
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://wiinupmax.com";

function buildEmailContent(triggerType: string, metadata: Record<string, unknown>): {
  subject: string;
  html: string;
  text: string;
} {
  const templates: Record<string, { subject: string; html: string; text: string }> = {
    onboarding_incomplete: {
      subject: "Finalisez votre profil WIINUP MAX",
      html: `<p>Bonjour,</p>
<p>Votre inscription sur WIINUP MAX est presque complète. Prenez 2 minutes pour finaliser votre profil et commencer à générer des opportunités.</p>
<p><a href="${APP_BASE_URL}/onboarding">Finaliser mon profil →</a></p>
<p>L'équipe WIINUP MAX</p>`,
      text: `Finalisez votre profil sur ${APP_BASE_URL}/onboarding`,
    },
    mission_no_intro: {
      subject: "Votre mission attend des introductions",
      html: `<p>Bonjour,</p>
<p>Une de vos missions est ouverte depuis 3 jours sans introduction reçue. Votre réseau de facilitateurs peut vous aider.</p>
<p><a href="${APP_BASE_URL}/missions">Voir mes missions →</a></p>
<p>L'équipe WIINUP MAX</p>`,
      text: `Consultez vos missions sur ${APP_BASE_URL}/missions`,
    },
    intro_not_validated: {
      subject: "Une introduction attend votre validation",
      html: `<p>Bonjour,</p>
<p>Une introduction vous a été soumise il y a plus de 7 jours et attend votre validation. Le facilitateur attend votre retour.</p>
<p><a href="${APP_BASE_URL}/introductions">Voir les introductions →</a></p>
<p>L'équipe WIINUP MAX</p>`,
      text: `Consultez vos introductions sur ${APP_BASE_URL}/introductions`,
    },
    checkout_abandoned: {
      subject: "Votre accès WIINUP MAX vous attend",
      html: `<p>Bonjour,</p>
<p>Vous avez commencé une inscription mais ne l'avez pas finalisée. L'offre de lancement à 99 € est encore disponible.</p>
<p><a href="${APP_BASE_URL}/checkout">Finaliser mon accès →</a></p>
<p>L'équipe WIINUP MAX</p>`,
      text: `Finalisez votre accès sur ${APP_BASE_URL}/checkout`,
    },
  };

  return templates[triggerType] ?? {
    subject: "Un point sur votre activité WIINUP MAX",
    html: `<p>Bonjour,</p><p>Un point sur votre activité WIINUP MAX.</p><p><a href="${APP_BASE_URL}">Accéder →</a></p>`,
    text: `Accédez à votre espace sur ${APP_BASE_URL}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      log("FATAL: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not configured. Set it in Lovable Cloud > Secrets.",
          sent: false,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromEmail = Deno.env.get("REACTIVATION_FROM_EMAIL") || "noreply@wiinupmax.com";

    // ── Auth: admin only ─────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleCheck } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    const body = await req.json();
    const jobId: string = body.job_id;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch reactivation job ───────────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from("reactivation_jobs")
      .select("*, profiles!user_id(email, prenom)")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr || !job) {
      log("Job not found", { jobId, error: jobErr?.message });
      return new Response(
        JSON.stringify({ error: "Job not found", sent: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status === "sent") {
      log("Job already sent — idempotent skip", { jobId });
      return new Response(
        JSON.stringify({ sent: false, skipped: true, reason: "already_sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = job.profiles as { email: string; prenom: string } | null;
    if (!profile?.email) {
      log("No email found for user", { userId: job.user_id });
      return new Response(
        JSON.stringify({ error: "No email for user", sent: false }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailContent = buildEmailContent(job.trigger_type, job.metadata ?? {});

    // ── Send via Resend ───────────────────────────────────────────────────────
    log("Sending email", { to: profile.email, trigger: job.trigger_type });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: profile.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      log("Resend error", resendData);
      return new Response(
        JSON.stringify({ error: "Email send failed", detail: resendData, sent: false }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("Email sent", { resend_id: resendData.id, to: profile.email });

    // ── Mark job as sent ─────────────────────────────────────────────────────
    await supabase
      .from("reactivation_jobs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        channel: "email",
        notes: `Sent via Resend — id: ${resendData.id}`,
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        sent: true,
        resend_id: resendData.id,
        to: profile.email,
        trigger_type: job.trigger_type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message, sent: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
