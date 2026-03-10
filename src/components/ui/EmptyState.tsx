/**
 * EmptyState — Shared empty state component for all list pages
 */
import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; to: string };
  secondary?: { label: string; to: string };
}

export default function EmptyState({ icon: Icon, title, description, cta, secondary }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration ring */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-muted">
          <Icon size={32} className="text-muted-foreground opacity-50" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/20 border-2 border-background" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        {cta && (
          <Link to={cta.to} className="btn-cta text-sm px-5 py-2.5">
            {cta.label}
          </Link>
        )}
        {secondary && (
          <Link
            to={secondary.to}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
