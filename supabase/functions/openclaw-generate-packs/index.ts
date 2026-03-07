/**
 * openclaw-generate-packs
 * Generates multi-format diffusion packs for a shared_offer or offer
 * using AI (LOVABLE_API_KEY / Gemini) and stores them in offer_packs
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PackRequest {
  shared_offer_id?: string;
  offer_id?: string;
  language?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    // Verify JWT
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: PackRequest = await req.json();
    const { shared_offer_id, offer_id, language = "fr" } = body;

    if (!shared_offer_id && !offer_id) {
      return new Response(JSON.stringify({ error: "shared_offer_id or offer_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch offer data
    let offerData: Record<string, string> = {};
    if (shared_offer_id) {
      const { data } = await supabase.from("shared_offers").select("*").eq("id", shared_offer_id).single();
      if (data) offerData = data;
    } else if (offer_id) {
      const { data } = await supabase.from("offers").select("*").eq("id", offer_id).single();
      if (data) offerData = data;
    }

    if (!offerData.title) {
      return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = offerData.company_user_id || offerData.company_id || userId;

    // Generate packs with AI
    const systemPrompt = `Tu es OpenClaw, l'IA de WIINUP MAX. Tu génères des packs de diffusion commerciale ultra-efficaces pour des facilitateurs (apporteurs d'affaires). 
Ton rôle : transformer une offre en messages prêts à copier-coller. 
Règles : pas de jargon, langage simple et humain, premium, orienté résultat.
Langue cible : ${language === "fr" ? "Français" : language === "en" ? "English" : language === "ar" ? "Arabe" : language === "he" ? "Hébreu" : language}.`;

    const offerContext = `
Titre : ${offerData.title}
Description : ${offerData.short_description || offerData.summary || ""}
${offerData.sector ? `Secteur : ${offerData.sector}` : ""}
${offerData.target_geo || offerData.zone ? `Zone : ${offerData.target_geo || ""}` : ""}
${offerData.reward_model || offerData.recompense ? `Récompense : ${offerData.reward_model || offerData.recompense || ""}` : ""}
`.trim();

    const userPrompt = `Génère un pack de diffusion complet pour cette offre. Réponds UNIQUEMENT en JSON valide avec ces champs :
{
  "whatsapp_short": "message WhatsApp très court (max 150 caractères), direct, avec emoji naturel",
  "whatsapp_natural": "message WhatsApp plus humain et naturel (max 300 caractères), comme si tu écrivais à un ami",
  "email_simple": "email professionnel simple, objet inclus au début entre [OBJET:...], max 200 mots",
  "email_premium": "email premium plus élaboré avec valeur ajoutée, objet inclus, max 300 mots",
  "post_short": "post court réseau social (LinkedIn/Twitter), max 200 caractères, avec hashtags pertinents",
  "private_message": "message privé LinkedIn ou Facebook naturel, max 200 caractères, sans formules commerciales",
  "pitch_ultra_short": "pitch oral ultra court, 1-2 phrases max, pour dire en 10 secondes ce que tu proposes"
}

Offre :
${offerContext}`;

    let packs = {
      whatsapp_short: null as string | null,
      whatsapp_natural: null as string | null,
      email_simple: null as string | null,
      email_premium: null as string | null,
      post_short: null as string | null,
      private_message: null as string | null,
      pitch_ultra_short: null as string | null,
    };

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://api.lovable.dev/ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            packs = { ...packs, ...parsed };
          }
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        // Fallback: generate basic packs
        packs = {
          whatsapp_short: `🤝 Je connais une opportunité qui pourrait t'intéresser : ${offerData.title}. Dispo pour en parler ?`,
          whatsapp_natural: `Salut ! Je pense à toi pour quelque chose. ${offerData.short_description || offerData.summary || offerData.title} — ça te parle ? Je peux faire une intro si tu veux.`,
          email_simple: `[OBJET: Une opportunité pour vous]\n\nBonjour,\n\nJe me permets de vous contacter car je pense que cela pourrait vous intéresser.\n\n${offerData.title}\n\n${offerData.short_description || offerData.summary || ""}\n\nSeriez-vous disponible pour en discuter ?\n\nCordialement`,
          email_premium: `[OBJET: Une opportunité sur-mesure pour votre développement]\n\nBonjour,\n\nDans le cadre de mon activité de mise en relation professionnelle, je suis tombé(e) sur une opportunité qui me semble particulièrement adaptée à votre profil.\n\n${offerData.title}\n\n${offerData.short_description || offerData.summary || ""}\n\nJe serais heureux(se) de vous en dire plus lors d'un bref échange.\n\nBien cordialement`,
          post_short: `🎯 Opportunité à saisir : ${offerData.title}. Intéressé(e) ? Contactez-moi. #Business #Opportunite #Networking`,
          private_message: `Bonjour, je pense à toi pour une opportunité : ${offerData.title}. Dispo pour qu'on en parle ?`,
          pitch_ultra_short: `Je mets en relation des professionnels avec ${offerData.title}. Vous connaissez quelqu'un qui serait intéressé ?`,
        };
      }
    } else {
      // No API key: minimal fallback
      packs = {
        whatsapp_short: `🤝 Opportunité : ${offerData.title}. Intéressé(e) ?`,
        whatsapp_natural: `Salut ! Je pense à toi pour ça : ${offerData.title}. On en parle ?`,
        email_simple: `[OBJET: Opportunité]\n\nBonjour,\n\n${offerData.title}\n\nCordialement`,
        email_premium: null,
        post_short: `Opportunité : ${offerData.title} 🎯`,
        private_message: `Bonjour, j'ai une opportunité : ${offerData.title}.`,
        pitch_ultra_short: `Je propose une intro pour : ${offerData.title}`,
      };
    }

    // Check if pack already exists for this offer + language
    const existingQuery = shared_offer_id
      ? supabase.from("offer_packs").select("id").eq("shared_offer_id", shared_offer_id).eq("language", language).single()
      : supabase.from("offer_packs").select("id").eq("offer_id", offer_id!).eq("language", language).single();

    const { data: existing } = await existingQuery;

    let packResult;
    if (existing?.id) {
      // Update existing pack
      const { data, error } = await supabase.from("offer_packs")
        .update({
          ...packs,
          status: "active",
          generated_by: "openclaw",
          generated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      packResult = data;
    } else {
      // Create new pack
      const { data, error } = await supabase.from("offer_packs")
        .insert({
          ...(shared_offer_id ? { shared_offer_id } : { offer_id }),
          company_id: companyId,
          language,
          ...packs,
          status: "active",
          generated_by: "openclaw",
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      packResult = data;
    }

    // Also update shared_offers table for backward compat
    if (shared_offer_id && packs.whatsapp_short) {
      await supabase.from("shared_offers").update({
        whatsapp_text: packs.whatsapp_short,
        email_text: packs.email_simple,
        social_text: packs.post_short,
      }).eq("id", shared_offer_id);
    }

    return new Response(JSON.stringify({ success: true, pack: packResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in openclaw-generate-packs:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
