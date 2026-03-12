import { useRef, useState, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, ChevronDown, FlaskConical } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { track } from "@/lib/landingTracking";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";

// Lazy-load the heavy 3D sphere
import { lazy } from "react";
const HeroSphere = lazy(() => import("./HeroSphere"));

const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

// Kinetic variable headline — cycles through word variants
const HEADLINE_VARIANTS = [
  "vos revenus",
  "votre réseau",
  "votre pipeline",
  "vos opportunités",
];

function KineticWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIdx((i) => (i + 1) % HEADLINE_VARIANTS.length), 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ verticalAlign: "bottom" }}
    >
      <motion.span
        key={idx}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="block"
        style={{
          background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 74%))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {HEADLINE_VARIANTS[idx]}
      </motion.span>
    </span>
  );
}

export default function HeroSectionV2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const bgX = useTransform(smoothX, [-1, 1], ["-8px", "8px"]);
  const bgY = useTransform(smoothY, [-1, 1], ["-8px", "8px"]);

  const [sphereX, setSphereX] = useState(0);
  const [sphereY, setSphereY] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background:
          "linear-gradient(160deg, hsl(218 72% 5%) 0%, hsl(218 72% 10%) 45%, hsl(218 65% 14%) 100%)",
      }}
    >
      {/* Animated background grid */}
      <MotionDiv
        className="absolute inset-0 pointer-events-none"
        style={{ x: bgX, y: bgY }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </MotionDiv>

      {/* Radial glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 60% 40%, hsl(218 72% 28% / 0.45) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 62% 38%, hsl(var(--accent) / 0.07) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="container relative z-10 flex-1 flex items-center pt-24 pb-12 md:pt-28 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center">

          {/* Left — text */}
          <div className="flex flex-col">
            {/* Launch banner */}
            <MotionDiv
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <LaunchQuotaBanner variant="hero" />
            </MotionDiv>

            {/* Kinetic headline */}
            <MotionH1
              className="font-display font-bold text-white leading-[1.06] tracking-tight mb-7"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)" }}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Avec Wiinup, augmentez{" "}
              <KineticWord />{" "}
              <span className="block mt-2 text-white/85" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)", fontWeight: 600 }}>
                en toute sécurité, sans investir,
                <br />
                sans charge mentale, et sans bousculer vos habitudes.
              </span>
            </MotionH1>

            <MotionP
              className="text-white/75 mb-4 leading-[1.8] max-w-lg"
              style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              Prospection IA assistée + réseau humain structuré. OpenClaw et facilitateurs actifs travaillent en parallèle. Chaque opportunité tracée. Chaque résultat mesurable.
            </MotionP>

            {/* CTAs */}
            <MotionDiv
              className="flex flex-col sm:flex-row gap-3 mt-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38 }}
            >
              <Link
                to="/signup"
                data-magnetic
                className="btn-cta flex items-center justify-center gap-2 px-8 py-4 text-[0.95rem]"
                onClick={() => track("cta_hero_enterprise")}
              >
                Créer mon accès — gratuit
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/signup"
                data-magnetic
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border text-white/80 hover:text-white transition-all duration-200"
                style={{
                  borderColor: "hsl(218 55% 35% / 0.5)",
                  background: "hsl(218 55% 18% / 0.4)",
                  backdropFilter: "blur(8px)",
                }}
                onClick={() => track("cta_hero_facilitateur")}
              >
                <Users size={15} />
                Devenir facilitateur
              </Link>
            </MotionDiv>

            {/* Trust pills */}
            <MotionDiv
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              {[
                "Introductions traçées",
                "Gains protégés",
                "IA assistée réelle",
                "Résultats mesurables",
              ].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: "hsl(218 55% 20% / 0.6)",
                    border: "1px solid hsl(218 55% 35% / 0.35)",
                    color: "hsl(var(--primary-glow))",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {label}
                </span>
              ))}
            </MotionDiv>

            {/* Disclaimer */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-8 rounded-xl px-4 py-3.5 flex items-start gap-2.5"
              style={{
                background: "hsl(38 95% 52% / 0.08)",
                border: "1px solid hsl(38 95% 52% / 0.22)",
              }}
            >
              <FlaskConical size={13} style={{ color: "hsl(38 95% 52%)" }} className="shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold leading-relaxed" style={{ color: "hsl(38 95% 52%)" }}>
                Bêta privée – fonctionnalités IA en cours d'activation réelle avec API externe. Interface actuellement en mode illustratif. Les résultats dépendent de votre réseau et de votre suivi.
              </p>
            </MotionDiv>
          </div>

          {/* Right — 3D sphere */}
          <MotionDiv
            className="relative w-full hidden lg:flex items-center justify-center"
            style={{ height: "520px" }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow behind sphere */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, hsl(var(--primary-glow) / 0.18) 0%, hsl(var(--accent) / 0.06) 40%, transparent 70%)",
                filter: "blur(20px)",
              }}
              aria-hidden="true"
            />
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="w-40 h-40 rounded-full animate-pulse"
                    style={{ background: "hsl(var(--primary-glow) / 0.2)" }}
                  />
                </div>
              }
            >
              <HeroSphere mouseX={sphereX} mouseY={sphereY} />
            </Suspense>

            {/* Floating stat cards — glassmorphism */}
            {[
              { label: "Missions actives", value: "3", color: "hsl(var(--primary-glow))", pos: "top-8 left-0" },
              { label: "Gains tracés", value: "2 800 €", color: "hsl(var(--accent))", pos: "bottom-16 left-0" },
              { label: "Intros reçues", value: "12", color: "hsl(152 62% 48%)", pos: "top-20 right-0" },
              { label: "En validation", value: "4", color: "hsl(38 95% 52%)", pos: "bottom-20 right-0" },
            ].map((stat, i) => (
              <MotionDiv
                key={stat.label}
                className={`absolute ${stat.pos} px-4 py-3 rounded-2xl`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.12, duration: 0.6 }}
                style={{
                  background: "hsl(218 55% 14% / 0.75)",
                  border: `1px solid ${stat.color.replace(")", " / 0.3)")}`,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: `0 8px 32px hsl(218 72% 5% / 0.5), 0 0 0 1px ${stat.color.replace(")", " / 0.12)")}`,
                }}
              >
                <p className="text-[10px] font-medium text-white/55 mb-1">{stat.label}</p>
                <p
                  className="font-display font-bold text-xl leading-none"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </div>

      {/* Mobile 3D fallback — simple animated ring */}
      <MotionDiv
        className="lg:hidden relative h-64 flex items-center justify-center overflow-hidden mx-auto w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div
          className="w-40 h-40 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary-glow) / 0.4) 0%, hsl(var(--primary) / 0.15) 50%, transparent 70%)",
            boxShadow:
              "0 0 60px hsl(var(--primary-glow) / 0.3), 0 0 0 1px hsl(var(--primary-glow) / 0.12)",
            animation: "pulse 3s ease-in-out infinite",
          }}
        />
      </MotionDiv>

      {/* Scroll indicator */}
      <MotionDiv
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ color: "hsl(0 0% 100% / 0.3)" }}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
      >
        <span className="text-[10px] font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </MotionDiv>
    </section>
  );
}
