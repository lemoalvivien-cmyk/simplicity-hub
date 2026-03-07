/**
 * ════════════════════════════════════════════════════════
 * AI SERVICE — JARVIS + Copilot
 * OpenClaw-first: JARVIS explains the brain in human language
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

export interface AiRequest {
  role: AiRole;
  context: CopilotContext;
  input: string;
  userRole?: "entreprise" | "facilitateur";
  // Live brain state passed from hooks
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

// ── Réponses contextuelles ─────────────────────────────────────────────────────
const CONTEXT_MOCK: Record<CopilotContext, Record<string, string>> = {
  operations: {
    default: "Le runtime OpenClaw est votre tableau de bord opérationnel. Vous voyez l'état réel de chaque canal, de chaque cycle planifié, et l'isolation de sécurité de votre espace.",
    health: "Le score de santé reflète l'état de vos canaux, cycles et sessions. Pour l'améliorer : configurez WhatsApp, activez plus de cycles, et lancez votre première session.",
    channels: "Les canaux prêts peuvent être utilisés par vos agents pour exécuter des actions. Email et Introductions sont prêts par défaut. WhatsApp nécessite une configuration spécifique.",
    jobs: "Les cycles planifiés sont les réveils automatiques d'OpenClaw. Chaque cycle lance le bon agent au bon moment. Vous pouvez les activer, désactiver ou déclencher manuellement.",
    sessions: "Les sessions isolent les contextes métier. Chaque mission active, chaque campagne en cours peut avoir sa propre session pour que le cerveau garde l'historique séparé.",
    tools: "La matrice d'outils définit ce que chaque agent peut faire selon votre niveau d'autonomie. Plus vous montez en niveau, plus les agents peuvent agir sans vous demander la permission.",
    security: "Votre espace OpenClaw est entièrement isolé. Personne d'autre ne peut accéder à vos configurations, sessions, mémoire ou validations.",
  },
  agents: {
    default: "OpenClaw pilote votre prospection automatisée. Le cerveau coordonne 8 agents spécialisés qui travaillent en parallèle.",
    status: "Le cerveau est actif. Consultez les cycles récents pour voir ce qu'OpenClaw a accompli. Les validations en attente sont les décisions qui vous appartiennent.",
    autonomie: "En mode Assisté, vous gardez le contrôle total. Passez en Semi-autonome quand vous faites confiance aux cycles planifiés. En Intensif, OpenClaw prospecte à pleine puissance.",
    run: "Le cerveau vient de terminer un cycle. Consultez l'onglet Cerveau pour voir les détails : quels agents ont travaillé, quelles opportunités ont été détectées.",
    blocked: "Cette action attend votre accord. OpenClaw a préparé tout le contexte pour vous. Il vous suffit de valider ou refuser en un clic.",
    next: "Le prochain cycle est planifié. Pendant ce temps, vos agents passifs continuent de surveiller les signaux.",
    memory: "OpenClaw a appris quelque chose d'utile sur votre réseau. Il utilisera ces apprentissages pour améliorer les prochains cycles.",
    swarm: "L'essaim d'agents OpenClaw comprend 8 spécialistes : Signal Hunter détecte les opportunités, Matchmaker associe les facilitateurs, Message Crafter prépare les messages, Trust Sentinel surveille la confiance.",
    channels: "OpenClaw utilise les canaux prêts pour exécuter les actions. Vérifiez l'onglet Opérations pour voir l'état réel de chaque canal.",
    jobs: "Les cycles planifiés se déclenchent automatiquement selon un rythme prédéfini. Vous pouvez les déclencher manuellement depuis la page Opérations.",
  },
  validations: {
    default: "Chaque validation est une action critique soumise à votre approbation. OpenClaw a préparé tout le contexte — vous décidez en connaissance de cause.",
    comment: "Validez rapidement pour ne pas bloquer vos agents. Une validation en attente depuis plus de 48h peut expirer.",
    relance: "OpenClaw peut relancer automatiquement les validations non traitées selon votre paramétrage.",
  },
  mission: {
    default: "Cette mission semble bien ciblée. Pour maximiser vos chances, soyez précis dans la description du contact que vous présentez.",
    ameliorer: "Voici une version plus claire et plus attirante : mettez en avant le bénéfice concret pour l'apporteur (gain en €), simplifiez la description du besoin, et ajoutez un délai de réponse garanti.",
    pourquoi: "Expliquer le contexte de votre contact est la clé. L'entreprise a besoin de savoir en 2 phrases pourquoi cette personne est pertinente.",
  },
  introduction: {
    default: "Votre introduction est en bonne voie. Assurez-vous d'expliquer clairement pourquoi ce contact correspond exactement au besoin.",
    ameliorer: "Pour rendre cette introduction plus convaincante : commencez par une phrase de contexte sur la personne, puis expliquez le lien avec la mission. Finissez par votre conviction personnelle.",
    simplifier: "Version simplifiée : [Prénom] est [rôle] chez [entreprise]. Il/elle cherche [besoin]. Je pense qu'il/elle correspond parce que [raison courte].",
  },
  profil_entreprise: {
    default: "Un profil clair attire plus d'apporteurs qualifiés. Plus votre description est précise, meilleures sont les introductions que vous recevrez.",
    ameliorer: "Rendez votre description plus convaincante en répondant à ces 3 questions : Quel problème résolvez-vous ? Pour qui exactement ? Qu'est-ce qui vous différencie ?",
    cible: "Pour mieux cibler vos introductions, décrivez votre client idéal avec : secteur, taille d'entreprise, rôle du décideur, et signal d'achat typique.",
  },
  profil_facilitateur: {
    default: "Un profil complet vous permet de recevoir des missions vraiment adaptées à votre réseau.",
    ameliorer: "Décrivez votre réseau en 2 angles : les secteurs où vous avez des contacts, et le type de décideurs que vous connaissez bien.",
    reseau: "Exemple de description de réseau efficace : 'Je connais surtout des dirigeants de TPE dans le commerce et la restauration en région PACA, avec qui j'ai travaillé pendant 8 ans.'",
  },
  contact: {
    default: "Ce contact mérite un suivi. La prochaine étape : le relancer avec un message personnalisé lié à son contexte.",
    resumé: "Ce contact est dans votre liste depuis un moment. Il n'a pas encore répondu. Un message court et direct peut faire la différence.",
    action: "Pour ce contact, je vous suggère d'envoyer un court message de relance. Mentionnez quelque chose de spécifique à son activité.",
  },
  contacts: {
    default: "Votre base de contacts est votre actif principal. Organisez-les en listes pour lancer des campagnes ciblées.",
    importer: "Pour importer facilement : préparez un fichier CSV avec au minimum le prénom, le nom et l'email.",
    organiser: "Organisez vos contacts en listes par secteur ou par niveau d'intérêt.",
  },
  campagne: {
    default: "Votre campagne est bien structurée. Vérifiez que l'objet de vos messages est court et accrocheur (moins de 7 mots).",
    ameliorer: "Pour améliorer les résultats : personnalisez avec le prénom, espacez les relances de 3 jours, gardez les messages courts (< 5 lignes).",
    etape: "Séquence efficace en 3 étapes : Jour 1 : présentation courte. Jour 4 : valeur ajoutée. Jour 8 : question de clôture.",
  },
  campaign: {
    default: "Votre campagne est bien structurée. Vérifiez que l'objet de vos messages est court et accrocheur.",
    ameliorer: "Pour améliorer les résultats : personnalisez avec le prénom, espacez les relances de 3 jours, gardez les messages courts.",
    etape: "Séquence efficace en 3 étapes : Jour 1 : présentation. Jour 4 : valeur ajoutée. Jour 8 : question de clôture.",
  },
  actions: {
    default: "Voici vos priorités du moment. Traitez d'abord les actions urgentes, puis les relances.",
    prioriser: "Pour prioriser : commencez par ce qui a une date limite, puis ce qui peut rapporter le plus rapidement.",
  },
  dashboard: {
    default: "Votre dashboard vous donne une vue d'ensemble. Utilisez les blocs en haut pour les actions urgentes.",
    situation: "En résumé : vous avez des actions à traiter, des missions disponibles, et quelques introductions en cours.",
  },
  gains: {
    default: "Vos gains progressent bien. Pour en obtenir plus, les missions à fort gain méritent votre attention en priorité.",
    attente: "Les gains en attente seront confirmés une fois que l'entreprise aura validé vos introductions.",
  },
  missions: {
    default: "Parcourez les missions disponibles et choisissez celles qui correspondent le mieux à votre réseau.",
    priorite: "Commencez par les missions à fort gain et courte durée.",
  },
  studio: {
    default: "Le Studio vous permet de préparer votre campagne étape par étape.",
    demarrer: "Pour démarrer : 1) Importez ou sélectionnez vos contacts. 2) Choisissez un canal. 3) Préparez un message. 4) Lancez.",
  },
  sources: {
    default: "Vos sources de contacts sont variées. Gardez une trace de l'origine pour savoir quels canaux vous rapportent le plus.",
    organiser: "Organisez vos contacts par source dès l'import.",
  },
  messages: {
    default: "Un bon message est court, personnel et clair. Évitez le jargon et parlez directement au problème de votre interlocuteur.",
    ameliorer: "Pour améliorer vos messages : 1) Commencez par le prénom. 2) Une phrase de contexte. 3) Une question simple.",
  },
  regles: {
    default: "Vos règles de sécurité vous protègent et protègent vos contacts. Gardez au minimum la validation avant envoi.",
    conseil: "Pour débuter, activez toutes les règles de sécurité.",
  },
  canaux: {
    default: "Chaque canal a ses avantages. L'email est idéal pour la prospection froide, le téléphone pour les contacts importants.",
    choisir: "Pour débuter, choisissez un seul canal. Maîtrisez-le avant d'en ajouter un deuxième.",
    openclaw: "OpenClaw utilise les canaux selon votre niveau d'autonomie. En mode Semi-autonome, il peut envoyer des messages email automatiquement.",
  },
  opportunites: {
    default: "Voici vos opportunités actives. Commencez par celles en attente de validation.",
    prioriser: "Traitez en priorité les opportunités 'à traiter' et 'en attente'. Une réponse rapide augmente vos chances.",
  },
  dossier: {
    default: "Votre dossier entreprise est la base d'OpenClaw. Plus il est précis, plus vos agents trouvent des contacts pertinents.",
    ameliorer: "Pour améliorer votre dossier : soyez très précis sur votre client idéal, décrivez les signaux d'achat typiques.",
    cible: "Un bon profil de cible répond à : quel secteur, quelle taille, quel décideur, quel problème, quel signal d'achat.",
  },
  "dashboard-facilitateur": {
    default: "Votre dashboard facilitateur est prêt. Vérifiez les demandes d'introduction reçues, puis consultez les missions disponibles.",
    situation: "Résumé rapide : regardez d'abord les demandes urgentes, puis les missions qui correspondent à votre réseau.",
  },
  "dashboard-entreprise": {
    default: "Votre dashboard entreprise centralise tout. OpenClaw travaille en arrière-plan pendant que votre réseau apporte des contacts.",
    situation: "Résumé : vos agents travaillent, vos facilitateurs apportent des contacts, et vos validations attendent votre décision.",
    openclaw: "OpenClaw analyse vos signaux et prépare les prochaines actions. Consultez la page Agent OS pour voir ce que le cerveau recommande.",
  },
  "passive-os": {
    default: "Le mode passif vous permet de monétiser votre réseau sans effort. Importez vos contacts, partagez des offres, gagnez.",
    comment: "Votre réseau travaille pendant que vous vivez. Chaque lien partagé peut se transformer en gain.",
  },
  "import-reseau": {
    default: "Pour importer votre réseau, préparez un fichier CSV ou Excel avec au minimum le nom et l'email de vos contacts.",
    conseil: "Plus votre liste est qualitative, mieux OpenClaw peut l'exploiter.",
  },
  offres: {
    default: "Choisissez une offre adaptée à votre réseau, obtenez votre lien traqué, et partagez via WhatsApp ou email.",
    comment: "Chaque clic sur votre lien est tracé. Si un contact montre de l'intérêt, une opportunité est créée automatiquement.",
  },
  "offres-entreprise": {
    default: "Publiez une offre et laissez OpenClaw générer les packs de diffusion. Vos facilitateurs n'ont plus besoin d'improviser.",
    conseil: "Plus votre offre est précise, meilleures sont les introductions que vous recevrez.",
  },
  pilotage: {
    default: "Le pilotage centralise vos opportunités, actions et recommandations OpenClaw.",
    situation: "Voici où en est votre pipeline commercial. Traitez les opportunités les plus chaudes en priorité.",
    openclaw: "OpenClaw alimente ce tableau en analysant vos signaux et en priorisant les opportunités selon votre dossier cible.",
  },
  radar: {
    default: "Le Deal Radar détecte automatiquement les entreprises qui semblent prêtes à acheter.",
    signal: "Les signaux d'intention (recrutement, levée de fonds, expansion) sont les indicateurs les plus fiables.",
    openclaw: "OpenClaw analyse les signaux toutes les 24h via son cycle Scan Radar. Les opportunités détectées apparaissent directement dans votre pipeline.",
  },
  chaud: {
    default: "Concentrez-vous sur les liens avec les scores les plus élevés.",
    agir: "Votre priorité : contacter les prospects qui ont cliqué plusieurs fois.",
    openclaw: "OpenClaw surveille en continu les clics et comportements. Les contacts qui montrent le plus d'intérêt remontent automatiquement.",
  },
  trust: {
    default: "Votre réputation se construit sur des faits réels. Chaque introduction validée, chaque avis positif et chaque réponse rapide fait progresser votre score.",
    ameliorer: "Pour progresser : répondez vite aux demandes, envoyez des introductions de qualité, et complétez votre profil.",
    badge: "Les badges de confiance sont accordés automatiquement selon vos résultats réels.",
    protection: "Vos introductions sont tracées et horodatées. En cas de litige, la plateforme dispose de toutes les preuves.",
  },
  "mission-creation": {
    default: "Votre mission semble bien construite. Pour attirer les meilleurs facilitateurs, soyez précis sur le profil du contact recherché.",
    ameliorer: "Reformulez le titre pour qu'il soit une phrase d'action. Ex : 'Je cherche des dirigeants de PME en Île-de-France prêts à découvrir une solution RH.'",
    simplifier: "Raccourcissez la description : 3 lignes maximum. Indiquez qui vous cherchez, dans quel secteur, et pourquoi vous payez une récompense.",
    cible: "Précisez le type de décideur : 'Dirigeant', 'DRH', 'Responsable IT'... Plus c'est précis, plus les facilitateurs peuvent cibler juste.",
    openclaw: "Une fois la mission créée, OpenClaw peut lancer automatiquement le matching avec les facilitateurs disponibles selon votre niveau d'autonomie.",
  },
};

// ── JARVIS brain-aware responses ───────────────────────────────────────────────
function getJarvisBrainResponse(state: AiRequest["brainState"], context: CopilotContext): string | null {
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

  if (parts.length === 0) return null;
  return parts.join(" ");
}

// ── Router ────────────────────────────────────────────────────────────────────
function routeRequest(req: AiRequest): "faq" | "model_light" | "model_strong" {
  const lower = req.input.toLowerCase();
  for (const key of Object.keys(FAQ_CACHE)) {
    if (lower.includes(key)) return "faq";
  }
  if (lower.includes("améliore") || lower.includes("simplifie") || lower.includes("résume") || lower.includes("explique"))
    return "model_light";
  if (lower.includes("optimise") || lower.includes("analyse") || lower.includes("stratégie"))
    return "model_strong";
  return "model_light";
}

function getFaqResponse(input: string): AiResponse | null {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_CACHE)) {
    if (lower.includes(key)) return response;
  }
  return null;
}

function getMockResponse(req: AiRequest): AiResponse {
  const lower = req.input.toLowerCase();
  const ctxMock = CONTEXT_MOCK[req.context] || {};

  // Try brain-aware response first for JARVIS
  if (req.role === "jarvis" && req.brainState) {
    const brainMsg = getJarvisBrainResponse(req.brainState, req.context);
    if (brainMsg && lower.length < 20) {
      return { text: brainMsg, source: "mock" };
    }
  }

  let text = ctxMock.default || "Je suis là pour vous aider. Pouvez-vous préciser ce que vous souhaitez améliorer ?";

  if (lower.includes("améliore") || lower.includes("rends plus") || lower.includes("meilleure version")) {
    text = ctxMock.ameliorer || ctxMock.default || text;
  } else if (lower.includes("simplifie") || lower.includes("plus simple")) {
    text = ctxMock.simplifier || ctxMock.ameliorer || ctxMock.default || text;
  } else if (lower.includes("résume") || lower.includes("résumé")) {
    text = ctxMock.resumé || ctxMock.situation || ctxMock.default || text;
  } else if (lower.includes("openclaw") || lower.includes("cerveau") || lower.includes("agent")) {
    text = ctxMock.openclaw || ctxMock.swarm || ctxMock.default || text;
  } else if (lower.includes("canal") || lower.includes("whatsapp") || lower.includes("email")) {
    text = ctxMock.channels || ctxMock.openclaw || ctxMock.default || text;
  } else if (lower.includes("cycle") || lower.includes("planifié") || lower.includes("réveil")) {
    text = ctxMock.jobs || ctxMock.next || ctxMock.default || text;
  } else if (lower.includes("réseau")) {
    text = ctxMock.reseau || ctxMock.default || text;
  } else if (lower.includes("priorit")) {
    text = ctxMock.prioriser || ctxMock.default || text;
  } else if (lower.includes("attente")) {
    text = ctxMock.attente || ctxMock.blocked || ctxMock.default || text;
  } else if (lower.includes("sécurité") || lower.includes("isolation")) {
    text = ctxMock.security || ctxMock.default || text;
  }

  return { text, source: "mock" };
}

// ── Call real AI if available ─────────────────────────────────────────────────
async function callLovableAI(req: AiRequest): Promise<AiResponse | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!supabaseUrl && !projectId) return null;

    const url = supabaseUrl
      ? `${supabaseUrl}/functions/v1/openclaw-generate`
      : `https://${projectId}.supabase.co/functions/v1/openclaw-generate`;

    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ context: req.context, userInput: req.input, type: "jarvis_chat" }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.recommendation) {
      return { text: data.recommendation, source: "model_strong" };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function getAiResponse(req: AiRequest): Promise<AiResponse> {
  // Level 1: FAQ
  const route = routeRequest(req);
  if (route === "faq") {
    const faq = getFaqResponse(req.input);
    if (faq) return faq;
  }

  // Level 2: Jarvis with brain state (instant, no cost)
  if (req.role === "jarvis" && req.brainState && req.input.trim().length < 15) {
    const brainMsg = getJarvisBrainResponse(req.brainState, req.context);
    if (brainMsg) return { text: brainMsg, source: "mock" };
  }

  // Level 3: Try real AI for strong requests
  if (route === "model_strong") {
    const aiRes = await callLovableAI(req);
    if (aiRes) return aiRes;
  }

  // Level 4: Mock contextual (always available)
  return getMockResponse(req);
}

// ── Synchronous fallback ──────────────────────────────────────────────────────
export function getAiResponseSync(req: AiRequest): AiResponse {
  const route = routeRequest(req);
  if (route === "faq") {
    const faq = getFaqResponse(req.input);
    if (faq) return faq;
  }
  return getMockResponse(req);
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
