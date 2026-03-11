import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GLOSSARY: Record<string, string> = {
  "Mission": "Une offre que vous publiez pour trouver des clients via le réseau.",
  "Introduction": "Un facilitateur présente un contact qualifié à une entreprise.",
  "Facilitateur": "Une personne qui utilise son réseau pour connecter entreprises et clients potentiels.",
  "OpenClaw": "Le moteur d'intelligence artificielle qui prospecte automatiquement pour vous.",
  "KITT IA": "Votre assistant IA personnel qui analyse votre pipeline et vous guide.",
  "Deal Radar": "Système de détection automatique d'opportunités commerciales.",
  "Score de confiance": "Note calculée sur l'historique réel d'un facilitateur.",
  "Cockpit": "Votre tableau de bord central avec toutes vos données.",
};

interface GlossaryTooltipProps {
  term: string;
  children: ReactNode;
}

export default function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const definition = GLOSSARY[term];
  if (!definition) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-default">
            {children}
            <span
              className="inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none shrink-0"
              style={{
                width: 13,
                height: 13,
                color: "hsl(var(--muted-foreground) / 0.5)",
                border: "1px solid hsl(var(--muted-foreground) / 0.3)",
              }}
              aria-label={`Définition : ${term}`}
            >
              i
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[200px] text-[13px] leading-relaxed"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
            boxShadow: "0 4px 16px hsl(var(--foreground) / 0.08)",
          }}
        >
          {definition}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
