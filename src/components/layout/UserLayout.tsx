import { ReactNode } from "react";
import { Link } from "react-router-dom";
import UserNav from "./UserNav";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "entreprise" | "facilitateur" | "admin";

interface UserLayoutProps {
  children: ReactNode;
  /** Override role — if omitted, uses the authenticated user's real role */
  role?: UserRole;
  /** @deprecated — kept for call-site compat, no effect */
  jarvisContext?: string;
}

export default function UserLayout({ children, role: roleProp }: UserLayoutProps) {
  const { profile } = useAuth();

  const role: UserRole =
    roleProp ??
    (profile?.role === "entreprise" ? "entreprise"
     : profile?.role === "admin"    ? "admin"
     : "facilitateur");

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Production banner */}
      <div className="w-full bg-primary text-primary-foreground text-center text-xs font-bold py-2 px-4 z-50 shrink-0 flex items-center justify-center gap-3 flex-wrap">
        <span>🏆 Wiinup Max — Réseau humain · Introductions qualifiées · Gains automatiques</span>
        <span className="hidden md:inline text-primary-foreground/60">|</span>
        <span className="hidden md:inline font-normal">⚡ Vos contacts vous envoient des introductions · Vous ne payez que si ça marche</span>
      </div>
      <div className="flex flex-1 overflow-x-hidden">
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
      </div>
    </div>
  );
}
