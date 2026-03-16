// AUDIT 16/03/2026 – GodModeTeaser remplacé par section honnête "Comment ça marche"
// Aucune mention IA, vocal, God Mode, War Caller, 3 cerveaux.
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Users, CheckCircle, Banknote } from "lucide-react";

const EASE = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.65 };

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "Publiez votre mission",
    desc: "Décrivez le client idéal que vous cherchez. En 2 minutes, votre mission est visible par tout votre réseau.",
    color: "hsl(var(--primary))",
  },
  {
    num: "02",
    icon: Users,
    title: "Vos apporteurs proposent",
    desc: "Vos contacts — facilitateurs, partenaires, anciens collègues — vous présentent des prospects qu'ils connaissent personnellement.",
    color: "hsl(var(--accent))",
  },
  {
    num: "03",
    icon: CheckCircle,
    title: "Vous validez ou refusez",
    desc: "Chaque introduction est tracée et horodatée. Vous gardez le contrôle total. Rien ne se passe sans votre accord.",
    color: "hsl(152 62% 52%)",
  },
  {
    num: "04",
    icon: Banknote,
    title: "Le gain est versé automatiquement",
    desc: "Affaire signée ? La commission est versée automatiquement à l'apporteur. Vous ne payez que si ça marche.",
    color: "hsl(38 95% 52%)",
  },
];

export default function HowItWorksCoreSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="comment-ca-marche"
      ref={ref}
      className="py-24 relative overflow-hidden"
      style={{ background: "hsl(218 72% 5% / 0.98)" }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(218 72% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(218 72% 55%) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-5xl relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={EASE}
        >
          <p className="pill-tag mb-4 mx-auto w-fit">Simple. Traçable. Honnête.</p>
          <h2
            className="font-display font-bold text-white mb-4"
            style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)" }}
          >
            Comment ça marche ?
          </h2>
          <p className="text-white/55 max-w-md mx-auto text-sm leading-relaxed">
            Quatre étapes. Aucune magie. Juste votre réseau qui travaille pour vous — de façon
            transparente et équitable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(({ num, icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={num}
              className="rounded-2xl p-6 flex flex-col"
              style={{
                background: "hsl(218 55% 12% / 0.75)",
                border: `1px solid ${color.replace(")", " / 0.18)")}`,
              }}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: i * 0.1 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
                style={{ background: `${color.replace(")", " / 0.15)")}`, border: `1px solid ${color.replace(")", " / 0.25)")}` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <p className="font-display font-black text-3xl mb-2" style={{ color: `${color.replace(")", " / 0.25)")}` }}>
                {num}
              </p>
              <h3 className="font-semibold text-white text-sm mb-2 leading-snug">{title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
