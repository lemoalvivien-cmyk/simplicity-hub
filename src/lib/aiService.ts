/**
 * ════════════════════════════════════════════════════════
 * AI SERVICE — JARVIS + Copilot
 * 3-level pipeline:
 *   1. FAQ cache (free, instant)
 *   2. Brain-state awareness (free, context-aware)
 *   3. ai-jarvis edge function (real Gemini AI)
 * ════════════════════════════════════════════════════════
 */

export type AiRole = "jarvis" | "copilot";
export type CopilotContext =
  | "mission" | "introduction" | "profil_entreprise" | "profil_facilitateur"
  | "contact" | "contacts" | "campagne" | "campaign" | "actions"
  | "dashboard" | "dashboard-facilitateur" | "dashboard-entreprise"
  | "gains" | "missions" | "studio" | "sources" | "messages" | "regles"
  | "canaux" | "opportunites" | "agents" | "dossier" | "passive-os"
  | "import-reseau" | "offres" | "offres-entreprise" | "pilotage"
  | "radar" | "validations" | "chaud" | "trust" | "mission-creation"
  | "operations";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  role: AiRole;
  context: CopilotContext;
  input: string;
  userRole?: "entreprise" | "facilitateur";
  history?: ChatHistoryMessage[];
  brainState?: {
    hasActiveRun?: boolean;
    runType?: string;
    blockedCount?: number;
    nextJobName?: string;
    nextJobIn?: string;
    readyChannels?: string[];
    sessionsCount?: number;
    memoryCount?: number;
    healthScore?: number;
    autonomieLevel?: string;
    activeAgentsCount?: number;
  };
}

export interface AiResponse {
  text: string;
  action?: { label: string; href?: string; onClick?: () => void };
  suggested_actions?: Array<{ label: string; href: string }>;
  source: "faq" | "model_light" | "model_strong" | "mock";
}

// ── FAQ / Réponses statiques ──────────────────────────────────────────────────
const FAQ_CACHE: Record<string, AiResponse> = {
  "que dois-je faire maintenant": {
    text: "Regardez vos actions prioritaires en haut de votre dashboard. S'il y a une introduction à valider ou une mission ouverte, commencez par là.",
    action: { label: "Voir mes priorités", href: "/actions" },
    source: "faq",
  },
  "résume ma situation": {
    text: "Vous avez des missions ouvertes, quelques introductions en cours, et des contacts à relancer. Votre prochaine étape : examiner vos introductions.",
    action: { label: "Voir mes introductions", href: "/introductions" },
    source: "faq",
  },
  "aide-moi à démarrer": {
    text: "Commencez par compléter votre profil, puis regardez les missions disponibles. Si vous connaissez quelqu'un qui correspond, envoyez une introduction !",
    action: { label: "Voir les missions", href: "/missions" },
    source: "faq",
  },
  "explique cette page": {
    text: "Cette page vous montre ce qui est important maintenant. Chaque bloc a un objectif clair : agir, suivre, ou comprendre.",
    source: "faq",
  },
  "que signifient ces statuts": {
    text: "• Envoyée = votre introduction est partie. • En cours = l'entreprise l'examine. • Validée = bravo, le gain est confirmé ! • Refusée = ce contact ne correspondait pas, mais ça arrive.",
    source: "faq",
  },
  "montre-moi mes priorités": {
    text: "Vos priorités du moment : 1) Valider les introductions en attente. 2) Regarder les nouvelles missions. 3) Relancer les contacts non répondus.",
    action: { label: "À faire", href: "/actions" },
    source: "faq",
  },
  "que fait openclaw": {
    text: "OpenClaw est le cerveau central de WIINUP MAX. Il pilote votre prospection automatisée : il détecte les opportunités, prépare les messages, match les facilitateurs, surveille la confiance, et planifie les prochaines actions. Il travaille même quand vous n'êtes pas connecté.",
    action: { label: "Voir le cerveau", href: "/agents" },
    source: "faq",
  },
};

// ── FAQ lookup ─────────────────────────────────────────────────────────────────
function getFaqResponse(input: string): AiResponse | null {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_CACHE)) {
    if (lower.includes(key)) return response;
  }
  return null;
}

// ── Brain-state awareness ──────────────────────────────────────────────────────
function getJarvisBrainResponse(state: AiRequest["brainState"]): string | null {
  if (!state) return null;

  const parts: string[] = [];

  if (state.hasActiveRun && state.runType) {
    const labels: Record<string, string> = {
      scan: "Le cerveau effectue actuellement un scan de vos opportunités.",
      brief: "OpenClaw prépare votre brief quotidien.",
      passive: "Le moteur de diffusion passive est en cours d'exécution.",
      radar: "Le Deal Radar analyse les signaux en ce moment.",
      matching: "Le Matchmaker cherche les meilleurs facilitateurs pour vos missions.",
      relance: "L'agent de relance prépare les prochains messages.",
      validation_check: "Le Validator vérifie les actions en attente.",
    };
    const runMsg = labels[state.runType];
    if (runMsg) parts.push(runMsg);
  } else if (state.nextJobName && state.nextJobIn) {
    parts.push(`Le prochain cycle (${state.nextJobName}) se déclenchera ${state.nextJobIn}.`);
  }

  if (state.blockedCount && state.blockedCount > 0) {
    parts.push(`${state.blockedCount} action${state.blockedCount > 1 ? "s" : ""} attend${state.blockedCount > 1 ? "ent" : ""} votre accord dans la boîte de validation.`);
  }

  if (state.readyChannels && state.readyChannels.length > 0) {
    parts.push(`Canal${state.readyChannels.length > 1 ? "aux" : ""} actif${state.readyChannels.length > 1 ? "s" : ""} : ${state.readyChannels.join(", ")}.`);
  }

  if (state.healthScore && state.healthScore >= 80) {
    parts.push("Le cerveau est en pleine forme et travaille à pleine capacité.");
  } else if (state.healthScore && state.healthScore < 50) {
    parts.push("Configurer WhatsApp et activer plus de cycles renforcera considérablement votre moteur.");
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

// ── Real AI call — ai-jarvis edge function ────────────────────────────────────
async function callJarvisAI(req: AiRequest): Promise<AiResponse | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return null;

    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const history = (req.history ?? []).slice(-5).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-jarvis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: req.input,
        context: req.context,
        user_role: req.userRole ?? "facilitateur",
        history,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return {
          text: "Je suis un peu surchargé en ce moment. Réessayez dans quelques instants.",
          source: "mock",
        };
      }
      if (res.status === 402) {
        return {
          text: "Les crédits IA sont insuffisants. Contactez l'administrateur.",
          source: "mock",
        };
      }
      return null;
    }

    const data = await res.json();
    if (!data?.response) return null;

    return {
      text: data.response,
      suggested_actions: data.suggested_actions ?? [],
      source: "model_strong",
    };
  } catch {
    return null;
  }
}

// ── Graceful error fallback ────────────────────────────────────────────────────
function getErrorFallback(): AiResponse {
  return {
    text: "Je n'arrive pas à répondre pour l'instant. Vérifiez votre connexion ou réessayez dans quelques secondes.",
    source: "mock",
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function getAiResponse(req: AiRequest): Promise<AiResponse> {
  // Level 1: FAQ cache (free, instant)
  const faq = getFaqResponse(req.input);
  if (faq) return faq;

  // Level 2: Brain-state awareness (free, short messages only)
  if (req.role === "jarvis" && req.brainState && req.input.trim().length < 20) {
    const brainMsg = getJarvisBrainResponse(req.brainState);
    if (brainMsg) return { text: brainMsg, source: "mock" };
  }

  // Level 3: Real AI (ai-jarvis edge function)
  const aiRes = await callJarvisAI(req);
  if (aiRes) return aiRes;

  // Level 4: Graceful error
  return getErrorFallback();
}

// ── Synchronous fallback ──────────────────────────────────────────────────────
export function getAiResponseSync(req: AiRequest): AiResponse {
  const faq = getFaqResponse(req.input);
  if (faq) return faq;
  return { text: "Posez-moi votre question, je suis là pour vous aider.", source: "mock" };
}

// ── Backward-compatible aliases ───────────────────────────────────────────────
export const askAI = getAiResponse;

export const COPILOT_SUGGESTIONS: Record<CopilotContext, Array<{ label: string; prompt: string }>> = {
  mission:            [{ label: "Améliorer", prompt: "Améliore le titre et la description de cette mission pour attirer plus de facilitateurs." }, { label: "Simplifier", prompt: "Simplifie la description pour qu'elle soit plus claire et directe." }, { label: "Préciser la cible", prompt: "Aide-moi à décrire plus précisément le profil du contact recherché." }],
  introduction:       [{ label: "Améliorer", prompt: "Améliore ce texte d'introduction pour le rendre plus convaincant." }, { label: "Simplifier", prompt: "Simplifie et raccourcis cette introduction." }, { label: "Contextualiser", prompt: "Aide-moi à mieux expliquer pourquoi ce contact est pertinent." }],
  profil_entreprise:  [{ label: "Améliorer", prompt: "Améliore la description de cette entreprise." }, { label: "Cibler", prompt: "Aide-moi à décrire mon client idéal plus précisément." }],
  profil_facilitateur:[{ label: "Améliorer", prompt: "Améliore la description de mon réseau." }, { label: "Clarifier", prompt: "Rends ma description de réseau plus concrète." }],
  contact:            [{ label: "Relancer", prompt: "Écris un message de relance court et percutant pour ce contact." }],
  contacts:           [{ label: "Organiser", prompt: "Conseille-moi sur la meilleure façon d'organiser mes contacts." }],
  campagne:           [{ label: "Améliorer", prompt: "Améliore l'objet et le contenu de cette campagne." }, { label: "Séquence", prompt: "Propose une séquence de 3 messages efficace." }],
  campaign:           [{ label: "Améliorer", prompt: "Améliore l'objet et le contenu de cette campagne." }, { label: "Séquence", prompt: "Propose une séquence de 3 messages efficace." }],
  actions:            [{ label: "Prioriser", prompt: "Aide-moi à prioriser mes actions du moment." }],
  dashboard:          [{ label: "Situation", prompt: "Résume ma situation actuelle sur la plateforme." }],
  "dashboard-facilitateur": [{ label: "Priorités", prompt: "Quelles sont mes priorités en tant que facilitateur ?" }],
  "dashboard-entreprise":   [{ label: "Priorités", prompt: "Quelles sont mes priorités en tant qu'entreprise ?" }],
  gains:              [{ label: "Analyser", prompt: "Analyse mes gains et dis-moi comment les augmenter." }],
  missions:           [{ label: "Trouver", prompt: "Quelles missions correspondent le mieux à mon réseau ?" }],
  studio:             [{ label: "Démarrer", prompt: "Aide-moi à démarrer ma campagne étape par étape." }],
  sources:            [{ label: "Organiser", prompt: "Comment organiser mes sources de contacts ?" }],
  messages:           [{ label: "Améliorer", prompt: "Améliore ce message pour le rendre plus percutant." }, { label: "Simplifier", prompt: "Simplifie ce message." }],
  regles:             [{ label: "Conseiller", prompt: "Quelles règles de sécurité me conseilles-tu d'activer ?" }],
  canaux:             [{ label: "Choisir", prompt: "Quel canal me conseilles-tu pour ma prospection ?" }],
  opportunites:       [{ label: "Prioriser", prompt: "Quelles opportunités dois-je traiter en priorité ?" }],
  agents:             [{ label: "État", prompt: "Décris l'état actuel du cerveau OpenClaw." }],
  dossier:            [{ label: "Améliorer", prompt: "Améliore mon dossier entreprise pour mieux cibler." }, { label: "Cible", prompt: "Aide-moi à affiner mon profil de client idéal." }],
  "passive-os":       [{ label: "Démarrer", prompt: "Comment démarrer avec le mode passif ?" }],
  "import-reseau":    [{ label: "Conseiller", prompt: "Comment importer et organiser mon réseau efficacement ?" }],
  offres:             [{ label: "Choisir", prompt: "Quelle offre correspond le mieux à mon réseau ?" }],
  "offres-entreprise":[{ label: "Optimiser", prompt: "Comment rendre mon offre plus attractive pour les facilitateurs ?" }],
  pilotage:           [{ label: "Pipeline", prompt: "Analyse mon pipeline commercial et donne-moi des conseils." }],
  radar:              [{ label: "Signaux", prompt: "Explique-moi les signaux détectés par le radar." }],
  validations:        [{ label: "Priorités", prompt: "Quelles validations dois-je traiter en priorité ?" }],
  chaud:              [{ label: "Agir", prompt: "Sur quels prospects chauds dois-je agir maintenant ?" }],
  trust:              [{ label: "Améliorer", prompt: "Comment améliorer mon score de confiance ?" }],
  "mission-creation": [{ label: "Titre", prompt: "Aide-moi à rédiger un titre de mission percutant." }, { label: "Description", prompt: "Aide-moi à rédiger une description claire et attractive." }, { label: "Cible", prompt: "Aide-moi à décrire précisément le contact recherché." }],
  operations:         [{ label: "Santé", prompt: "Explique-moi l'état de santé actuel du cerveau." }, { label: "Canaux", prompt: "Quels canaux dois-je configurer en priorité ?" }],
};

export const JARVIS_QUICK_QUESTIONS = [
  "Que dois-je faire maintenant ?",
  "Résume ma situation",
  "Que fait OpenClaw en ce moment ?",
  "Comment obtenir ma première introduction ?",
  "Aide-moi à démarrer",
  "Quelles sont mes priorités ?",
  "Explique cette page",
  "Que signifient ces statuts ?",
];
