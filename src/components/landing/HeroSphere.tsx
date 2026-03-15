/**
 * HeroSphere — CSS-only animated sphere (replaces @react-three/fiber).
 * Pure conic-gradient + keyframes rotate + glow. Zero WebGL dependency.
 * Responds to mouseX/mouseY via CSS custom properties.
 * Respects prefers-reduced-motion.
 */
import { useRef, useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface Props { mouseX?: number; mouseY?: number; }

export default function HeroSphere({ mouseX = 0, mouseY = 0 }: Props) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Parallax tilt via CSS transform on mouse move
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;
    const rx = mouseY * 14;
    const ry = mouseX * -14;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, [mouseX, mouseY, reduced]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        width: "340px",
        height: "340px",
        position: "relative",
        perspective: "800px",
        transformStyle: "preserve-3d",
        transition: "transform 0.12s ease-out",
        willChange: "transform",
      }}
    >
      {/* ── Core sphere ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "20px",
          borderRadius: "50%",
          background: `
            radial-gradient(circle at 35% 35%,
              hsl(218 72% 62% / 0.9) 0%,
              hsl(218 72% 28% / 0.95) 45%,
              hsl(218 72% 12% / 1) 100%
            )
          `,
          boxShadow: `
            inset -12px -12px 32px hsl(218 72% 8% / 0.8),
            inset 6px 6px 20px hsl(218 72% 72% / 0.18),
            0 0 60px hsl(218 72% 45% / 0.35),
            0 0 120px hsl(218 72% 35% / 0.2)
          `,
          animation: reduced ? "none" : "sphere-pulse 4s ease-in-out infinite",
        }}
      />

      {/* ── Ring 1 — orange equatorial ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "10px",
          borderRadius: "50%",
          border: "2px solid hsl(24 100% 58% / 0.55)",
          boxShadow: "0 0 12px hsl(24 100% 58% / 0.3)",
          animation: reduced ? "none" : "ring-spin-z 4.5s linear infinite",
          transformOrigin: "center center",
        }}
      />

      {/* ── Ring 2 — blue tilted ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "0px",
          borderRadius: "50%",
          border: "1.5px solid hsl(218 72% 58% / 0.45)",
          boxShadow: "0 0 8px hsl(218 72% 58% / 0.25)",
          animation: reduced ? "none" : "ring-spin-y 6.5s linear infinite reverse",
          transformOrigin: "center center",
          transform: "rotateX(65deg)",
        }}
      />

      {/* ── Ring 3 — green slow ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "-12px",
          borderRadius: "50%",
          border: "1px solid hsl(152 55% 45% / 0.3)",
          boxShadow: "0 0 6px hsl(152 55% 45% / 0.15)",
          animation: reduced ? "none" : "ring-spin-z 12s linear infinite",
          transformOrigin: "center center",
          transform: "rotateY(52deg) rotateX(20deg)",
        }}
      />

      {/* ── Specular highlight ──────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "38px",
          left: "62px",
          width: "52px",
          height: "32px",
          borderRadius: "50%",
          background: "hsl(218 90% 95% / 0.12)",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Glow halo ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "-30px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(218 72% 45% / 0.12) 0%, transparent 70%)",
          animation: reduced ? "none" : "glow-pulse 3s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />

      {/* ── CSS keyframes injected via style tag ────────────────────────────── */}
      <style>{`
        @keyframes ring-spin-z {
          from { transform: rotateZ(0deg); }
          to   { transform: rotateZ(360deg); }
        }
        @keyframes ring-spin-y {
          from { transform: rotateX(65deg) rotateZ(0deg); }
          to   { transform: rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes sphere-pulse {
          0%, 100% { box-shadow:
            inset -12px -12px 32px hsl(218 72% 8% / 0.8),
            inset 6px 6px 20px hsl(218 72% 72% / 0.18),
            0 0 60px hsl(218 72% 45% / 0.35),
            0 0 120px hsl(218 72% 35% / 0.2); }
          50% { box-shadow:
            inset -12px -12px 32px hsl(218 72% 8% / 0.8),
            inset 6px 6px 20px hsl(218 72% 72% / 0.22),
            0 0 80px hsl(218 72% 50% / 0.45),
            0 0 150px hsl(24 100% 55% / 0.12); }
        }
        @keyframes glow-pulse {
          from { opacity: 0.6; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
