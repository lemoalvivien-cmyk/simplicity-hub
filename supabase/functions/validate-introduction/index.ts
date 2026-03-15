/**
 * validate-introduction — Transactional Edge Function.
 * Atomically handles validate OR refuse for an introduction:
 *   validate: introduction → validée, gain → valide, escrow → validée+converted,
 *             proof → certifie, lead_intake → promote to opportunity
 *   refuse:   introduction → refusée, gain → annule
 * SECURITY: userId is always derived from JWT. No user_id override allowed.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: no user_id override allowed — derive from JWT only
    const userSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await userSb.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: no user_id override allowed
    const entrepriseId = user.id;

    const body = await req.json();
    const { introduction_id, action } = body as {
      introduction_id: string;
      action: "validate" | "refuse";
    };

    if (!introduction_id || !action || !["validate", "refuse"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid fields: introduction_id, action (validate|refuse)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Ownership check: ensure this introduction belongs to this entreprise ──
    const { data: introCheck, error: checkErr } = await adminSb
      .from("introductions")
      .select("id, entreprise_id, statut")
      .eq("id", introduction_id)
      .single();

    if (checkErr || !introCheck) {
      return new Response(JSON.stringify({ error: "Introduction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (introCheck.entreprise_id !== entrepriseId) {
      return new Response(JSON.stringify({ error: "Forbidden: not your introduction" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (introCheck.statut !== "en_attente") {
      return new Response(
        JSON.stringify({ error: "Introduction already processed", current_status: introCheck.statut }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "validate") {
      // ── VALIDATE: all writes in parallel ──────────────────────────────────
      const [introRes, gainRes, escrowRes, proofRes] = await Promise.allSettled([
        adminSb
          .from("introductions")
          .update({ statut: "validee" })
          .eq("id", introduction_id)
          .eq("entreprise_id", entrepriseId),
        adminSb
          .from("gains")
          .update({ statut: "valide" })
          .eq("introduction_id", introduction_id),
        adminSb
          .from("intro_escrow")
          .update({ status: "validee", converted: true })
          .eq("introduction_id", introduction_id),
        adminSb
          .from("introduction_proofs")
          .update({
            validation_status: "validee",
            proof_status: "certifie",
            finalized_at: new Date().toISOString(),
          })
          .eq("introduction_id", introduction_id),
      ]);

      // Check for intro update failure (critical)
      if (introRes.status === "rejected" || (introRes.status === "fulfilled" && introRes.value.error)) {
        const detail = introRes.status === "rejected" ? introRes.reason : introRes.value.error?.message;
        console.error("intro update failed:", detail);
        return new Response(
          JSON.stringify({ error: "Failed to validate introduction", detail }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log non-critical failures
      if (gainRes.status === "rejected") console.error("gain update failed:", gainRes.reason);
      if (escrowRes.status === "rejected") console.error("escrow update failed:", escrowRes.reason);
      if (proofRes.status === "rejected") console.error("proof update failed:", proofRes.reason);

      // ── Promote lead_intake to opportunity if it exists ──────────────────
      const { data: leadIntake } = await adminSb
        .from("lead_intakes")
        .select("id")
        .eq("introduction_id", introduction_id)
        .maybeSingle();

      if (leadIntake?.id) {
        // Create opportunity from lead
        const { data: existingOpp } = await adminSb
          .from("lead_intakes")
          .select("linked_opportunity_id")
          .eq("id", leadIntake.id)
          .single();

        if (!existingOpp?.linked_opportunity_id) {
          const { data: newOpp } = await adminSb
            .from("opportunities")
            .insert({
              user_id: entrepriseId,
              lead_intake_id: leadIntake.id,
              source: "validated_introduction",
              status: "open",
            })
            .select("id")
            .maybeSingle();

          if (newOpp?.id) {
            await adminSb
              .from("lead_intakes")
              .update({ linked_opportunity_id: newOpp.id, qualification_status: "qualified" })
              .eq("id", leadIntake.id);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, action: "validated", introduction_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // ── REFUSE ────────────────────────────────────────────────────────────
      const [introRes, gainRes] = await Promise.allSettled([
        adminSb
          .from("introductions")
          .update({ statut: "refusee" })
          .eq("id", introduction_id)
          .eq("entreprise_id", entrepriseId),
        adminSb
          .from("gains")
          .update({ statut: "annule" })
          .eq("introduction_id", introduction_id),
      ]);

      if (introRes.status === "rejected" || (introRes.status === "fulfilled" && introRes.value.error)) {
        const detail = introRes.status === "rejected" ? introRes.reason : introRes.value.error?.message;
        console.error("intro refuse failed:", detail);
        return new Response(
          JSON.stringify({ error: "Failed to refuse introduction", detail }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (gainRes.status === "rejected") console.error("gain cancel failed:", gainRes.reason);

      return new Response(
        JSON.stringify({ success: true, action: "refused", introduction_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("validate-introduction error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
