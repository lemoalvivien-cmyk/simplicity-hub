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

  const role: UserRole =
    roleProp ??
    (profile?.role === "entreprise" ? "entreprise"
     : profile?.role === "admin"    ? "admin"
     : "facilitateur");

  const jarvisRole: "entreprise" | "facilitateur" =
    role === "entreprise" ? "entreprise" : "facilitateur";

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar — desktop only, 224px wide */}
      <UserNav role={role} />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-56 overflow-x-hidden">
        <main className="flex-1 container py-8 animate-fade-in pb-20 md:pb-8 overflow-x-hidden">
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
      </div>

      {/* JARVIS — assistant global flottant, hide on mobile */}
      <div className="hidden md:block">
        <JarvisButton context={jarvisContext} userRole={jarvisRole} />
      </div>
    </div>
  );
}
