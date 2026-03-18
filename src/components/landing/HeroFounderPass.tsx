import { useRef, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, ChevronDown, Lock } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { track } from "@/lib/landingTracking";
import { useFounderSlots } from "@/hooks/useFounderSlots";
import SlotCounter from "@/components/landing/SlotCounter";
import GuaranteeBadge from "@/components/landing/GuaranteeBadge";
import { CLOSED_BETA } from "@/lib/betaConfig";

const HeroSphere = lazy(() => import("./HeroSphere"));

const BOUNCE = { type: "spring" as const, stiffness: 260, damping: 18 };
const EASE_POWER = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.75 };

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

// ─── Main CTA button: points to /checkout ─────────────────────────────────
function FounderPassButton({ isSoldOut }: { isSoldOut: boolean }) {
  if (CLOSED_BETA) {
    return (
      <motion.div
        className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold border"
        style={{ borderColor: "hsl(var(--primary-glow) / 0.35)", color: "hsl(var(--primary-glow))" }}
      >
        <Lock size={15} />
        Bêta privée — Inscrivez-vous ci-dessous
      </motion.div>
    );
  }

  if (isSoldOut) {
    return (
      <motion.div
        className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold border cursor-not-allowed opacity-50"
        style={{ borderColor: "hsl(218 20% 60% / 0.3)", color: "hsl(218 20% 70%)" }}
      >
        <Lock size={15} />
        Offre de lancement terminée
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
      <Link
        to="/checkout"
        className="btn-cta flex items-center justify-center gap-2.5 px-8 py-4 text-[0.95rem] font-bold"
        onClick={() => track("cta_hero_founder_pass")}
      >
        <Zap size={16} strokeWidth={2.5} />
        Je veux mes premiers clients dès demain — 99 €/an
        <ArrowRight size={15} />
      </Link>
    </motion.div>
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

  const { isSoldOut } = useFounderSlots();

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

            {/* Slot badge — realtime */}
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={EASE_POWER}
              className="mb-6"
            >
              <SlotCounter variant="hero" />
            </motion.div>

            {/* Brand + price */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.06 }}
              className="mb-5"
            >
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
                <span className="text-white/60 text-xs">· Facturation annuelle</span>
              </div>

              <h1
                className="font-display font-bold text-white leading-[1.28] tracking-tight"
                style={{ fontSize: "clamp(1.15rem, 2.5vw, 1.6rem)" }}
              >
                Avec WiinupMax, augmentez vos revenus en toute sécurité, sans rien sortir de votre poche,{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 72%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  sans charge mentale, ni bousculer vos habitudes.
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
              Vos contacts — facilitateurs, partenaires, anciens collègues — vous présentent des prospects qu'ils connaissent personnellement. Chaque introduction est traçée et horodatée. Affaire signée ? Le gain de votre apporteur est versé automatiquement.{" "}
              <strong className="text-white/85">Vous ne payez que si ça marche.</strong>
            </motion.p>

            {/* CTA row */}
            <motion.div
              className="flex flex-col sm:flex-row flex-wrap gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.38 }}
            >
              <FounderPassButton isSoldOut={isSoldOut} isUrgent={isUrgent} remaining={remaining} />
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                <Link
                  to="/creer-emploi"
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border transition-all duration-200"
                  style={{ borderColor: "hsl(var(--accent) / 0.35)", color: "hsl(var(--accent))", background: "hsl(var(--accent) / 0.07)" }}
                  onClick={() => track("cta_hero_creer_emploi")}
                >
                  Créer mon emploi ou complément de revenus
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <span className="text-white/40 text-xs">Paiement sécurisé Stripe · Prix garanti à vie · Accès immédiat</span>
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

            <StatCard label="Gains versés" value="Auto" color="hsl(var(--accent))" delay={0.7} className="top-8 left-0" />
            <StatCard label="Gains tracés" value="2 800 €" color="hsl(152 62% 52%)" delay={0.82} className="bottom-16 left-0" />
            <StatCard label="Affaires signées" value="8" color="hsl(var(--primary-glow))" delay={0.76} className="top-20 right-0" />
            <StatCard label="Introductions reçues" value="12" color="hsl(210 85% 72%)" delay={0.88} className="bottom-20 right-0" />
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
