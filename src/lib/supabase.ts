// Helper to call supabase with untyped tables (until DB migration runs and types are regenerated)
// Use this for any table that isn't yet in the auto-generated types.ts
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
