import { ReactNode } from "react";
import { Link } from "react-router-dom";
import UserNav from "./UserNav";
import JarvisButton from "@/components/ai/JarvisButton";
import { CopilotContext } from "@/lib/aiService";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "entreprise" | "facilitateur" | "admin";

interface UserLayoutProps {
  children: ReactNode;
  /** Override role — if omitted, uses the authenticated user's real role */
  role?: UserRole;
  jarvisContext?: CopilotContext;
}

export default function UserLayout({ children, role: roleProp, jarvisContext = "dashboard" }: UserLayoutProps) {
  const { profile } = useAuth();

  // Derive role from real profile; fallback to prop or "facilitateur"
  const role: UserRole =
    roleProp ??
    (profile?.role === "entreprise" ? "entreprise"
     : profile?.role === "admin"    ? "admin"
     : "facilitateur");

  const jarvisRole: "entreprise" | "facilitateur" =
    role === "entreprise" ? "entreprise" : "facilitateur";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserNav role={role} />
      {/* pb-20 on mobile to clear fixed bottom nav bar */}
      <main className="flex-1 container py-8 animate-fade-in pb-20 md:pb-8">
        {children}
      </main>
      <footer className="hidden md:block border-t border-border py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 WIINUP MAX</span>
          <div className="flex gap-4">
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          </div>
        </div>
      </footer>
      {/* JARVIS — assistant global flottant, hide on mobile (bottom nav conflict) */}
      <div className="hidden md:block">
        <JarvisButton context={jarvisContext} userRole={jarvisRole} />
      </div>
    </div>
  );
}
