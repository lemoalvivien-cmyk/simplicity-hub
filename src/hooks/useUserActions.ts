import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserActionType = "appeler" | "envoyer" | "relancer" | "valider" | "verifier" | "analyser";
export type UserActionPriority = "urgente" | "haute" | "normale" | "basse";
export type UserActionStatus = "a_faire" | "en_cours" | "terminee" | "annulee";
export type UserActionSource = "manual" | "openclaw" | "ai_recommendation";

export interface UserAction {
  id: string;
  user_id: string;
  type: UserActionType;
  title: string;
  description: string | null;
  priority: UserActionPriority;
  status: UserActionStatus;
  due_date: string | null;
  source: UserActionSource;
  source_ref_id: string | null;
  contact_id: string | null;
  mission_id: string | null;
  created_at: string;
  completed_at: string | null;
  // joined
  contact_name?: string | null;
}

export interface CreateUserActionInput {
  type: UserActionType;
  title: string;
  description?: string;
  priority?: UserActionPriority;
  due_date?: string;
  contact_id?: string;
  mission_id?: string;
  source?: UserActionSource;
  source_ref_id?: string;
}

const QUERY_KEY = "user_actions";

export function useUserActions(statusFilter: UserActionStatus[] = ["a_faire", "en_cours"]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY, user?.id, statusFilter.join(",")],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_actions" as never)
        .select(`
          *,
          contacts!user_actions_contact_id_fkey (prenom_nom)
        `)
        .eq("user_id", user!.id)
        .in("status", statusFilter)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const contact = row.contacts as { prenom_nom: string } | null;
        return {
          ...row,
          contact_name: contact?.prenom_nom ?? null,
        } as UserAction;
      });
    },
  });
}

export function useMarkActionDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_actions" as never)
        .update({ status: "terminee", completed_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useCreateUserAction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserActionInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_actions" as never)
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "normale",
          due_date: input.due_date ?? null,
          contact_id: input.contact_id ?? null,
          mission_id: input.mission_id ?? null,
          source: input.source ?? "manual",
          source_ref_id: input.source_ref_id ?? null,
          status: "a_faire",
        } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
