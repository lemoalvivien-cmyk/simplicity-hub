import { useState } from "react";
import { Sparkles } from "lucide-react";
import JarvisDrawer from "./JarvisDrawer";
import { CopilotContext } from "@/lib/aiService";

interface JarvisButtonProps {
  context?: CopilotContext;
  userRole?: "entreprise" | "facilitateur";
}

export default function JarvisButton({ context = "dashboard", userRole = "facilitateur" }: JarvisButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-200 hover:scale-105 active:scale-100"
        style={{
          background: "var(--gradient-primary)",
          color: "hsl(var(--primary-foreground))",
          boxShadow: "var(--shadow-primary)",
        }}
        aria-label="Ouvrir KITT IA"
      >
        <Sparkles size={16} />
        <span className="hidden sm:inline">KITT IA</span>
        {/* Pulse indicator */}
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card animate-pulse"
          style={{ background: "hsl(var(--accent))" }}
        />
      </button>

      <JarvisDrawer
        open={open}
        onClose={() => setOpen(false)}
        context={context}
        userRole={userRole}
      />
    </>
  );
}
