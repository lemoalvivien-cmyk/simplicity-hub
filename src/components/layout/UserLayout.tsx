import { ReactNode } from "react";
import UserNav from "./UserNav";
import JarvisButton from "@/components/ai/JarvisButton";
import { CopilotContext } from "@/lib/aiService";

type UserRole = "entreprise" | "facilitateur";

interface UserLayoutProps {
  children: ReactNode;
  role?: UserRole;
  jarvisContext?: CopilotContext;
}

export default function UserLayout({ children, role = "facilitateur", jarvisContext = "dashboard" }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserNav role={role} />
      <main className="flex-1 container py-8 animate-fade-in pb-24">
        {children}
      </main>
      <footer className="border-t border-border py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 WIINUP MAX</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
          </div>
        </div>
      </footer>
      {/* JARVIS — assistant global flottant */}
      <JarvisButton context={jarvisContext} userRole={role} />
    </div>
  );
}
