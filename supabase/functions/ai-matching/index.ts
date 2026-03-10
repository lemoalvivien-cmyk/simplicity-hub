import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Allowed origins — browser clients only
const ALLOWED_ORIGINS = [
  "https://wiinupmax.com",
  "https://wiinupmax.lovable.app",
  "https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isLocal = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocal ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { enterprise_profile, mission_id, company_user_id } = body;

    if (!enterprise_profile) {
      return new Response(
        JSON.stringify({ error: "enterprise_profile est requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: facilitateurs, error: dbError } = await adminClient
      .from("facilitateur_profiles")
      .select(`
        user_id,
        secteur,
        zone,
        description_reseau,
        types_contacts,
        statut,
        languages,
        response_rate,
        average_rating,
        total_reviews
      `)
      .eq("statut", "actif")
      .limit(20);

    if (dbError) {
      console.error("DB error fetching facilitateurs:", dbError.message);
      throw new Error("Impossible de récupérer les apporteurs.");
    }

    let profileNames: Record<string, string> = {};
    if (facilitateurs && facilitateurs.length > 0) {
      const userIds = facilitateurs.map((f: { user_id: string }) => f.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, prenom, email")
        .in("id", userIds);

      if (profiles) {
        profileNames = profiles.reduce((acc: Record<string, string>, p: { id: string; prenom: string | null; email: string }) => {
          acc[p.id] = p.prenom ?? p.email?.split("@")[0] ?? "Apporteur";
          return acc;
        }, {});
      }
    }

    const enrichedFacilitateurs = (facilitateurs ?? []).map((f: {
      user_id: string;
      secteur: string | null;
      zone: string | null;
      description_reseau: string | null;
      types_contacts: string | null;
      languages: string[] | null;
      response_rate: number | null;
      average_rating: number | null;
      total_reviews: number | null;
    }) => ({
      id: f.user_id,
      nom: profileNames[f.user_id] ?? "Apporteur",
      secteur: f.secteur ?? "Non précisé",
      zone: f.zone ?? "Non précisée",
      description: f.description_reseau ?? "",
      types_contacts: f.types_contacts ?? "",
      langues: f.languages?.join(", ") ?? "Français",
      taux_reponse: f.response_rate ?? 0,
      note_moyenne: f.average_rating ?? 0,
      nb_avis: f.total_reviews ?? 0,
    }));

    if (enrichedFacilitateurs.length === 0) {
      return new Response(
        JSON.stringify({
          matches: [],
          message: "Aucun apporteur actif trouvé pour le moment.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un expert en mise en relation business.
Tu analyses les profils et tu identifies les meilleurs matches
entre entreprises et apporteurs d'affaires.
Tu retournes les 3 meilleurs apporteurs avec un score de compatibilité
et une explication courte en français.`;

    const userPrompt = `Voici le profil de l'entreprise à mettre en relation :

Secteur : ${enterprise_profile.sector ?? "Non précisé"}
Offre : ${enterprise_profile.offer_description ?? "Non précisée"}
Besoins : ${enterprise_profile.needs ?? "Non précisés"}
Zone cible : ${enterprise_profile.zone ?? "France entière"}
Cible clients : ${enterprise_profile.target ?? "Non précisée"}

Voici les apporteurs d'affaires disponibles :

${enrichedFacilitateurs
  .map(
    (f: {
      id: string;
      nom: string;
      secteur: string;
      zone: string;
      description: string;
      types_contacts: string;
      langues: string;
      taux_reponse: number;
      note_moyenne: number;
      nb_avis: number;
    }, i: number) => `--- Apporteur ${i + 1} ---
ID : ${f.id}
Nom : ${f.nom}
Secteur : ${f.secteur}
Zone : ${f.zone}
Réseau : ${f.description}
Types de contacts : ${f.types_contacts}
Langues : ${f.langues}
Taux de réponse : ${f.taux_reponse}%
Note : ${f.note_moyenne}/5 (${f.nb_avis} avis)`
  )
  .join("\n\n")}

Analyse la compatibilité et retourne les 3 meilleurs apporteurs.
Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "matches": [
    {
      "apporteur_id": "<id>",
      "nom": "<nom>",
      "score": <nombre entre 0 et 100>,
      "raison": "<explication courte en 1-2 phrases max>",
      "points_forts": ["<point 1>", "<point 2>"]
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Contactez le support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Impossible d'extraire le JSON de la réponse IA.");

    const result = JSON.parse(jsonMatch[0]);

    const matches = (result.matches ?? []).slice(0, 3).map((m: {
      apporteur_id: string;
      nom: string;
      score: unknown;
      raison: string;
      points_forts?: unknown[];
    }) => ({
      apporteur_id: String(m.apporteur_id ?? ""),
      nom: String(m.nom ?? "Apporteur"),
      score: Math.min(100, Math.max(0, Math.round(Number(m.score) || 0))),
      raison: String(m.raison ?? "").slice(0, 200),
      points_forts: Array.isArray(m.points_forts)
        ? m.points_forts.slice(0, 3).map((p) => String(p))
        : [],
    }));

    // ── Persist matches + send notifications if mission_id provided ──
    if (mission_id && matches.length > 0) {
      // Upsert into mission_matches
      for (const m of matches) {
        if (!m.apporteur_id) continue;
        await adminClient.from("mission_matches").upsert({
          mission_id,
          facilitateur_id: m.apporteur_id,
          compatibility_score: m.score,
          reasoning: m.raison,
          status: "suggeree",
        }, { onConflict: "mission_id,facilitateur_id", ignoreDuplicates: false });

        // Notify each matched facilitator
        await adminClient.from("notifications").insert({
          user_id: m.apporteur_id,
          type: "match_suggere",
          title: "Nouvelle mission compatible avec votre profil",
          body: `Compatibilité ${m.score}% — ${m.raison ?? ""}`.slice(0, 160),
          href: `/missions/${mission_id}`,
        });
      }

      // Notify the company that matching is done
      if (company_user_id) {
        await adminClient.from("notifications").insert({
          user_id: company_user_id,
          type: "match_suggere",
          title: `${matches.length} facilitateurs recommandés pour votre mission`,
          body: "L'IA a identifié les meilleurs profils. Consultez les matchs dans le détail de la mission.",
          href: `/missions/${mission_id}`,
        });
      }
    }

    return new Response(JSON.stringify({ matches }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-matching error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
