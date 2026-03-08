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
  pending_review: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  needs_enrichment: { color: "hsl(0 72% 45%)", bg: "hsl(0 72% 95%)" },
  ready_for_opportunity: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  ready_for_action: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  blocked: { color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)" },
  duplicate: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

// ─── Client-side dedup check ─────────────────────────────────

async function checkDuplicateEmail(
  userId: string,
  email: string
): Promise<{ isDuplicate: boolean; matchId: string | null }> {
  if (!email) return { isDuplicate: false, matchId: null };

  const { data } = await supabase
    .from("lead_intakes" as never)
    .select("id")
    .eq("user_id", userId)
    .ilike("person_email", email.trim())
    .limit(1)
    .single() as { data: { id: string } | null };

  return data
    ? { isDuplicate: true, matchId: data.id }
    : { isDuplicate: false, matchId: null };
}

// ─── Create from import (called after each successful DB insert) ──

export async function createLeadFromImport(
  params: CreateLeadFromImportParams
): Promise<{ intakeId: string | null; isDuplicate: boolean }> {
  // DB function handles the heavy lifting (dedup + pipeline)
  const { data, error } = await supabase.rpc("create_lead_from_import" as never, {
    p_user_id: params.userId,
    p_person_name: params.personName,
    p_person_email: params.personEmail ?? null,
    p_company_name: params.companyName ?? null,
    p_phone: params.phone ?? null,
    p_contact_id: params.contactId ?? null,
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
  const db = supabase as never as {
    from: (t: string) => {
      insert: (d: unknown) => { select: (f: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } };
    };
  };

  const dedup = params.personEmail
    ? await checkDuplicateEmail(params.userId, params.personEmail)
    : { isDuplicate: false, matchId: null };

  // Create source event
  const eventResult = await (db.from("lead_source_events")).insert({
    user_id: params.userId,
    source_type: "passive_click",
    source_ref_id: params.shareLinkId,
    source_ref_type: "offer_share_link",
    raw_payload: {
      email: params.personEmail,
      company: params.companyName,
      context: params.context,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };
  const eventId = eventResult.data.id;

  const intakeResult = await (db.from("lead_intakes")).insert({
    user_id: params.userId,
    source_event_id: eventId,
    source_type: "passive_click",
    person_email: params.personEmail ?? null,
    company_name: params.companyName ?? null,
    free_text_context: params.context ?? null,
    dedup_status: dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id: dedup.matchId,
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

  // Mark event as processed
  await (supabase as never as { from: (t: string) => { update: (d: unknown) => { eq: (c: string, v: string) => Promise<unknown> } } })
    .from("lead_source_events")
    .update({ intake_id: intakeResult.data.id, processed: true })
    .eq("id", eventId);

  return { intakeId: intakeResult.data.id };
}

// ─── Create from radar signal ─────────────────────────────────

export async function createLeadFromRadar(
  params: CreateLeadFromRadarParams
): Promise<{ intakeId: string | null }> {
  const db = supabase as never as {
    from: (t: string) => {
      insert: (d: unknown) => { select: (f: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } };
    };
  };

  const dedup = params.targetEmail
    ? await checkDuplicateEmail(params.userId, params.targetEmail)
    : { isDuplicate: false, matchId: null };

  const eventResult = await (db.from("lead_source_events")).insert({
    user_id: params.userId,
    source_type: "radar_signal",
    source_ref_id: params.radarSignalId ?? null,
    source_ref_type: "radar_signal",
    raw_payload: {
      name: params.targetName,
      company: params.targetCompany,
      email: params.targetEmail,
      context: params.context,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };

  const intakeResult = await (db.from("lead_intakes")).insert({
    user_id: params.userId,
    source_event_id: eventResult.data.id,
    source_type: "radar_signal",
    person_name: params.targetName,
    person_email: params.targetEmail ?? null,
    company_name: params.targetCompany ?? null,
    free_text_context: params.context ?? null,
    dedup_status: dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id: dedup.matchId,
    qualification_status: dedup.isDuplicate ? "duplicate" : "pending_review",
    next_best_action: dedup.isDuplicate ? null : "review_lead",
  }).select("id").single();

  if (intakeResult.error || !intakeResult.data) return { intakeId: null };

  await (supabase as never as { from: (t: string) => { update: (d: unknown) => { eq: (c: string, v: string) => Promise<unknown> } } })
    .from("lead_source_events")
    .update({ intake_id: intakeResult.data.id, processed: true })
    .eq("id", eventResult.data.id);

  return { intakeId: intakeResult.data.id };
}

// ─── Create manual lead ───────────────────────────────────────

export async function createLeadManual(
  params: CreateLeadManualParams
): Promise<{ intakeId: string | null }> {
  const db = supabase as never as {
    from: (t: string) => {
      insert: (d: unknown) => { select: (f: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } };
    };
  };

  const dedup = params.personEmail
    ? await checkDuplicateEmail(params.userId, params.personEmail)
    : { isDuplicate: false, matchId: null };

  const eventResult = await (db.from("lead_source_events")).insert({
    user_id: params.userId,
    source_type: "manual",
    source_ref_id: params.contactId ?? null,
    source_ref_type: params.contactId ? "contact" : null,
    raw_payload: {
      name: params.personName,
      email: params.personEmail,
      company: params.companyName,
      phone: params.phone,
    },
    processed: false,
  }).select("id").single();

  if (eventResult.error || !eventResult.data) return { intakeId: null };

  const intakeResult = await (db.from("lead_intakes")).insert({
    user_id: params.userId,
    source_event_id: eventResult.data.id,
    source_type: "manual",
    person_name: params.personName,
    person_email: params.personEmail ?? null,
    company_name: params.companyName ?? null,
    phone: params.phone ?? null,
    free_text_context: params.context ?? null,
    linked_contact_id: params.contactId ?? null,
    dedup_status: dedup.isDuplicate ? "confirmed_duplicate" : "unique",
    dedup_match_id: dedup.matchId,
    qualification_status: dedup.isDuplicate
      ? "duplicate"
      : params.personEmail && params.companyName
      ? "ready_for_action"
      : "pending_review",
    next_best_action: dedup.isDuplicate ? null : "review_lead",
  }).select("id").single();

  if (intakeResult.error || !intakeResult.data) return { intakeId: null };

  await (supabase as never as { from: (t: string) => { update: (d: unknown) => { eq: (c: string, v: string) => Promise<unknown> } } })
    .from("lead_source_events")
    .update({ intake_id: intakeResult.data.id, processed: true })
    .eq("id", eventResult.data.id);

  return { intakeId: intakeResult.data.id };
}

// ─── Fetch lead intakes for a user ───────────────────────────

export async function fetchLeadIntakes(
  userId: string,
  options?: {
    qualificationStatus?: QualificationStatus;
    limit?: number;
  }
): Promise<LeadIntake[]> {
  let query = (supabase as never as {
    from: (t: string) => {
      select: (f: string) => {
        eq: (c: string, v: string) => {
          order: (c: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: LeadIntake[] | null; error: Error | null }>;
          };
        };
      };
    };
  })
    .from("lead_intakes")
    .select("*")
    .eq("user_id", userId);

  if (options?.qualificationStatus) {
    (query as unknown as { eq: (c: string, v: string) => typeof query }).eq(
      "qualification_status",
      options.qualificationStatus
    );
  }

  const result = await (query as unknown as {
    order: (c: string, opts: { ascending: boolean }) => {
      limit: (n: number) => Promise<{ data: LeadIntake[] | null; error: Error | null }>;
    };
  })
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  return result.data ?? [];
}

// ─── Fetch lead intakes summary for a user ───────────────────

export interface LeadPipelineSummary {
  total: number;
  pending_review: number;
  needs_enrichment: number;
  ready_for_opportunity: number;
  ready_for_action: number;
  blocked: number;
  duplicate: number;
}

export async function fetchLeadPipelineSummary(userId: string): Promise<LeadPipelineSummary> {
  const { data, error } = await (supabase as never as {
    from: (t: string) => {
      select: (f: string) => {
        eq: (c: string, v: string) => Promise<{ data: { qualification_status: string }[] | null; error: Error | null }>;
      };
    };
  })
    .from("lead_intakes")
    .select("qualification_status")
    .eq("user_id", userId);

  if (error || !data) {
    return { total: 0, pending_review: 0, needs_enrichment: 0, ready_for_opportunity: 0, ready_for_action: 0, blocked: 0, duplicate: 0 };
  }

  const counts: LeadPipelineSummary = {
    total: data.length,
    pending_review: 0,
    needs_enrichment: 0,
    ready_for_opportunity: 0,
    ready_for_action: 0,
    blocked: 0,
    duplicate: 0,
  };

  for (const row of data) {
    const s = row.qualification_status as QualificationStatus;
    if (s in counts) counts[s]++;
  }

  return counts;
}
