/**
 * LaunchQuotaBanner — legacy component kept for compatibility.
 * Now delegates to the shared SlotCounter component.
 */
import SlotCounter from "@/components/landing/SlotCounter";

interface LaunchQuotaBannerProps {
  variant?: "hero" | "inline" | "pricing";
}

function LaunchQuotaBanner({ variant = "inline" }: LaunchQuotaBannerProps) {
  // Map legacy variants to SlotCounter variants
  const mapped = variant === "hero" ? "hero" : variant === "pricing" ? "banner" : "inline";
  return <SlotCounter variant={mapped} />;
}

export default LaunchQuotaBanner;
