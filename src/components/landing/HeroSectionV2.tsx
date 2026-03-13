import { useRef, useState, useEffect, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, ChevronDown, Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { track } from "@/lib/landingTracking";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const HeroSphere = lazy(() => import("./HeroSphere"));

// ─── Spring bounce easing = cubic-bezier(0.34, 1.56, 0.64, 1) ─────────────
const BOUNCE = { type: "spring" as const, stiffness: 260, damping: 18 };
const EASE_POWER = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.75 };

// ─── Kinetic headline word cycling ────────────────────────────────────────
const WORDS = ["vos revenus", "votre réseau", "votre pipeline", "vos opportunités", "votre avenir"];

function KineticWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ minWidth: "12ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: "110%", opacity: 0, skewY: 4 }}
          animate={{ y: "0%", opacity: 1, skewY: 0 }}
          exit={{ y: "-110%", opacity: 0, skewY: -4 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="block"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 74%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            willChange: "transform, opacity",
          }}
        >
          {WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Animated stat card (floating glassmorphism) ───────────────────────────
function StatCard({
  label, value, color, delay, className
}: {
  label: string; value: string; color: string; delay: number; className: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      className={`absolute ${className} px-4 py-3 rounded-2xl`}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...BOUNCE, delay }}
      whileHover={{ scale: 1.06, y: -3 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      style={{
        background: "hsl(218 55% 13% / 0.82)",
        border: `1px solid ${hov ? color.replace(")", " / 0.5)") : color.replace(")", " / 0.22)")}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: hov
          ? `0 12px 40px hsl(218 72% 5% / 0.6), 0 0 0 1px ${color.replace(")", " / 0.2)")}`
          : `0 8px 32px hsl(218 72% 5% / 0.5)`,
        willChange: "transform",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
    >
      <p className="text-[10px] font-medium text-white/50 mb-0.5">{label}</p>
      <p className="font-display font-bold text-2xl leading-none" style={{ color }}>{value}</p>
    </motion.div>
  );
}

// ─── Glowing trust pill ────────────────────────────────────────────────────
function TrustPill({ label, i }: { label: string; i: number }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ ...BOUNCE, delay: 0.55 + i * 0.07 }}
      whileHover={{ scale: 1.07 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold cursor-default"
      style={{
        background: hov ? "hsl(218 55% 22% / 0.8)" : "hsl(218 55% 18% / 0.55)",
        border: `1px solid ${hov ? "hsl(218 55% 40% / 0.5)" : "hsl(218 55% 33% / 0.3)"}`,
        color: "hsl(var(--primary-glow))",
        backdropFilter: "blur(8px)",
        transition: "background 0.2s, border-color 0.2s",
        willChange: "transform",
      }}
    >
      {label}
    </motion.span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function HeroSectionV2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 55, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 55, damping: 22 });

  const bgX = useTransform(smoothX, [-1, 1], ["-10px", "10px"]);
  const bgY = useTransform(smoothY, [-1, 1], ["-10px", "10px"]);

  const [sphereX, setSphereX] = useState(0);
  const [sphereY, setSphereY] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReduced) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(nx);
    mouseY.set(ny);
    setSphereX(nx);
    setSphereY(-ny);
  };

  const PILLS = ["Introductions traçées", "Gains protégés", "IA assistée réelle", "Résultats mesurables"];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)",
      }}
    >
      {/* ── Parallax grid ─────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: bgX, y: bgY }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.032]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </motion.div>

      {/* ── Radial depth glows ────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 90% 65% at 62% 38%, hsl(218 72% 25% / 0.42) 0%, transparent 65%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 45% 42% at 64% 36%, hsl(var(--accent) / 0.065) 0%, transparent 60%)" }}
        aria-hidden="true"
      />
      {/* Bottom vignette */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(218 72% 4% / 0.8))" }}
        aria-hidden="true"
      />

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="container relative z-10 flex-1 flex items-center pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full items-center">

          {/* LEFT ── text column */}
          <div className="flex flex-col">

            {/* Launch banner */}
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={EASE_POWER}
              className="mb-8"
            >
              <LaunchQuotaBanner variant="hero" />
            </motion.div>

            {/* ── H1: kinetic headline with mandatory phrase ─── */}
            <motion.h1
              className="font-display font-bold text-white leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.2rem, 5.2vw, 3.6rem)" }}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.08 }}
            >
              Avec Wiinup, augmentez{" "}
              <KineticWord />
              <motion.span
                className="block mt-2 text-white/82"
                style={{ fontSize: "clamp(1.35rem, 3.2vw, 2.15rem)", fontWeight: 600, lineHeight: 1.35 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE_POWER, delay: 0.22 }}
              >
                en toute sécurité, sans investir,{" "}
                <br className="hidden sm:block" />
                sans charge mentale, et sans bousculer
                <br className="hidden sm:block" />
                vos habitudes.
              </motion.span>
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              className="text-white/72 mb-4 leading-[1.82] max-w-xl"
              style={{ fontSize: "clamp(0.92rem, 1.9vw, 1.06rem)" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.3 }}
            >
              Founder Pass 99 €/an (100 places max) – ADA prospecte en voix + apporte des affaires + exécute en autonomie 24/7 via swarm + 12&nbsp;% royalty tokenisée WMAX revendable sur secondary market.
            </motion.p>

            {/* ── CTAs with haptic spring hover ─────────────── */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 mt-5 mb-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_POWER, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                <Link
                  to="/signup"
                  data-magnetic
                  className="btn-cta flex items-center justify-center gap-2 px-8 py-4 text-[0.95rem]"
                  onClick={() => track("cta_hero_enterprise")}
                >
                  <Sparkles size={15} strokeWidth={2} />
                  Créer mon accès — gratuit
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                <Link
                  to="/signup"
                  data-magnetic
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border text-white/82 hover:text-white transition-colors duration-200"
                  style={{
                    borderColor: "hsl(218 55% 33% / 0.5)",
                    background: "hsl(218 55% 17% / 0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => track("cta_hero_facilitateur")}
                >
                  <Users size={14} />
                  Devenir facilitateur
                </Link>
              </motion.div>
            </motion.div>

            {/* ── Trust pills ───────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {PILLS.map((p, i) => <TrustPill key={p} label={p} i={i} />)}
            </div>
          </div>

          {/* RIGHT ── 3D sphere + floating cards */}
          <motion.div
            className="relative w-full hidden lg:flex items-center justify-center"
            style={{ height: "540px" }}
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.15, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow behind sphere */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, hsl(var(--primary-glow) / 0.16) 0%, hsl(var(--accent) / 0.055) 38%, transparent 68%)",
                filter: "blur(24px)",
              }}
              aria-hidden="true"
            />

            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    className="w-44 h-44 rounded-full"
                    animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ background: "hsl(var(--primary-glow) / 0.18)" }}
                  />
                </div>
              }
            >
              <HeroSphere mouseX={sphereX} mouseY={sphereY} />
            </Suspense>

            {/* Floating stat cards */}
            <StatCard label="Missions actives"  value="3"       color="hsl(var(--primary-glow))"  delay={0.72} className="top-8 left-0" />
            <StatCard label="Gains tracés"       value="2 800 €" color="hsl(var(--accent))"        delay={0.84} className="bottom-16 left-0" />
            <StatCard label="Intros reçues"      value="12"      color="hsl(152 62% 52%)"           delay={0.78} className="top-20 right-0" />
            <StatCard label="En validation"      value="4"       color="hsl(38 95% 52%)"            delay={0.9}  className="bottom-20 right-0" />
          </motion.div>
        </div>
      </div>

      {/* ── Mobile ring fallback ──────────────────────────────── */}
      <motion.div
        className="lg:hidden relative h-56 flex items-center justify-center overflow-hidden mx-auto w-full max-w-xs"
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

      {/* ── Scroll indicator ──────────────────────────────────── */}
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
