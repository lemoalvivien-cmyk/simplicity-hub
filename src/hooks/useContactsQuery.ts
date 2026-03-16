/**
 * TanStack Query v5 hooks — contacts
 * Server-side pagination + search + error handling.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchContacts, type ContactsFilters } from "@/services/contactsService";
import { supabase } from "@/integrations/supabase/client";

export const contactKeys = {
  all: ["contacts"] as const,
  list: (userId: string, filters: ContactsFilters) =>
    ["contacts", "list", userId, filters] as const,
};

export function useContacts(filters: ContactsFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: contactKeys.list(user?.id ?? "", filters),
    queryFn: () => fetchContacts(user!.id, filters),
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCreateContact() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      prenom_nom: string;
      email?: string;
      telephone?: string;
      entreprise?: string;
      secteur?: string;
    }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...payload, owner_user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}
