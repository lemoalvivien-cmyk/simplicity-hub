/**
 * ════════════════════════════════════════════════════════
 * AI SERVICE — Architecture prête pour Qwen API (OpenAI-compatible)
 * Hiérarchie : FAQ cache → petit modèle → modèle fort
 * ════════════════════════════════════════════════════════
 */

export type AiRole = "jarvis" | "copilot";
export type CopilotContext =
  | "mission"
  | "introduction"
  | "profil_entreprise"
  | "profil_facilitateur"
  | "contact"
  | "contacts"
  | "campagne"
  | "campaign"
  | "actions"
  | "dashboard"
  | "dashboard-facilitateur"
  | "dashboard-entreprise"
  | "gains"
  | "missions"
  | "studio"
  | "sources"
  | "messages"
  | "regles"
  | "canaux"
  | "opportunites"
  | "agents"
  | "dossier"
  | "passive-os"
  | "import-reseau"
  | "offres"
  | "offres-entreprise"
  | "pilotage"
  | "radar"
  | "validations"
  | "chaud";

export interface AiRequest {
  role: AiRole;
  context: CopilotContext;
  input: string;
  userRole?: "entreprise" | "facilitateur";
}

export interface AiResponse {
  text: string;
  action?: { label: string; href?: string; onClick?: () => void };
  source: "faq" | "model_light" | "model_strong" | "mock";
}

// ── FAQ / Réponses statiques (niveau 1 — 0 coût) ───────────────────────────
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
};

// ── Réponses mock contextuelles (niveau 2 — simule le petit modèle) ─────────
const CONTEXT_MOCK: Record<CopilotContext, Record<string, string>> = {
  mission: {
    default: "Cette mission semble bien ciblée. Pour maximiser vos chances, soyez précis dans la description du contact que vous présentez.",
    ameliorer: "Voici une version plus claire et plus attirante :\n\n**Version améliorée :** Mettez en avant le bénéfice concret pour l'apporteur (gain en €), simplifiez la description du besoin, et ajoutez un délai de réponse garanti.",
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
    action: "Pour ce contact, je vous suggère d'envoyer un court message de relance. Mentionnez quelque chose de spécifique à son activité pour qu'il se souvienne de vous.",
  },
  contacts: {
    default: "Votre base de contacts est votre actif principal. Organisez-les en listes pour lancer des campagnes ciblées.",
    importer: "Pour importer facilement : préparez un fichier CSV avec au minimum le prénom, le nom et l'email. Le reste peut être ajouté ensuite.",
    organiser: "Organisez vos contacts en listes par secteur ou par niveau d'intérêt. Cela simplifie vos campagnes.",
  },
  campagne: {
    default: "Votre campagne est bien structurée. Vérifiez que l'objet de vos messages est court et accrocheur (moins de 7 mots).",
    ameliorer: "Pour améliorer les résultats de cette campagne : 1) Personnalisez le premier message avec le prénom. 2) Espacez les relances de 3 jours. 3) Gardez les messages courts (< 5 lignes).",
    etape: "Voici une séquence efficace en 3 étapes : Jour 1 : présentation courte. Jour 4 : valeur ajoutée. Jour 8 : question de clôture.",
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
    default: "Votre dashboard vous donne une vue d'ensemble. Utilisez les blocs en haut pour les actions urgentes, et les blocs du bas pour le suivi.",
    situation: "En résumé : vous avez des actions à traiter, des missions disponibles, et quelques introductions en cours. Commencez par vos priorités.",
  },
  gains: {
    default: "Vos gains progressent bien. Pour en obtenir plus, les missions à fort gain méritent votre attention en priorité.",
    attente: "Les gains en attente seront confirmés une fois que l'entreprise aura validé vos introductions. Cela prend généralement 3 à 10 jours.",
  },
  missions: {
    default: "Parcourez les missions disponibles et choisissez celles qui correspondent le mieux à votre réseau.",
    priorite: "Commencez par les missions à fort gain et courte durée. Elles ont le meilleur ratio effort/résultat.",
  },
  studio: {
    default: "Le Studio vous permet de préparer votre campagne étape par étape. Commencez par vos contacts, puis choisissez votre canal.",
    demarrer: "Pour démarrer : 1) Importez ou sélectionnez vos contacts. 2) Choisissez un canal. 3) Préparez un message simple. 4) Lancez.",
  },
  sources: {
    default: "Vos sources de contacts sont variées. Gardez une trace de l'origine pour savoir quels canaux vous rapportent le plus.",
    organiser: "Organisez vos contacts par source dès l'import. Cela vous permettra de comparer l'efficacité de chaque canal.",
  },
  messages: {
    default: "Un bon message est court, personnel et clair. Évitez le jargon et parlez directement au problème de votre interlocuteur.",
    ameliorer: "Pour améliorer vos messages : 1) Commencez par le prénom. 2) Une phrase de contexte. 3) Une question simple. 4) Votre signature.",
  },
  regles: {
    default: "Vos règles de sécurité vous protègent et protègent vos contacts. Gardez au minimum la validation avant envoi.",
    conseil: "Pour débuter, activez toutes les règles de sécurité. Vous pourrez en désactiver certaines une fois à l'aise avec le produit.",
  },
  canaux: {
    default: "Chaque canal a ses avantages. L'email est idéal pour la prospection froide, le téléphone pour les contacts importants.",
    choisir: "Pour débuter, choisissez un seul canal. Maîtrisez-le avant d'en ajouter un deuxième.",
  },
  opportunites: {
    default: "Voici vos opportunités actives. Commencez par celles en attente de validation — elles peuvent avancer rapidement.",
    prioriser: "Traitez en priorité les opportunités 'à traiter' et 'en attente'. Une réponse rapide augmente vos chances de succès.",
  },
  agents: {
    default: "Vos agents sont prêts à travailler. Commencez par compléter votre dossier entreprise pour qu'ils aient toutes les informations nécessaires.",
    status: "OpenClaw coordonne vos agents en arrière-plan. Vérifiez les validations en attente — ce sont les décisions qui vous appartiennent.",
    autonomie: "En mode assisté, vous gardez le contrôle total. Passez en semi-autonome quand vous faites confiance aux recommandations de vos agents.",
  },
  dossier: {
    default: "Votre dossier entreprise est la base d'OpenClaw. Plus il est précis, plus vos agents trouvent des contacts pertinents.",
    ameliorer: "Pour améliorer votre dossier : soyez très précis sur votre client idéal, décrivez les signaux d'achat typiques, et indiquez vos contraintes absolues.",
    cible: "Un bon profil de cible répond à : quel secteur, quelle taille, quel décideur, quel problème, quel signal d'achat. Soyez spécifique.",
  },
  "dashboard-facilitateur": {
    default: "Votre dashboard facilitateur est prêt. Vérifiez les demandes d'introduction reçues, puis consultez les missions disponibles.",
    situation: "Résumé rapide : regardez d'abord les demandes urgentes, puis les missions qui correspondent à votre réseau.",
  },
  "dashboard-entreprise": {
    default: "Votre dashboard entreprise centralise tout. Commencez par valider les introductions en attente.",
    situation: "Résumé : vos agents travaillent, vos facilitateurs apportent des contacts, et vos validations attendent votre décision.",
  },
  "passive-os": {
    default: "Le mode passif vous permet de monétiser votre réseau sans effort. Importez vos contacts, partagez des offres, gagnez.",
    comment: "Votre réseau travaille pendant que vous vivez. Chaque lien partagé peut se transformer en gain.",
  },
  "import-reseau": {
    default: "Pour importer votre réseau, préparez un fichier CSV ou Excel avec au minimum le nom et l'email de vos contacts.",
    conseil: "Plus votre liste est qualitative, mieux OpenClaw peut l'exploiter. Ajoutez le secteur et la zone pour un matching optimal.",
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
  },
  radar: {
    default: "Le Deal Radar détecte automatiquement les entreprises qui semblent prêtes à acheter.",
    signal: "Les signaux d'intention (recrutement, levée de fonds, expansion) sont les indicateurs les plus fiables.",
  },
  validations: {
    default: "Chaque validation est une action critique que vos agents ont soumise à votre approbation.",
    comment: "Validez rapidement pour ne pas bloquer vos agents. Refusez si l'action vous semble trop risquée.",
  },
};

// ── Router simple (détermine la route de réponse) ────────────────────────────
function routeRequest(req: AiRequest): "faq" | "model_light" | "model_strong" {
  const lower = req.input.toLowerCase();

  // Niveau 1 : FAQ
  for (const key of Object.keys(FAQ_CACHE)) {
    if (lower.includes(key)) return "faq";
  }

  // Niveau 2 : petit modèle (mock) pour reformulation courte
  if (
    lower.includes("améliore") ||
    lower.includes("simplifie") ||
    lower.includes("résume") ||
    lower.includes("rends plus clair") ||
    lower.includes("explique")
  )
    return "model_light";

  // Niveau 3 : modèle fort pour optimisation complexe
  if (lower.includes("optimise") || lower.includes("analyse") || lower.includes("stratégie"))
    return "model_strong";

  return "model_light";
}

// ── Réponse FAQ ───────────────────────────────────────────────────────────────
function getFaqResponse(input: string): AiResponse | null {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_CACHE)) {
    if (lower.includes(key)) return response;
  }
  return null;
}

// ── Réponse mock contextuelle ─────────────────────────────────────────────────
function getMockResponse(req: AiRequest): AiResponse {
  const lower = req.input.toLowerCase();
  const ctxMock = CONTEXT_MOCK[req.context] || {};

  let text = ctxMock.default || "Je suis là pour vous aider. Pouvez-vous préciser ce que vous souhaitez améliorer ?";

  if (lower.includes("améliore") || lower.includes("rends plus") || lower.includes("meilleure version")) {
    text = ctxMock.ameliorer || ctxMock.default || text;
  } else if (lower.includes("simplifie") || lower.includes("plus simple") || lower.includes("simplifier")) {
    text = ctxMock.simplifier || ctxMock.ameliorer || ctxMock.default || text;
  } else if (lower.includes("résume") || lower.includes("résumé")) {
    text = ctxMock.resumé || ctxMock.situation || ctxMock.default || text;
  } else if (lower.includes("réseau")) {
    text = ctxMock.reseau || ctxMock.default || text;
  } else if (lower.includes("priorit")) {
    text = ctxMock.prioriser || ctxMock.default || text;
  } else if (lower.includes("attente")) {
    text = ctxMock.attente || ctxMock.default || text;
  }

  return { text, source: "mock" };
}

// ── Réponse JARVIS transverse ─────────────────────────────────────────────────
const JARVIS_RESPONSES: { keywords: string[]; response: AiResponse }[] = [
  {
    keywords: ["que dois-je faire", "quoi faire", "par où commencer", "que faire"],
    response: {
      text: "Voici ce qui mérite votre attention : vérifiez vos introductions en attente, puis regardez les nouvelles missions disponibles.",
      action: { label: "Voir mes priorités", href: "/actions" },
      source: "faq",
    },
  },
  {
    keywords: ["résume ma situation", "résumé", "où j'en suis", "état actuel"],
    response: {
      text: "Vous avez des missions actives, des introductions en cours, et des contacts dans votre base. Votre prochain gain peut venir d'une validation en attente.",
      action: { label: "Voir mes introductions", href: "/introductions" },
      source: "faq",
    },
  },
  {
    keywords: ["aide-moi à démarrer", "comment commencer", "comment ça marche", "démarrer"],
    response: {
      text: "Commencez par compléter votre profil, puis explorez les missions disponibles. Si vous connaissez quelqu'un qui correspond à une mission, envoyez une introduction !",
      action: { label: "Voir les missions", href: "/missions" },
      source: "faq",
    },
  },
  {
    keywords: ["explique", "cette page", "à quoi ça sert", "comment utiliser"],
    response: {
      text: "Cette page regroupe tout ce dont vous avez besoin pour agir. Les blocs en haut sont vos priorités immédiates. Les blocs en bas suivent vos résultats.",
      source: "faq",
    },
  },
  {
    keywords: ["statut", "que signifie", "statuts", "validé", "en attente", "refusé"],
    response: {
      text: "**Envoyée** = votre intro est partie.\n**En cours** = l'entreprise l'examine.\n**Validée** = gain confirmé ! 🎉\n**Refusée** = ce contact ne correspondait pas.",
      source: "faq",
    },
  },
  {
    keywords: ["priorités", "priorité", "urgent", "important"],
    response: {
      text: "Vos priorités : 1) Introductions à valider. 2) Nouvelles missions. 3) Contacts à relancer.",
      action: { label: "À faire", href: "/actions" },
      source: "faq",
    },
  },
  {
    keywords: ["gain", "gains", "argent", "combien", "récompense"],
    response: {
      text: "Vos gains s'accumulent à chaque introduction validée. Consultez la page Gains pour voir le détail.",
      action: { label: "Voir mes gains", href: "/gains" },
      source: "faq",
    },
  },
  {
    keywords: ["mission", "missions", "opportunité"],
    response: {
      text: "Les missions sont des demandes d'introductions d'entreprises. Parcourez-les et envoyez une introduction si vous connaissez quelqu'un qui correspond.",
      action: { label: "Voir les missions", href: "/missions" },
      source: "faq",
    },
  },
];

function getJarvisResponse(input: string): AiResponse {
  const lower = input.toLowerCase();
  for (const { keywords, response } of JARVIS_RESPONSES) {
    if (keywords.some((kw) => lower.includes(kw))) return response;
  }
  return {
    text: "Je suis là pour vous aider ! Vous pouvez me demander de résumer votre situation, d'expliquer un statut, ou de vous guider vers la prochaine étape.",
    source: "faq",
  };
}

// ── Délai simulé réaliste ─────────────────────────────────────────────────────
function simulateLatency(source: string): number {
  if (source === "faq") return 300;
  if (source === "model_light") return 800;
  return 1500;
}

// ── Point d'entrée principal ──────────────────────────────────────────────────
export async function askAI(req: AiRequest): Promise<AiResponse> {
  // JARVIS : toujours passer par les réponses transverses
  if (req.role === "jarvis") {
    const faqHit = getFaqResponse(req.input);
    if (faqHit) {
      await new Promise((r) => setTimeout(r, simulateLatency("faq")));
      return faqHit;
    }
    const jarvisResp = getJarvisResponse(req.input);
    await new Promise((r) => setTimeout(r, simulateLatency("faq")));
    return jarvisResp;
  }

  // COPILOT : routing hiérarchique
  const route = routeRequest(req);

  if (route === "faq") {
    const hit = getFaqResponse(req.input);
    if (hit) {
      await new Promise((r) => setTimeout(r, simulateLatency("faq")));
      return hit;
    }
  }

  // Niveau mock (simule model_light et model_strong)
  await new Promise((r) => setTimeout(r, simulateLatency("model_light")));
  return getMockResponse(req);

  /*
   * ══════════════════════════════════════════════════════════════
   * BRANCHEMENT FUTUR — API Qwen (compatible OpenAI)
   * Décommentez et configurez VITE_QWEN_API_URL + VITE_QWEN_API_KEY
   * ══════════════════════════════════════════════════════════════
   *
   * const SYSTEM_PROMPTS: Record<CopilotContext, string> = {
   *   mission: "Tu es un expert en apport d'affaires...",
   *   introduction: "Tu aides à rédiger des introductions business...",
   *   // ... etc
   * };
   *
   * const response = await fetch(`${import.meta.env.VITE_QWEN_API_URL}/v1/chat/completions`, {
   *   method: 'POST',
   *   headers: {
   *     'Authorization': `Bearer ${import.meta.env.VITE_QWEN_API_KEY}`,
   *     'Content-Type': 'application/json',
   *   },
   *   body: JSON.stringify({
   *     model: route === "model_strong" ? "qwen-max" : "qwen-turbo",
   *     messages: [
   *       { role: "system", content: SYSTEM_PROMPTS[req.context] },
   *       { role: "user", content: req.input },
   *     ],
   *     max_tokens: 300,
   *     temperature: 0.7,
   *   }),
   * });
   *
   * const data = await response.json();
   * return { text: data.choices[0].message.content, source: route };
   */
}

// ── Suggestions contextuelles (boutons pré-définis) ──────────────────────────
export const COPILOT_SUGGESTIONS: Record<CopilotContext, { label: string; prompt: string }[]> = {
  mission: [
    { label: "Améliorer ce texte", prompt: "Améliore la description de cette mission pour la rendre plus attirante" },
    { label: "Rendre plus clair", prompt: "Rends ce texte plus clair et plus simple à comprendre" },
    { label: "Que faire ensuite ?", prompt: "Que dois-je faire maintenant pour cette mission ?" },
  ],
  introduction: [
    { label: "Améliorer mon message", prompt: "Améliore mon texte d'introduction pour le rendre plus convaincant" },
    { label: "Simplifier", prompt: "Simplifie ce message pour qu'il soit plus direct" },
    { label: "M'aider à compléter", prompt: "Aide-moi à compléter cette introduction" },
  ],
  profil_entreprise: [
    { label: "Améliorer ma description", prompt: "Améliore ma description d'entreprise pour attirer plus d'apporteurs" },
    { label: "Mieux cibler ma clientèle", prompt: "Aide-moi à mieux décrire le type de clients que je cherche" },
    { label: "Rendre plus convaincant", prompt: "Rends mon profil plus convaincant et plus précis" },
  ],
  profil_facilitateur: [
    { label: "Améliorer mon profil", prompt: "Améliore la description de mon réseau" },
    { label: "Décrire mon réseau", prompt: "Aide-moi à mieux décrire mon réseau" },
  ],
  contact: [
    { label: "Résumer ce contact", prompt: "Résume ce contact et ce que je sais de lui" },
    { label: "Que faire maintenant ?", prompt: "Quelle est la prochaine action pour ce contact ?" },
    { label: "Préparer un message", prompt: "Aide-moi à rédiger un message de prise de contact" },
  ],
  campagne: [
    { label: "Améliorer la campagne", prompt: "Améliore la structure de cette campagne" },
    { label: "Optimiser les messages", prompt: "Comment rendre mes messages plus efficaces ?" },
    { label: "Suggérer des étapes", prompt: "Propose une meilleure séquence d'étapes" },
  ],
  actions: [
    { label: "Prioriser mes actions", prompt: "Aide-moi à prioriser mes actions du moment" },
    { label: "Que faire en premier ?", prompt: "Que dois-je faire en premier ?" },
  ],
  dashboard: [
    { label: "Résume ma situation", prompt: "Résume ma situation actuelle" },
    { label: "Que faire maintenant ?", prompt: "Que dois-je faire maintenant ?" },
  ],
  gains: [
    { label: "Expliquer mes gains", prompt: "Explique le statut de mes gains en attente" },
    { label: "Comment gagner plus ?", prompt: "Comment puis-je obtenir plus de gains validés ?" },
  ],
  contacts: [
    { label: "Organiser mes contacts", prompt: "Comment organiser mes contacts efficacement ?" },
    { label: "Que faire maintenant ?", prompt: "Quelle est la prochaine étape avec mes contacts ?" },
  ],
  campaign: [
    { label: "Améliorer la campagne", prompt: "Améliore la structure de cette campagne" },
    { label: "Optimiser les messages", prompt: "Comment rendre mes messages plus efficaces ?" },
  ],
  missions: [
    { label: "Voir mes priorités", prompt: "Quelles missions prioriser en ce moment ?" },
    { label: "Comment bien démarrer ?", prompt: "Comment bien démarrer sur une nouvelle mission ?" },
  ],
  studio: [
    { label: "Aide-moi à démarrer", prompt: "Par où commencer pour préparer ma première campagne ?" },
    { label: "Quel canal choisir ?", prompt: "Quel canal de prospection me conseilles-tu ?" },
    { label: "Comment organiser ?", prompt: "Comment organiser mes contacts avant de lancer ?" },
  ],
  sources: [
    { label: "Optimiser mes imports", prompt: "Comment préparer mon fichier pour un import réussi ?" },
    { label: "Éviter les doublons", prompt: "Comment éviter les doublons dans ma base de contacts ?" },
  ],
  messages: [
    { label: "Améliorer mon message", prompt: "Améliore ce message pour le rendre plus humain et efficace" },
    { label: "Raccourcir", prompt: "Rends ce message plus court et plus direct" },
    { label: "Rendre plus humain", prompt: "Rends ce message plus naturel et moins formel" },
  ],
  regles: [
    { label: "Quelles règles activer ?", prompt: "Quelles règles de sécurité me conseilles-tu d'activer ?" },
    { label: "Expliquer les règles", prompt: "Explique-moi à quoi servent ces règles de sécurité" },
  ],
  canaux: [
    { label: "Quel canal choisir ?", prompt: "Quel canal me conseilles-tu pour débuter ma prospection ?" },
    { label: "Comparer les canaux", prompt: "Quelles sont les différences entre email et téléphone ?" },
  ],
  opportunites: [
    { label: "Que traiter en premier ?", prompt: "Quelle opportunité dois-je traiter en priorité ?" },
    { label: "Comprendre les statuts", prompt: "Explique-moi les différents statuts des opportunités" },
  ],
  agents: [
    { label: "Comment ça fonctionne ?", prompt: "Explique-moi comment fonctionnent mes agents OpenClaw" },
    { label: "Quel niveau d'autonomie ?", prompt: "Quel niveau d'autonomie me conseilles-tu ?" },
  ],
  dossier: [
    { label: "Améliorer ma description", prompt: "Aide-moi à améliorer la description de mon offre" },
    { label: "Définir ma cible", prompt: "Aide-moi à définir précisément ma cible idéale" },
  ],
  "dashboard-facilitateur": [
    { label: "Mes priorités", prompt: "Quelles sont mes priorités du moment ?" },
    { label: "Comment gagner plus ?", prompt: "Comment puis-je augmenter mes gains ?" },
  ],
  "dashboard-entreprise": [
    { label: "Mes priorités", prompt: "Quelles sont mes priorités du moment ?" },
    { label: "Quels facilitateurs activer ?", prompt: "Quels facilitateurs me recommandes-tu d'activer ?" },
  ],
  "passive-os": [
    { label: "Par où commencer ?", prompt: "Par où commencer pour activer le mode passif ?" },
    { label: "Comment gagner sans effort ?", prompt: "Comment monétiser mon réseau avec un minimum d'effort ?" },
  ],
  "import-reseau": [
    { label: "Format recommandé", prompt: "Quel format de fichier est recommandé pour l'import ?" },
    { label: "Optimiser mon réseau", prompt: "Comment organiser mon réseau pour maximiser les gains ?" },
  ],
  offres: [
    { label: "Quelle offre choisir ?", prompt: "Quelle offre est la plus adaptée à mon réseau ?" },
    { label: "Comment partager ?", prompt: "Quel est le meilleur canal pour partager ces offres ?" },
  ],
  "offres-entreprise": [
    { label: "Générer un pack IA", prompt: "Comment générer un pack de messages pour mon offre ?" },
    { label: "Activer des facilitateurs", prompt: "Comment activer plus de facilitateurs sur cette offre ?" },
  ],
  pilotage: [
    { label: "Quoi traiter en premier ?", prompt: "Quelle opportunité dois-je traiter en priorité ?" },
    { label: "Résume la situation", prompt: "Résume l'état de mon pipeline commercial" },
  ],
  radar: [
    { label: "Expliquer les signaux", prompt: "Que signifient ces signaux d'intention ?" },
    { label: "Quelle action suggères-tu ?", prompt: "Quelle est la meilleure action pour cette opportunité ?" },
  ],
  validations: [
    { label: "Expliquer cette validation", prompt: "Explique-moi ce que ferait cette validation" },
    { label: "Est-ce risqué ?", prompt: "Quel est le niveau de risque de cette action ?" },
  ],
  chaud: [
    { label: "Que faire maintenant ?", prompt: "Quelle est ma priorité avec ces signaux chauds ?" },
    { label: "Expliquer les signaux", prompt: "Comment fonctionnent les intérêts qualifiés ?" },
  ],
};

export const JARVIS_QUICK_QUESTIONS = [
  "Que dois-je faire maintenant ?",
  "Résume ma situation",
  "Aide-moi à démarrer",
  "Montre-moi mes priorités",
  "Que signifient ces statuts ?",
  "Comment fonctionnent les missions ?",
];
