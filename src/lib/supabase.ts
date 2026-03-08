/**
 * supabase.ts
 * ───────────
 * Re-exports the typed Supabase client for tables not yet fully typed
 * in the auto-generated types.ts.
 *
 * SECURITY: No unsafe `as any` cast.
 * Use `db` for untyped/new tables until the next type regeneration.
 * The underlying client is still fully typed via the Database generic.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Typed alias — safe fallback for tables not yet in the generated schema.
// Use `supabase` directly when the table IS in types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: SupabaseClient<Database, "public", any> = supabase;
