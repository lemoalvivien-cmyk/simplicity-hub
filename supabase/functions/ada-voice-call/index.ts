/**
 * ADA Voice Call — DÉSACTIVÉE pour le lancement GTM
 * AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
 */
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  try { await requireAuth(req); } catch { return unauthorizedResponse(corsHeaders); }

  return new Response(
    JSON.stringify({ error: "ADA Voice Call non disponible.", code: "FEATURE_DISABLED" }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
Vous avez le droit d'accès, de rectification et de suppression de vos données. 
Acceptez-vous que nous poursuivions cet appel ? Répondez oui ou non.`;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonSb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonSb.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: "elevenlabs_not_configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, session_id } = body;

    // Verify session ownership
    const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: synthesize ─────────────────────────────────────────────────
    if (action === "synthesize") {
      const { text, include_rgpd_preamble = false } = body;
      const fullText = include_rgpd_preamble
        ? `${RGPD_PREAMBLE}\n\n${text ?? ""}`
        : (text ?? "").slice(0, 1000);

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ADA_VOICE_ID}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: fullText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.80,
              style: 0.30,
              use_speaker_boost: true,
              speed: 0.95,
            },
          }),
        },
      );

      if (!ttsResponse.ok) {
        const err = await ttsResponse.text();
        return new Response(JSON.stringify({ error: "ElevenLabs TTS erreur", detail: err }), {
          status: ttsResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log transcription for agent speech
      if (text) {
        await sb.from("ada_transcriptions").insert({
          session_id,
          owner_user_id: user.id,
          speaker: "agent",
          text: fullText.slice(0, 2000),
          is_key_moment: include_rgpd_preamble,
          key_moment_type: include_rgpd_preamble ? "consent" : null,
        });
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      return new Response(audioBuffer, {
        headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
      });
    }

    // ── ACTION: log_consent ────────────────────────────────────────────────
    if (action === "log_consent") {
      const { consent_given, consent_type = "vocal_recorded", audio_ref } = body;

      await sb.from("ada_consent_logs").insert({
        session_id,
        owner_user_id: user.id,
        consent_type,
        consented: consent_given,
        consent_text: `Consentement vocal ${consent_given ? "ACCORDÉ" : "REFUSÉ"} — Enregistrement: ${audio_ref ?? "N/A"}`,
        elevenlabs_audio_ref: audio_ref ?? null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Log in transcriptions
      await sb.from("ada_transcriptions").insert({
        session_id,
        owner_user_id: user.id,
        speaker: "system",
        text: `[CONSENT LOG] Type: ${consent_type} | Decision: ${consent_given ? "GRANTED" : "REFUSED"} | Audio: ${audio_ref ?? "N/A"}`,
        is_key_moment: true,
        key_moment_type: "consent",
      });

      return new Response(JSON.stringify({
        success: true,
        consent_logged: true,
        consent_given,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: start_call ─────────────────────────────────────────────────
    if (action === "start_call") {
      const callId = `ada_call_${session_id.slice(0, 8)}_${Date.now()}`;
      await sb.from("ada_sessions").update({
        elevenlabs_call_id: callId,
        call_started_at: new Date().toISOString(),
        state: "calling",
      }).eq("id", session_id);

      await sb.from("ada_transcriptions").insert({
        session_id,
        owner_user_id: user.id,
        speaker: "system",
        text: `[CALL STARTED] ID: ${callId} — ${new Date().toLocaleString("fr-FR")}`,
        is_key_moment: true,
        key_moment_type: "consent",
      });

      return new Response(JSON.stringify({
        success: true,
        call_id: callId,
        state: "calling",
        rgpd_preamble: RGPD_PREAMBLE,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: end_call ───────────────────────────────────────────────────
    if (action === "end_call") {
      const { duration_sec } = body;
      await sb.from("ada_sessions").update({
        call_ended_at: new Date().toISOString(),
        call_duration_sec: duration_sec ?? 0,
        state: "awaiting_human_validation",
      }).eq("id", session_id);

      await sb.from("ada_transcriptions").insert({
        session_id,
        owner_user_id: user.id,
        speaker: "system",
        text: `[CALL ENDED] Durée: ${duration_sec ?? 0}s — En attente validation humaine`,
        is_key_moment: true,
        key_moment_type: "closing_attempt",
      });

      return new Response(JSON.stringify({
        success: true,
        state: "awaiting_human_validation",
        duration_sec,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Action inconnue: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[ADA Voice Call]", err);
    return new Response(JSON.stringify({ error: "Erreur interne", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
