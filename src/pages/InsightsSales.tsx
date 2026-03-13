import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Code2, Shield, Zap, TrendingUp, Globe, Lock, BarChart3, Database, Key, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INSIGHTS_PRICING } from "@/lib/insightsPricingConfig";
import PublicNav from "@/components/layout/PublicNav";
import PageTitle from "@/components/ui/PageTitle";

const FADE_UP = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const STAGGER = { visible: { transition: { staggerChildren: 0.1 } } };

// ── Swagger endpoint rows ─────────────────────────────────────────────

const ENDPOINTS = [
  {
    method: "GET",
    path: "/?action=signals",
    description: "Retourne les signaux anonymisés du graphe (probabilités, patterns, timing)",
    tiers: ["starter", "growth", "enterprise"],
    example: `curl -H "Authorization: Bearer eil_<key>" \\
  "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api?action=signals"`,
  },
  {
    method: "GET",
    path: "/?action=stats",
    description: "Statistiques agrégées du graphe de confiance (total edges, avg weight, types)",
    tiers: ["growth", "enterprise"],
    example: `curl -H "Authorization: Bearer eil_<key>" \\
  "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api?action=stats"`,
  },
  {
    method: "GET",
    path: "/?action=quota",
    description: "Consommation mensuelle et quota restant pour la clé API",
    tiers: ["starter", "growth", "enterprise"],
    example: `curl -H "Authorization: Bearer eil_<key>" \\
  "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api?action=quota"`,
  },
  {
    method: "GET",
    path: "/?action=openapi",
    description: "Spécification OpenAPI 3.1 complète (JSON)",
    tiers: ["starter", "growth", "enterprise"],
    example: `curl "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api?action=openapi"`,
  },
];

const SIGNAL_SCHEMA = `{
  "signal_id":        "uuid",          // identifiant anonyme
  "signal_type":      "string",        // opportunity_predicted | hidden_link_detected | ...
  "confidence_score": 87,              // 0 – 100
  "probability":      0.871,           // 0.0 – 1.0
  "timing_weeks_min": 6,
  "timing_weeks_max": 10,
  "sector":           "Finance",
  "zone":             "EMEA",
  "pattern_tag":      "TRUST_PATH_CONVERGENCE",
  "precision_delta":  12,              // gain de précision par signal supplémentaire
  "anon_node_a":      "a3f8b7c4d2e1…", // SHA-256 tronqué (16 chars)
  "anon_node_b":      "7c4d2e1f9a0b…"
}`;

// ── Pricing card ──────────────────────────────────────────────────────

function PricingCard({
  tier,
  config,
  popular,
}: {
  tier: string;
  config: typeof INSIGHTS_PRICING[keyof typeof INSIGHTS_PRICING];
  popular?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/signup?redirect=/insights-sales`;
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id:  config.price_id,
          mode:      "subscription",
          success_url: `${window.location.origin}/insights-sales?success=1`,
          cancel_url:  `${window.location.origin}/insights-sales`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast({ title: "Erreur", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      variants={FADE_UP}
      className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
        popular
          ? "border-primary bg-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.15)]"
          : "border-border bg-card"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold tracking-widest uppercase">
            ⚡ Le plus choisi
          </Badge>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          {tier.toUpperCase()}
        </p>
        <p className="font-display text-3xl font-bold text-foreground">{config.amount.toLocaleString("fr-FR")} €</p>
        <p className="text-sm text-muted-foreground mt-1">/ mois · facturé mensuellement</p>
        <p className="text-sm text-muted-foreground mt-3">{config.description}</p>
      </div>

      <ul className="flex flex-col gap-2 flex-1">
        {config.signals.map((s) => (
          <li key={s} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            {s}
          </li>
        ))}
        <li className="flex items-start gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          Rate limit : {config.rate_limit}
        </li>
        <li className="flex items-start gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 mt-0.5 shrink-0" />
          SLA : {config.sla}
        </li>
      </ul>

      <Button
        onClick={handleSubscribe}
        disabled={loading}
        variant={popular ? "default" : "outline"}
        className="w-full"
        size="lg"
      >
        {loading ? "Redirection…" : tier === "enterprise" ? "Contacter les ventes" : "Commencer maintenant"}
      </Button>
    </motion.div>
  );
}

// ── Collapsible endpoint row ──────────────────────────────────────────

function EndpointRow({ ep }: { ep: typeof ENDPOINTS[0] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  function copy() {
    navigator.clipboard.writeText(ep.example);
    toast({ title: "Copié !", description: "Exemple cURL copié." });
  }

  const methodColor = ep.method === "GET"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : "bg-blue-500/10 text-blue-400 border-blue-500/30";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-card hover:bg-accent/30 transition-colors text-left"
      >
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${methodColor}`}>
          {ep.method}
        </span>
        <span className="font-mono text-sm text-foreground flex-1">/insights-api{ep.path}</span>
        <div className="flex gap-1">
          {ep.tiers.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] capitalize">{t}</Badge>
          ))}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 bg-card/50 border-t border-border space-y-3">
          <p className="text-sm text-muted-foreground pt-3">{ep.description}</p>
          <div className="relative">
            <pre className="bg-background/80 rounded-lg p-4 text-xs font-mono text-foreground/90 overflow-x-auto border border-border">
              {ep.example}
            </pre>
            <button
              onClick={copy}
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function InsightsSales() {
  const [signalTab, setSignalTab] = useState<"schema" | "example">("schema");

  const exampleResponse = `{
  "ok": true,
  "meta": {
    "api_version": "v1",
    "tier": "growth",
    "signals_count": 42,
    "avg_confidence": 73,
    "max_probability": 0.921,
    "pattern_distribution": {
      "TRUST_PATH_CONVERGENCE": 18,
      "LATENT_TRUST_BRIDGE": 24
    },
    "anonymization": "SHA-256-truncated-16chars",
    "generated_at": "2026-03-13T15:22:01.000Z"
  },
  "signals": [
    {
      "signal_id": "b3f7a9c2-…",
      "signal_type": "opportunity_predicted",
      "confidence_score": 92,
      "probability": 0.921,
      "timing_weeks_min": 6,
      "timing_weeks_max": 9,
      "sector": "Finance",
      "zone": "EMEA",
      "pattern_tag": "TRUST_PATH_CONVERGENCE",
      "precision_delta": 14,
      "anon_node_a": "a3f8b7c4d2e1f9a0…",
      "anon_node_b": null
    }
    // … 41 autres signaux
  ]
}`;

  return (
    <>
      <PageTitle title="Eternal Insights API — Intelligence B2B" />
      <PublicNav />

      <main className="min-h-screen bg-background text-foreground">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-32 pb-24">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          </div>

          <motion.div
            className="container max-w-5xl mx-auto px-4 text-center relative"
            initial="hidden" animate="visible" variants={STAGGER}
          >
            <motion.div variants={FADE_UP} className="mb-6">
              <Badge variant="outline" className="text-primary border-primary/40 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
                🔐 Licences B2B — Accès Institutionnel
              </Badge>
            </motion.div>

            <motion.h1
              variants={FADE_UP}
              className="font-display text-5xl md:text-7xl font-black text-foreground leading-[0.95] mb-6"
            >
              Eternal Insights<br />
              <span className="text-primary">Licensing API</span>
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Signaux anonymisés ultra-puissants issus du graphe de confiance mondial.
              Probabilités de deals, patterns cachés, timing parfait — pour fonds d'investissement,
              banques d'affaires et corporates.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-wrap gap-4 justify-center">
              <a href="#pricing">
                <Button size="lg" className="px-8">Voir les offres</Button>
              </a>
              <a href="#docs">
                <Button size="lg" variant="outline" className="px-8 gap-2">
                  <Code2 className="w-4 h-4" /> Documentation API
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        <section className="border-y border-border bg-card/50">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {[
                { icon: <TrendingUp className="w-5 h-5 text-primary" />, value: "92 %", label: "Précision prédictive max" },
                { icon: <Database className="w-5 h-5 text-primary" />,   value: "6–12 sem", label: "Fenêtre de prédiction" },
                { icon: <Globe className="w-5 h-5 text-primary" />,      value: "EMEA+", label: "Couverture géographique" },
                { icon: <Shield className="w-5 h-5 text-primary" />,     value: "SHA-256", label: "Anonymisation renforcée" },
              ].map(({ icon, value, label }) => (
                <div key={label} className="py-8 px-6 flex flex-col items-center text-center gap-2">
                  {icon}
                  <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section className="py-24">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
              className="text-center mb-16"
            >
              <motion.p variants={FADE_UP} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Comment ça fonctionne
              </motion.p>
              <motion.h2 variants={FADE_UP} className="font-display text-4xl font-bold text-foreground">
                L'intelligence de réseau, extractible en 1 appel
              </motion.h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Key className="w-6 h-6 text-primary" />,
                  title: "1. Obtenez votre clé API",
                  desc: "Souscrivez, recevez votre clé `eil_<prefix>_<secret>` immédiatement. Activée en moins de 60 secondes.",
                },
                {
                  icon: <Code2 className="w-6 h-6 text-primary" />,
                  title: "2. Appelez /insights-api",
                  desc: "Un seul endpoint REST. Action `signals` retourne vos signaux anonymisés selon votre tier de licence.",
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-primary" />,
                  title: "3. Intégrez & décidez",
                  desc: "Ingérez les probabilités dans vos modèles de scoring. Timing optimal, secteur, zone, précision croissante.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-2xl p-7">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-card/30">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
              className="text-center mb-16"
            >
              <motion.p variants={FADE_UP} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Licences
              </motion.p>
              <motion.h2 variants={FADE_UP} className="font-display text-4xl font-bold text-foreground">
                Choisissez votre niveau d'accès
              </motion.h2>
              <motion.p variants={FADE_UP} className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Tous les tiers incluent un chiffrement des données, une anonymisation SHA-256 et une facturation mensuelle Stripe.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
              className="grid md:grid-cols-3 gap-6"
            >
              <PricingCard tier="Starter"    config={INSIGHTS_PRICING.starter}    />
              <PricingCard tier="Growth"     config={INSIGHTS_PRICING.growth}     popular />
              <PricingCard tier="Enterprise" config={INSIGHTS_PRICING.enterprise} />
            </motion.div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Tous les prix sont hors taxes. Facturation mensuelle récurrente via Stripe.
              Résiliation possible à tout moment. NDA disponible sur demande.
            </p>
          </div>
        </section>

        {/* ── API Docs / Swagger ───────────────────────────────────── */}
        <section id="docs" className="py-24">
          <div className="container max-w-4xl mx-auto px-4">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
              className="mb-12"
            >
              <motion.p variants={FADE_UP} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Documentation
              </motion.p>
              <motion.h2 variants={FADE_UP} className="font-display text-4xl font-bold text-foreground mb-4">
                Référence API
              </motion.h2>
              <motion.p variants={FADE_UP} className="text-muted-foreground">
                Base URL :{" "}
                <code className="font-mono text-sm bg-card px-2 py-0.5 rounded border border-border text-primary">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api
                </code>
              </motion.p>
            </motion.div>

            {/* Auth */}
            <div className="mb-8 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Authentification</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Toutes les requêtes doivent inclure votre clé API dans le header <code className="font-mono bg-background px-1 rounded">Authorization</code>.
              </p>
              <pre className="bg-background rounded-lg p-4 text-xs font-mono text-foreground/90 border border-border overflow-x-auto">
                {`Authorization: Bearer eil_<your_api_key>`}
              </pre>
            </div>

            {/* Endpoints */}
            <h3 className="font-semibold text-foreground mb-4">Endpoints</h3>
            <div className="space-y-3 mb-10">
              {ENDPOINTS.map((ep) => <EndpointRow key={ep.path} ep={ep} />)}
            </div>

            {/* Signal schema */}
            <h3 className="font-semibold text-foreground mb-4">Modèle de données — InsightSignal</h3>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border">
                {(["schema", "example"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSignalTab(t)}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      signalTab === t
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "schema" ? "Schéma" : "Réponse exemple"}
                  </button>
                ))}
              </div>
              <pre className="p-5 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
                {signalTab === "schema" ? SIGNAL_SCHEMA : exampleResponse}
              </pre>
            </div>

            {/* OpenAPI spec link */}
            <div className="mt-6 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <a
                href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-api?action=openapi`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Télécharger la spec OpenAPI 3.1 complète (JSON)
              </a>
            </div>
          </div>
        </section>

        {/* ── Security ────────────────────────────────────────────── */}
        <section className="py-24 bg-card/30">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
              className="text-center mb-14"
            >
              <motion.p variants={FADE_UP} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Sécurité &amp; Conformité
              </motion.p>
              <motion.h2 variants={FADE_UP} className="font-display text-4xl font-bold text-foreground">
                Conçu pour les institutions réglementées
              </motion.h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <Shield />, title: "Anonymisation SHA-256", desc: "Aucun nom, email ou identifiant en clair. Chaque nœud est haché et tronqué à 16 caractères." },
                { icon: <Zap />,    title: "Rate limiting 120 req/min", desc: "Fenêtre glissante par clé API. Réponse 429 avec Retry-After. Protection DDoS native." },
                { icon: <Lock />,   title: "Authentification Bearer", desc: "Clés préfixées `eil_` hashées SHA-256 en base. Jamais stockées en clair." },
                { icon: <Database />, title: "Audit log complet",    desc: "Chaque appel est loggé (IP hashée, latence, signaux retournés) pour traçabilité." },
                { icon: <Globe />,  title: "RGPD by design",          desc: "Architecture Privacy by Default. Données agrégées uniquement. Aucun profiling individuel." },
                { icon: <Key />,    title: "Rotation de clés",        desc: "Révocation et rotation instantanée sans interruption de service. Clés à durée de vie configurable." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 bg-card rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={STAGGER}
            >
              <motion.h2 variants={FADE_UP} className="font-display text-4xl md:text-5xl font-black text-foreground mb-5">
                Prêt à exploiter<br />l'intelligence du graphe ?
              </motion.h2>
              <motion.p variants={FADE_UP} className="text-muted-foreground mb-10">
                Accès instantané après souscription. Clé API active en &lt; 60 secondes.
              </motion.p>
              <motion.div variants={FADE_UP} className="flex flex-wrap gap-4 justify-center">
                <a href="#pricing">
                  <Button size="lg" className="px-10 text-base">Souscrire maintenant</Button>
                </a>
                <a href="mailto:api@wiinupmax.com">
                  <Button size="lg" variant="outline" className="px-10 text-base">Contacter les ventes</Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer mini */}
        <footer className="border-t border-border py-8">
          <div className="container max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© 2026 WiinupMax · Eternal Insights Licensing API</span>
            <div className="flex gap-6">
              <a href="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="/cgu" className="hover:text-foreground transition-colors">CGU</a>
              <a href="mailto:api@wiinupmax.com" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
