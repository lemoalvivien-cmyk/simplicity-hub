/**
 * Service layer — contacts
 * Centralises all Supabase queries for contacts.
 * UI must import from here, never call supabase directly in components.
 */
import { supabase } from "@/integrations/supabase/client";

export interface ContactsFilters {
  search?: string;
  statut?: string;
  page?: number;
  pageSize?: number;
}

export interface Contact {
  id: string;
  owner_user_id: string;
  prenom_nom: string;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  secteur: string | null;
  zone: string | null;
  statut: string | null;
  langue: string | null;
  origine: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactsPage {
  data: Contact[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchContacts(
  userId: string,
  filters: ContactsFilters = {}
): Promise<ContactsPage> {
  const { page = 1, pageSize = 20, statut, search } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statut) query = query.eq("statut", statut);
  if (search) query = query.ilike("prenom_nom", `%${search}%`);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data ?? []) as Contact[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
