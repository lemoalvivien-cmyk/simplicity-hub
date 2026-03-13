import { useRef, useState, useEffect, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Landmark, ChevronDown, Sparkles, Users } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { track } from "@/lib/landingTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRICING } from "@/lib/pricingConfig";

const HeroSphere = lazy(() => import("./HeroSphere"));

const BOUNCE = { type: "spring" as const, stiffness: 260, damping: 18 };
const EASE_POWER = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.75 };

// ─── Slot counter live ─────────────────────────────────────────────────────
function SlotBadge() {
  const [slots, setSlots] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from("launch_quota")
      .select("total_slots, used_slots")
      .single()
      .then(({ data }) => {
        if (data) setSlots(Math.max(0, data.total_slots - data.used_slots));
      });
  }, []);
  if (slots === null) return null;
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={BOUNCE}
      style={{
        background: "hsl(var(--accent) / 0.15)",
        border: "1px solid hsl(var(--accent) / 0.4)",
        color: "hsl(var(--accent))",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "hsl(var(--accent))" }}
      />
      {slots} / 100 places restantes
    </motion.span>
  );
}

// ─── Floating stat card ────────────────────────────────────────────────────
function StatCard({
  label, value, color, delay, className,
}: { label: string; value: string; color: string; delay: number; className: string }) {
  return (
    <motion.div
      className={`absolute ${className} px-4 py-3 rounded-2xl`}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...BOUNCE, delay }}
      whileHover={{ scale: 1.06, y: -3 }}
      style={{
        background: "hsl(218 55% 13% / 0.82)",
        border: `1px solid ${color.replace(")", " / 0.22)")}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px hsl(218 72% 5% / 0.5)`,
        willChange: "transform",
      }}
    >
      <p className="text-[10px] font-medium text-white/50 mb-0.5">{label}</p>
      <p className="font-display font-bold text-2xl leading-none" style={{ color }}>{value}</p>
    </motion.div>
  );
}

// ─── Main CTA button: Activer Founder Pass via Stripe ─────────────────────
function FounderPassButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    track("cta_hero_founder_pass");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/signup";
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: PRICING.launch.price_id },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "Erreur checkout");
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au paiement. Veuillez vous connecter d'abord.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/signup"; }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={BOUNCE}
      className="btn-cta flex items-center justify-center gap-2.5 px-8 py-4 text-[0.95rem] font-bold disabled:opacity-60"
    >
      <Zap size={16} strokeWidth={2.5} />
      {loading ? "Chargement…" : "Je veux mes premiers clients dès demain — 99 €/an"}
      {!loading && <ArrowRight size={15} />}
    </motion.button>
  );
}

// ─── PSD2 bank connect button ──────────────────────────────────────────────
function BankPSD2Button() {
  const { toast } = useToast();

  const handleClick = () => {
    track("cta_hero_bank_psd2");
    toast({
      title: "Connexion bancaire PSD2",
      description: "Connectez votre banque pour activer le Live Cash Flow et le scoring ADA.",
    });
    window.location.href = "/dashboard?tab=bank";
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={BOUNCE}
      className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-semibold border text-white/85 hover:text-white transition-colors duration-200"
      style={{
        borderColor: "hsl(210 85% 45% / 0.45)",
        background: "hsl(210 85% 15% / 0.35)",
        backdropFilter: "blur(10px)",
        color: "hsl(210 85% 75%)",
      }}
    >
      <Landmark size={15} strokeWidth={2} />
      Connect Bank PSD2
    </motion.button>
  );
}

// ─── Main hero ─────────────────────────────────────────────────────────────
export default function HeroFounderPass() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 55, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 55, damping: 22 });
  const bgX = useTransform(smoothX, [-1, 1], ["-10px", "10px"]);
  const bgY = useTransform(smoothY, [-1, 1], ["-10px", "10px"]);

  const [sphereX, setSphereX] = useState(0);
  const [sphereY, setSphereY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(nx);
    mouseY.set(ny);
    setSphereX(nx);
    setSphereY(-ny);
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background: "linear-gradient(155deg, hsl(218 72% 3%) 0%, hsl(218 72% 8%) 50%, hsl(218 65% 12%) 100%)",
      }}
    >
      {/* Grid parallax */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: bgX, y: bgY }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </motion.div>

      {/* Glow layers */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 85% 60% at 58% 35%, hsl(218 72% 24% / 0.45) 0%, transparent 65%)" }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 42% 38% at 60% 34%, hsl(var(--accent) / 0.07) 0%, transparent 60%)" }} aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, hsl(218 72% 3% / 0.85))" }} aria-hidden="true" />

      {/* Content */}
      <div className="container relative z-10 flex-1 flex items-center pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full items-center">

          {/* LEFT — text */}
          <div className="flex flex-col">

            {/* Slot badge */}
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={EASE_POWER}
              className="mb-6"
            >
              <SlotBadge />
            </motion.div>

            {/* Brand + price — THE key headline */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.06 }}
              className="mb-5"
            >
              {/* WIINUP MAX big stamp */}
              <p
                className="font-display font-black tracking-tight leading-none mb-3"
                style={{
                  fontSize: "clamp(2.6rem, 7vw, 5rem)",
                  background: "linear-gradient(135deg, hsl(0 0% 100%) 30%, hsl(218 72% 72%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.03em",
                }}
              >
                WIINUP MAX
              </p>

              {/* Offer stamp */}
              <div
                className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 rounded-2xl mb-5"
                style={{
                  background: "hsl(var(--accent) / 0.12)",
                  border: "1px solid hsl(var(--accent) / 0.35)",
                }}
              >
                <Zap size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0" />
                <span className="font-bold text-base" style={{ color: "hsl(var(--accent))" }}>
                  Founder Pass 99 €/an
                </span>
                <span className="text-white/50 text-xs line-through">990 €</span>
                <span className="text-white/60 text-xs">· 100 places max</span>
              </div>

              {/* The EXACT required copy — large & prominent */}
              <h1
                className="font-display font-bold text-white leading-[1.28] tracking-tight"
                style={{ fontSize: "clamp(1.15rem, 2.5vw, 1.6rem)" }}
              >
                WiinupMax : vos premiers clients arrivent en moins de{" "}
                <span style={{ color: "hsl(var(--accent))" }}>24 heures</span>
                … et vos contacts{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 72%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  gagnent de l'argent sans rien faire.
                </span>
              </h1>
            </motion.div>

            {/* Sub-copy */}
            <motion.p
              className="text-white/62 mb-7 leading-[1.78]"
              style={{ fontSize: "clamp(0.88rem, 1.8vw, 1rem)" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.26 }}
            >
              Une plateforme simple et magnifique qui travaille pour vous. Elle trouve toute seule les bonnes personnes qui veulent acheter chez vous. Vos amis et connaissances vous présentent des clients prêts à signer. Tout se passe dans un seul espace calme et protégé, sans effort, sans stress, sans rien changer à votre vie.
            </motion.p>

            {/* CTA row */}
            <motion.div
              className="flex flex-col sm:flex-row flex-wrap gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.38 }}
            >
              <FounderPassButton />
              <BankPSD2Button />
            </motion.div>

            {/* Secondary links */}
            <motion.div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <Link
                to="/signup"
                className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/70 transition-colors"
                onClick={() => track("cta_hero_facilitateur")}
              >
                <Users size={11} />
                Je veux gagner de l'argent facilement — Gratuit pour toujours
              </Link>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/35 text-xs">Accès immédiat · Aucune CB requise pour inscription</span>
            </motion.div>
          </div>

          {/* RIGHT — 3D sphere + stat cards */}
          <motion.div
            className="relative w-full hidden lg:flex items-center justify-center"
            style={{ height: "540px" }}
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at center, hsl(var(--primary-glow) / 0.16) 0%, hsl(var(--accent) / 0.055) 38%, transparent 68%)",
                filter: "blur(24px)",
              }}
              aria-hidden="true"
            />
            <Suspense
              fallback={
                <motion.div
                  className="w-44 h-44 rounded-full"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: "hsl(var(--primary-glow) / 0.18)" }}
                />
              }
            >
              <HeroSphere mouseX={sphereX} mouseY={sphereY} />
            </Suspense>

            <StatCard label="Royalty WMAX" value="12 %" color="hsl(var(--accent))" delay={0.7} className="top-8 left-0" />
            <StatCard label="Gains tracés" value="2 800 €" color="hsl(152 62% 52%)" delay={0.82} className="bottom-16 left-0" />
            <StatCard label="Deals ADA fermés" value="8" color="hsl(var(--primary-glow))" delay={0.76} className="top-20 right-0" />
            <StatCard label="Swarm agents" value="24/7" color="hsl(210 85% 72%)" delay={0.88} className="bottom-20 right-0" />
          </motion.div>
        </div>
      </div>

      {/* Mobile ring */}
      <motion.div
        className="lg:hidden relative h-52 flex items-center justify-center overflow-hidden mx-auto w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.8 }}
      >
        <motion.div
          className="w-44 h-44 rounded-full"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.38) 0%, hsl(var(--primary) / 0.12) 50%, transparent 70%)",
            boxShadow: "0 0 65px hsl(var(--primary-glow) / 0.28), 0 0 0 1px hsl(var(--primary-glow) / 0.1)",
          }}
        />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        style={{ color: "hsl(0 0% 100% / 0.28)" }}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
        whileHover={{ color: "hsl(0 0% 100% / 0.55)" }}
      >
        <span className="text-[9px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={17} />
        </motion.div>
      </motion.div>
    </section>
  );
}
