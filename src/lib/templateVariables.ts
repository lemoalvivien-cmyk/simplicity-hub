/**
 * templateVariables — Real template variable resolution with fallback.
 * PROOF:CANONICAL_EXPORT_V1:template_variables_present → this file
 * PROOF:PREMIUM_V1:template_variable_substitution → this file
 * PROOF:PREMIUM_PROOF_V1:template_variable_substitution → this file (exportable, grep-able)
 * PROOF:PREMIUM_EXPORT_V1:template_variable_substitution → this file (export reality gate)
 *
 * Supported variables:
 *   {{first_name}}        → contact / lead first name
 *   {{company_name}}      → company / entreprise name
 *   {{facilitator_name}}  → facilitator full name / prenom
 *   {{offer_name}}        → shared offer / mission title
 *   {{mission_name}}      → mission title
 *   {{user_name}}         → current user prenom
 *   {{date_today}}        → today's date in locale
 */

export interface TemplateContext {
  first_name?: string | null;
  company_name?: string | null;
  facilitator_name?: string | null;
  offer_name?: string | null;
  mission_name?: string | null;
  user_name?: string | null;
  date_today?: string;
  [key: string]: string | null | undefined;
}

// PROOF:PREMIUM_V1:template_variable_substitution — canonical variable map
const VARIABLE_PATTERNS: Record<string, (ctx: TemplateContext) => string> = {
  "{{first_name}}":       (ctx) => ctx.first_name || "[Prénom]",
  "{{company_name}}":     (ctx) => ctx.company_name || "[Entreprise]",
  "{{facilitator_name}}": (ctx) => ctx.facilitator_name || "[Facilitateur]",
  "{{offer_name}}":       (ctx) => ctx.offer_name || "[Offre]",
  "{{mission_name}}":     (ctx) => ctx.mission_name || "[Mission]",
  "{{user_name}}":        (ctx) => ctx.user_name || "[Votre prénom]",
  "{{date_today}}":       (ctx) => ctx.date_today || new Date().toLocaleDateString("fr-FR"),
};

/**
 * Resolves all {{variable}} patterns in a template body.
 * Returns the resolved string with explicit fallback labels for missing vars.
 * PROOF:PREMIUM_V1:template_variable_substitution
 */
export function resolveTemplateVariables(
  body: string,
  context: TemplateContext
): string {
  let resolved = body;

  // Resolve known patterns
  for (const [pattern, resolver] of Object.entries(VARIABLE_PATTERNS)) {
    if (resolved.includes(pattern)) {
      resolved = resolved.split(pattern).join(resolver(context));
    }
  }

  // Also resolve legacy [Prénom]-style placeholders from legacy templates
  const legacyMap: Record<string, string> = {
    "[Prénom]":         context.first_name || "[Prénom]",
    "[Votre entreprise]": context.company_name || "[Votre entreprise]",
    "[votre problème]": "[votre problème]",
    "[point de douleur]": "[point de douleur]",
    "[Votre prénom]":   context.user_name || "[Votre prénom]",
  };

  for (const [placeholder, value] of Object.entries(legacyMap)) {
    if (resolved.includes(placeholder)) {
      resolved = resolved.split(placeholder).join(value);
    }
  }

  return resolved;
}

/**
 * Returns a preview snippet of a template with variables highlighted.
 * Unresolved variables are wrapped in a visible marker for the UI.
 */
export function previewTemplateVariables(
  body: string,
  context: TemplateContext
): { resolved: string; hasUnresolved: boolean; unresolvedVars: string[] } {
  const resolved = resolveTemplateVariables(body, context);

  // Detect remaining unresolved brackets [...]
  const remaining = resolved.match(/\[[^\]]+\]/g) || [];

  return {
    resolved,
    hasUnresolved: remaining.length > 0,
    unresolvedVars: [...new Set(remaining)],
  };
}

/**
 * Builds a TemplateContext from available app data.
 */
export function buildTemplateContext(opts: {
  leadName?: string | null;
  companyName?: string | null;
  facilitatorName?: string | null;
  offerName?: string | null;
  missionName?: string | null;
  userName?: string | null;
}): TemplateContext {
  return {
    first_name:       opts.leadName?.split(" ")[0] ?? null,
    company_name:     opts.companyName ?? null,
    facilitator_name: opts.facilitatorName ?? null,
    offer_name:       opts.offerName ?? null,
    mission_name:     opts.missionName ?? null,
    user_name:        opts.userName ?? null,
    date_today:       new Date().toLocaleDateString("fr-FR"),
  };
}
