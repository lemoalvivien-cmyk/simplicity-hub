/**
 * supabase.ts
 * ───────────
 * Typed Supabase client alias.
 *
 * `db` is typed as SupabaseClient<Database> — the same runtime object as
 * `supabase` from the generated client. Use it when you need to query tables
 * that are not yet in the auto-generated schema (cast individual queries with
 * `as unknown as T` rather than casting the whole client to `any`).
 *
 * SECURITY: No `as any` cast on the client itself.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Typed alias for the Supabase client. Prefer `supabase` when the table is
 *  already in types.ts; use `db` only for tables not yet in the generated schema. */
export const db: SupabaseClient<Database> = supabase as SupabaseClient<Database>;
