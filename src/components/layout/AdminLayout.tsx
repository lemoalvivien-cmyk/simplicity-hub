import { ReactNode } from "react";
import AdminNav from "./AdminNav";
import ProductionReadyBadge from "@/components/landing/ProductionReadyBadge";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminNav />

      {/* Content — offset for sidebar on desktop */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Page header */}
        <div className="bg-card border-b border-border px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <ProductionReadyBadge />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
