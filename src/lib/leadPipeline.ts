/**
 * leadPipeline.ts — Core Domain Unification
 *
 * Single entry point for all commercial lead processing.
 * Every source (introduction, import, passive, radar, manual) routes through here.
 *
 * Tables involved:
 *   - lead_source_events  (immutable event log)
 *   - lead_intakes        (unified lead object)
 *   - lead_entity_links   (audit links between lead and entities)
 *   - lead_actions        (persistent action queue)
 *
 * DB triggers handle creation from introductions automatically.
 * This file provides the client-side helpers for sources that don't
 * have a DB trigger (import, passive click, radar, manual).
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export type LeadSourceType =
  | "introduction"
  | "import"
  | "manual"
  | "passive_click"
  | "radar_signal"
  | "mission_created"
  | "campaign_action";

export type QualificationStatus =
  | "pending_review"
  | "needs_enrichment"
  | "ready_for_opportunity"
  | "ready_for_action"
  | "blocked"
  | "duplicate";

export type DedupStatus = "unique" | "possible_duplicate" | "confirmed_duplicate" | "merged";

export type NextBestAction =
  | "review_lead"
  | "enrich_lead"
  | "contact_email_draft"
  | "contact_manual_call"
  | "request_facilitator_precision"
  | "promote_to_opportunity";

export type LeadActionStatus = "open" | "in_progress" | "done" | "superseded" | "cancelled";
export type LeadActionPriority = "low" | "normal" | "high" | "urgent";

export interface LeadIntake {
  id: string;
  user_id: string;
  source_type: LeadSourceType;
  person_name: string | null;
  person_email: string | null;
  company_name: string | null;
  phone: string | null;
  free_text_context: string | null;
  entreprise_id: string | null;
  facilitator_id: string | null;
  mission_id: string | null;
  introduction_id: string | null;
  linked_contact_id: string | null;
  linked_opportunity_id: string | null;
  qualification_status: QualificationStatus;
  dedup_status: DedupStatus;
  dedup_match_id: string | null;
  enrichment_status: string;
  policy_status: string;
  action_status: string;
  next_best_action: NextBestAction | null;
  nba_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface LeadAction {
  id: string;
  lead_intake_id: string;
  opportunity_id: string | null;
  actor_user_id: string;
  action_type: NextBestAction;
  status: LeadActionStatus;
  priority: LeadActionPriority;
  reason: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateLeadFromImportParams {
  userId: string;
  personName: string;
  personEmail: string | null;
  companyName: string | null;
  phone: string | null;
  contactId: string | null;
}

export interface CreateLeadFromPassiveParams {
  userId: string;
  shareLinkId: string;
  personEmail?: string;
  companyName?: string;
  context?: string;
}

export interface CreateLeadFromRadarParams {
  userId: string;
  targetName: string;
  targetCompany?: string;
  targetEmail?: string;
  radarSignalId?: string;
  context?: string;
}

export interface CreateLeadManualParams {
  userId: string;
  personName: string;
  personEmail?: string;
  companyName?: string;
  phone?: string;
  context?: string;
  contactId?: string;
}

// ─── NBA labels ──────────────────────────────────────────────

export const NBA_LABELS: Record<NextBestAction, string> = {
  review_lead: "Examiner ce lead",
  enrich_lead: "Compléter les données",
  contact_email_draft: "Rédiger un email",
  contact_manual_call: "Appeler manuellement",
  request_facilitator_precision: "Demander précisions au facilitateur",
  promote_to_opportunity: "Promouvoir en opportunité",
};

export const QUALIFICATION_LABELS: Record<QualificationStatus, string> = {
  pending_review: "À examiner",
  needs_enrichment: "Données manquantes",
  ready_for_opportunity: "Prêt à convertir",
  ready_for_action: "Action possible",
  blocked: "Bloqué",
  duplicate: "Doublon",
};

export const QUALIFICATION_COLORS: Record<QualificationStatus, { color: string; bg: string }> = {
  pending_review:        { color: "hsl(38 80% 30%)",              bg: "hsl(var(--accent-light))" },
  needs_enrichment:      { color: "hsl(0 72% 45%)",               bg: "hsl(0 72% 95%)" },
  ready_for_opportunity: { color: "hsl(var(--success))",          bg: "hsl(var(--success-light))" },
  ready_for_action:      { color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))" },
  blocked:               { color: "hsl(var(--destructive))",      bg: "hsl(0 72% 95%)" },
  duplicate:             { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

// ─── Typed Supabase helpers ───────────────────────────────────
// Use `as unknown as` only at the boundary where the generated types
// don't yet include the new tables (lead_actions, etc.).

type SupabaseAny = typeof supabase & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (t: string) => any;
};

const db = supabase as unknown as SupabaseAny;

// ─── Client-side dedup check ─────────────────────────────────

async function checkDuplicateEmail(
  userId: string,
  email: string
): Promise<{ isDuplicate: boolean; matchId: string | null }> {
  if (!email) return { isDuplicate: false, matchId: null };

  const { data } = await db
    .from("lead_intakes")
    .select("id")
    .eq("user_id", userId)
    .ilike("person_email", email.trim())
    .limit(1)
    .single();

  return data
    ? { isDuplicate: true, matchId: (data as { id: string }).id }
    : { isDuplicate: false, matchId: null };
}

// ─── Create from import ───────────────────────────────────────

export async function createLeadFromImport(
  params: CreateLeadFromImportParams
): Promise<{ intakeId: string | null; isDuplicate: boolean }> {
  const { data, error } = await supabase.rpc("create_lead_from_import" as never, {
    p_user_id:     params.userId,
    p_person_name: params.personName,
    p_person_email: params.personEmail ?? null,
    p_company_name: params.companyName ?? null,
    p_phone:       params.phone ?? null,
    p_contact_id:  params.contactId ?? null,
  } as never);

  if (error) {
    console.error("[leadPipeline] create_lead_from_import error:", error.message);
    return { intakeId: null, isDuplicate: false };
  }

  return { intakeId: data as string, isDuplicate: false };
}

// ─── Create from passive click ────────────────────────────────

export async function createLeadFromPassive(
  params: CreateLeadFromPassiveParams
): Promise<{ intakeId: string | null }> {
  const dedup = params.personEmail
    ? await checkDuplicateEmail(params.userId, params.personEmail)
    : { isDuplicate: false, matchId: null };

  const eventResult = await db.from("lead_source_events").insert({
    user_id:          params.userId,
    source_type:      "passive_click",
    source_ref_id:    params.shareLinkId,
    source_ref_type:  "offer_share_link",
    raw_payload: {
      email:   params.personEmail,
      company: params.companyName,
      context: params.context,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };
  const eventId = (eventResult.data as { id: string }).id;

  const intakeResult = await db.from("lead_intakes").insert({
    user_id:          params.userId,
    source_event_id:  eventId,
    source_type:      "passive_click",
    person_email:     params.personEmail ?? null,
    company_name:     params.companyName ?? null,
    free_text_context: params.context ?? null,
    dedup_status:     dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id:   dedup.matchId,
    qualification_status: dedup.isDuplicate
      ? "duplicate"
      : params.personEmail && params.companyName
      ? "ready_for_action"
      : "pending_review",
    next_best_action: dedup.isDuplicate
      ? null
      : params.personEmail && params.companyName
      ? "contact_email_draft"
      : "review_lead",
  }).select("id").single();

  if (intakeResult.error || !intakeResult.data) return { intakeId: null };
  const intakeId = (intakeResult.data as { id: string }).id;

  await db.from("lead_source_events")
    .update({ intake_id: intakeId, processed: true })
    .eq("id", eventId);

  return { intakeId };
}

// ─── Create from radar signal ─────────────────────────────────

export async function createLeadFromRadar(
  params: CreateLeadFromRadarParams
): Promise<{ intakeId: string | null }> {
  const dedup = params.targetEmail
    ? await checkDuplicateEmail(params.userId, params.targetEmail)
    : { isDuplicate: false, matchId: null };

  const eventResult = await db.from("lead_source_events").insert({
    user_id:         params.userId,
    source_type:     "radar_signal",
    source_ref_id:   params.radarSignalId ?? null,
    source_ref_type: "radar_signal",
    raw_payload: {
      name:    params.targetName,
      company: params.targetCompany,
      email:   params.targetEmail,
      context: params.context,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };
  const eventId = (eventResult.data as { id: string }).id;

  const intakeResult = await db.from("lead_intakes").insert({
    user_id:          params.userId,
    source_event_id:  eventId,
    source_type:      "radar_signal",
    person_name:      params.targetName,
    person_email:     params.targetEmail ?? null,
    company_name:     params.targetCompany ?? null,
    free_text_context: params.context ?? null,
    dedup_status:     dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id:   dedup.matchId,
    qualification_status: dedup.isDuplicate ? "duplicate" : "pending_review",
    next_best_action: dedup.isDuplicate ? null : "review_lead",
  }).select("id").single();

  if (intakeResult.error || !intakeResult.data) return { intakeId: null };
  const intakeId = (intakeResult.data as { id: string }).id;

  await db.from("lead_source_events")
    .update({ intake_id: intakeId, processed: true })
    .eq("id", eventId);

  return { intakeId };
}

// ─── Create manual lead ───────────────────────────────────────

export async function createLeadManual(
  params: CreateLeadManualParams
): Promise<{ intakeId: string | null }> {
  const dedup = params.personEmail
    ? await checkDuplicateEmail(params.userId, params.personEmail)
    : { isDuplicate: false, matchId: null };

  const eventResult = await db.from("lead_source_events").insert({
    user_id:         params.userId,
    source_type:     "manual",
    source_ref_id:   params.contactId ?? null,
    source_ref_type: params.contactId ? "contact" : null,
    raw_payload: {
      name:    params.personName,
      email:   params.personEmail,
      company: params.companyName,
      phone:   params.phone,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };
  const eventId = (eventResult.data as { id: string }).id;

  const intakeResult = await db.from("lead_intakes").insert({
    user_id:          params.userId,
    source_event_id:  eventId,
    source_type:      "manual",
    person_name:      params.personName,
    person_email:     params.personEmail ?? null,
    company_name:     params.companyName ?? null,
    phone:            params.phone ?? null,
    free_text_context: params.context ?? null,
    linked_contact_id: params.contactId ?? null,
    dedup_status:     dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id:   dedup.matchId,
    qualification_status: dedup.isDuplicate
      ? "duplicate"
      : params.personEmail && params.companyName
      ? "ready_for_action"
      : "pending_review",
    next_best_action: dedup.isDuplicate ? null : "review_lead",
  }).select("id").single();

  if (intakeResult.error || !intakeResult.data) return { intakeId: null };
  const intakeId = (intakeResult.data as { id: string }).id;

  await db.from("lead_source_events")
    .update({ intake_id: intakeId, processed: true })
    .eq("id", eventId);

  return { intakeId };
}

// ─── Promote lead to opportunity (client-side call) ───────────

export async function promoteLeadToOpportunity(
  intakeId: string
): Promise<{ opportunityId: string | null }> {
  const { data, error } = await supabase.rpc(
    "promote_lead_to_opportunity" as never,
    { p_intake_id: intakeId } as never
  );

  if (error) {
    console.error("[leadPipeline] promote_lead_to_opportunity error:", error.message);
    return { opportunityId: null };
  }

  return { opportunityId: data as string };
}

// ─── Complete a lead action ────────────────────────────────────

export async function completeLeadAction(actionId: string): Promise<boolean> {
  const { error } = await db.from("lead_actions")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", actionId);

  return !error;
}

// ─── Fetch lead intakes for a user ───────────────────────────

export async function fetchLeadIntakes(
  userId: string,
  options?: {
    qualificationStatus?: QualificationStatus;
    limit?: number;
    asEntreprise?: boolean;
  }
): Promise<LeadIntake[]> {
  let query = db
    .from("lead_intakes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.asEntreprise) {
    // Entreprise: read via RLS (relational policy); no extra filter needed
    query = query.eq("entreprise_id", userId);
  } else {
    query = query.eq("user_id", userId);
  }

  if (options?.qualificationStatus) {
    query = query.eq("qualification_status", options.qualificationStatus);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[leadPipeline] fetchLeadIntakes error:", error.message);
    return [];
  }

  return (data ?? []) as LeadIntake[];
}

// ─── Fetch open lead actions for a user ──────────────────────

export async function fetchOpenLeadActions(
  actorUserId: string,
  limit = 20
): Promise<LeadAction[]> {
  const { data, error } = await db
    .from("lead_actions")
    .select("*")
    .eq("actor_user_id", actorUserId)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[leadPipeline] fetchOpenLeadActions error:", error.message);
    return [];
  }

  return (data ?? []) as LeadAction[];
}

// ─── Fetch lead pipeline summary ─────────────────────────────

export interface LeadPipelineSummary {
  total: number;
  pending_review: number;
  needs_enrichment: number;
  ready_for_opportunity: number;
  ready_for_action: number;
  blocked: number;
  duplicate: number;
}

export async function fetchLeadPipelineSummary(
  userId: string,
  asEntreprise = false
): Promise<LeadPipelineSummary> {
  let query = db.from("lead_intakes").select("qualification_status");

  if (asEntreprise) {
    query = query.eq("entreprise_id", userId);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  const empty: LeadPipelineSummary = {
    total: 0, pending_review: 0, needs_enrichment: 0,
    ready_for_opportunity: 0, ready_for_action: 0, blocked: 0, duplicate: 0,
  };

  if (error || !data) return empty;

  const counts = { ...empty, total: data.length };
  for (const row of data as Array<{ qualification_status: string }>) {
    const s = row.qualification_status as QualificationStatus;
    if (s in counts) counts[s]++;
  }

  return counts;
}
