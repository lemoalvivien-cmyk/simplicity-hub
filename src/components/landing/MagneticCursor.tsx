import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function MagneticCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const springX = useSpring(trailX, { stiffness: 80, damping: 20, mass: 0.5 });
  const springY = useSpring(trailY, { stiffness: 80, damping: 20, mass: 0.5 });

  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    // Skip on touch/mobile devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Magnetic attraction to interactive elements
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const magnetic = el?.closest("[data-magnetic]");
        if (magnetic) {
          const rect = (magnetic as HTMLElement).getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          trailX.set(cx + dx * 0.35);
          trailY.set(cy + dy * 0.35);
          setHovered(true);
        } else {
          trailX.set(e.clientX);
          trailY.set(e.clientY);
          setHovered(!!el?.closest("a, button, [role='button']"));
        }
      });
    };

    const leave = () => setHidden(true);
    const enter = () => setHidden(false);

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Main dot — follows raw mouse */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: hidden ? 0 : 1,
        }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: "hsl(var(--accent))",
            mixBlendMode: "difference",
          }}
        />
      </motion.div>

      {/* Trailing ring — springy magnetic */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: hidden ? 0 : 0.65,
        }}
        animate={{
          width: hovered ? 52 : 36,
          height: hovered ? 52 : 36,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          className="w-full h-full rounded-full border-2"
          style={{
            borderColor: hovered
              ? "hsl(var(--accent) / 0.9)"
              : "hsl(var(--primary-glow) / 0.7)",
            boxShadow: hovered
              ? "0 0 18px hsl(var(--accent) / 0.4), inset 0 0 12px hsl(var(--accent) / 0.08)"
              : "0 0 10px hsl(var(--primary-glow) / 0.25)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
      </motion.div>

      {/* Force-field aura — slow outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: hovered ? 0.18 : 0,
        }}
        transition={{ opacity: { duration: 0.3 } }}
      >
        <div
          className="w-24 h-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.35) 0%, transparent 70%)",
          }}
        />
      </motion.div>
    </>
  );
}
