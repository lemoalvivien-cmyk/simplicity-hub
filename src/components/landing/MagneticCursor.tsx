import { useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SPRING_TIGHT = { stiffness: 550, damping: 28, mass: 0.3 };
const SPRING_LOOSE = { stiffness: 90,  damping: 22, mass: 0.6 };
const SPRING_AURA  = { stiffness: 45,  damping: 18, mass: 1.0 };

export default function MagneticCursor() {
  const reduced = usePrefersReducedMotion();

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  const dotX  = useSpring(rawX, SPRING_TIGHT);
  const dotY  = useSpring(rawY, SPRING_TIGHT);
  const ringX = useSpring(rawX, SPRING_LOOSE);
  const ringY = useSpring(rawY, SPRING_LOOSE);
  const auraX = useSpring(rawX, SPRING_AURA);
  const auraY = useSpring(rawY, SPRING_AURA);

  // Use refs for hot-path state to avoid re-renders
  const stateRef = useRef<"default" | "hover" | "magnetic" | "hidden">("hidden");
  const isHiddenRef  = useRef(true);
  const isHoverRef   = useRef(false);
  const isMagneticRef = useRef(false);
  const rafRef = useRef<number>();

  // Framer motion values for animated properties (GPU-composited)
  const dotOpacity   = useSpring(0, { stiffness: 200, damping: 28 });
  const dotScale     = useSpring(1, { stiffness: 340, damping: 26 });
  const ringOpacity  = useSpring(0, { stiffness: 200, damping: 28 });
  const ringWidth    = useSpring(36, { stiffness: 340, damping: 26 });
  const ringHeight   = useSpring(36, { stiffness: 340, damping: 26 });
  const auraOpacity  = useSpring(0, { stiffness: 160, damping: 30 });
  const auraW        = useSpring(96, { stiffness: 200, damping: 24 });
  const auraH        = useSpring(96, { stiffness: 200, damping: 24 });

  useEffect(() => {
    // Never show on touch or reduced-motion
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (reduced) return;

    const updateSpringState = (next: typeof stateRef.current) => {
      stateRef.current = next;
      const hidden   = next === "hidden";
      const hover    = next === "hover" || next === "magnetic";
      const magnetic = next === "magnetic";

      dotOpacity.set(hidden ? 0 : 1);
      dotScale.set(hover ? 0 : 1);
      ringOpacity.set(hidden ? 0 : 0.75);
      ringWidth.set(magnetic ? 68 : hover ? 52 : 36);
      ringHeight.set(magnetic ? 68 : hover ? 52 : 36);
      auraOpacity.set(hover ? 1 : 0);
      auraW.set(magnetic ? 140 : 96);
      auraH.set(magnetic ? 140 : 96);
    };

    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const mag = el?.closest("[data-magnetic]") as HTMLElement | null;

        if (mag) {
          const r  = mag.getBoundingClientRect();
          const cx = r.left + r.width  / 2;
          const cy = r.top  + r.height / 2;
          rawX.set(cx + (e.clientX - cx) * 0.4);
          rawY.set(cy + (e.clientY - cy) * 0.4);
          updateSpringState("magnetic");
        } else {
          rawX.set(e.clientX);
          rawY.set(e.clientY);
          const interactive = el?.closest("a,button,[role='button'],input,textarea,select");
          updateSpringState(interactive ? "hover" : "default");
        }
      });
    };

    const onLeave = () => updateSpringState("hidden");
    const onEnter = () => updateSpringState(stateRef.current === "hidden" ? "default" : stateRef.current);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  // Don't mount DOM nodes at all on touch / reduced-motion
  if (reduced) return null;

  return (
    <>
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%", opacity: dotOpacity, scale: dotScale }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: "hsl(var(--accent))",
            boxShadow: "0 0 8px hsl(var(--accent) / 0.8)",
            willChange: "transform, opacity",
          }}
        />
      </motion.div>

      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full"
        style={{
          x: ringX, y: ringY,
          translateX: "-50%", translateY: "-50%",
          opacity: ringOpacity,
          width: ringWidth,
          height: ringHeight,
          border: "1.5px solid hsl(var(--primary-glow) / 0.65)",
          boxShadow: "0 0 8px hsl(var(--primary-glow) / 0.2)",
          willChange: "transform, opacity, width, height",
        }}
      />

      {/* Force-field aura */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{ x: auraX, y: auraY, translateX: "-50%", translateY: "-50%", opacity: auraOpacity, willChange: "transform, opacity" }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: auraW, height: auraH,
            background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.18) 0%, transparent 70%)",
            willChange: "width, height",
          }}
        />
      </motion.div>

      {/* Chromatic aberration trailing ghost */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9996] rounded-full"
        style={{
          x: auraX, y: auraY,
          translateX: "-50%", translateY: "-50%",
          width: 8, height: 8,
          background: "hsl(var(--primary-glow))",
          opacity: 0.35,
          filter: "blur(1px)",
          willChange: "transform",
        }}
      />
    </>
  );
}
