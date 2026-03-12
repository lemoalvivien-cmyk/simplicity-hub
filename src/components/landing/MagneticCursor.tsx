import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

const SPRING_TIGHT = { stiffness: 550, damping: 28, mass: 0.3 };
const SPRING_LOOSE = { stiffness: 90, damping: 22, mass: 0.6 };
const SPRING_AURA  = { stiffness: 45, damping: 18, mass: 1.0 };

export default function MagneticCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  const dotX  = useSpring(rawX, SPRING_TIGHT);
  const dotY  = useSpring(rawY, SPRING_TIGHT);
  const ringX = useSpring(rawX, SPRING_LOOSE);
  const ringY = useSpring(rawY, SPRING_LOOSE);
  const auraX = useSpring(rawX, SPRING_AURA);
  const auraY = useSpring(rawY, SPRING_AURA);

  const [state, setState] = useState<"default" | "hover" | "magnetic" | "hidden">("hidden");
  const rafRef = useRef<number>();

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const mag = el?.closest("[data-magnetic]") as HTMLElement | null;

        if (mag) {
          const r = mag.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = (e.clientX - cx) * 0.4;
          const dy = (e.clientY - cy) * 0.4;
          rawX.set(cx + dx);
          rawY.set(cy + dy);
          setState("magnetic");
        } else {
          rawX.set(e.clientX);
          rawY.set(e.clientY);
          const interactive = el?.closest("a, button, [role='button'], input, textarea, select");
          setState(interactive ? "hover" : "default");
        }
      });
    };

    const onLeave = () => setState("hidden");
    const onEnter = () => setState("default");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isHidden   = state === "hidden";
  const isHover    = state === "hover" || state === "magnetic";
  const isMagnetic = state === "magnetic";

  return (
    <>
      {/* ── Inner dot — raw position ────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: isHidden ? 0 : 1, scale: isHover ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: "hsl(var(--accent))",
            boxShadow: "0 0 8px hsl(var(--accent) / 0.8)",
          }}
        />
      </motion.div>

      {/* ── Ring — spring-follows ───────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          border: isHover
            ? "1.5px solid hsl(var(--accent) / 0.9)"
            : "1.5px solid hsl(var(--primary-glow) / 0.65)",
          boxShadow: isHover
            ? "0 0 20px hsl(var(--accent) / 0.35), inset 0 0 10px hsl(var(--accent) / 0.08)"
            : "0 0 8px hsl(var(--primary-glow) / 0.2)",
        }}
        animate={{
          opacity: isHidden ? 0 : 0.75,
          width:  isMagnetic ? 68 : isHover ? 52 : 36,
          height: isMagnetic ? 68 : isHover ? 52 : 36,
        }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
      />

      {/* ── Force-field aura ────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{
          x: auraX,
          y: auraY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ opacity: isHover ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="rounded-full"
          animate={{ width: isMagnetic ? 140 : 96, height: isMagnetic ? 140 : 96 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          style={{
            background: isMagnetic
              ? "radial-gradient(circle, hsl(var(--accent) / 0.22) 0%, transparent 70%)"
              : "radial-gradient(circle, hsl(var(--primary-glow) / 0.18) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* ── Chromatic aberration ghost (trailing) ──────────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9996] rounded-full"
        style={{
          x: auraX,
          y: auraY,
          translateX: "-50%",
          translateY: "-50%",
          width: 8,
          height: 8,
          background: "hsl(var(--primary-glow))",
          opacity: 0.35,
          filter: "blur(1px)",
        }}
      />
    </>
  );
}
