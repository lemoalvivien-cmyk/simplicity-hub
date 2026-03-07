export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          campagne_id: string | null
          canal: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          introduction_id: string | null
          mission_id: string | null
          owner_user_id: string
          priorite: string | null
          statut: string | null
          titre: string
          type_action: string
          updated_at: string
        }
        Insert: {
          campagne_id?: string | null
          canal?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          introduction_id?: string | null
          mission_id?: string | null
          owner_user_id: string
          priorite?: string | null
          statut?: string | null
          titre: string
          type_action: string
          updated_at?: string
        }
        Update: {
          campagne_id?: string | null
          canal?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          introduction_id?: string | null
          mission_id?: string | null
          owner_user_id?: string
          priorite?: string | null
          statut?: string | null
          titre?: string
          type_action?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_introduction_id_fkey"
            columns: ["introduction_id"]
            isOneToOne: false
            referencedRelation: "introductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
          stripe_event_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campagnes: {
        Row: {
          canal_principal: string | null
          created_at: string
          id: string
          liste_id: string | null
          mode_action: string | null
          nom: string
          objectif: string | null
          owner_user_id: string
          statut: string | null
          updated_at: string
        }
        Insert: {
          canal_principal?: string | null
          created_at?: string
          id?: string
          liste_id?: string | null
          mode_action?: string | null
          nom: string
          objectif?: string | null
          owner_user_id: string
          statut?: string | null
          updated_at?: string
        }
        Update: {
          canal_principal?: string | null
          created_at?: string
          id?: string
          liste_id?: string | null
          mode_action?: string | null
          nom?: string
          objectif?: string | null
          owner_user_id?: string
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campagnes_liste_id_fkey"
            columns: ["liste_id"]
            isOneToOne: false
            referencedRelation: "listes"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          entreprise: string | null
          id: string
          origine: string | null
          owner_user_id: string
          prenom_nom: string
          statut: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          origine?: string | null
          owner_user_id: string
          prenom_nom: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          origine?: string | null
          owner_user_id?: string
          prenom_nom?: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entreprise_profiles: {
        Row: {
          abonnement_statut: string | null
          cible_client: string | null
          created_at: string
          description: string | null
          id: string
          nom_entreprise: string | null
          offre: string | null
          secteur: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          abonnement_statut?: string | null
          cible_client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom_entreprise?: string | null
          offre?: string | null
          secteur?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          abonnement_statut?: string | null
          cible_client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom_entreprise?: string | null
          offre?: string | null
          secteur?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      facilitateur_profiles: {
        Row: {
          created_at: string
          description_reseau: string | null
          id: string
          secteur: string | null
          statut: string | null
          types_contacts: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          description_reseau?: string | null
          id?: string
          secteur?: string | null
          statut?: string | null
          types_contacts?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          description_reseau?: string | null
          id?: string
          secteur?: string | null
          statut?: string | null
          types_contacts?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      gains: {
        Row: {
          created_at: string
          facilitateur_id: string
          id: string
          introduction_id: string | null
          mission_id: string | null
          montant: number | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facilitateur_id: string
          id?: string
          introduction_id?: string | null
          mission_id?: string | null
          montant?: number | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facilitateur_id?: string
          id?: string
          introduction_id?: string | null
          mission_id?: string | null
          montant?: number | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gains_introduction_id_fkey"
            columns: ["introduction_id"]
            isOneToOne: false
            referencedRelation: "introductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gains_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      introductions: {
        Row: {
          contact_email: string | null
          contact_nom: string
          contact_telephone: string | null
          contexte: string | null
          created_at: string
          entreprise_id: string | null
          facilitateur_id: string
          id: string
          mission_id: string | null
          pertinence: string | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_nom: string
          contact_telephone?: string | null
          contexte?: string | null
          created_at?: string
          entreprise_id?: string | null
          facilitateur_id: string
          id?: string
          mission_id?: string | null
          pertinence?: string | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_nom?: string
          contact_telephone?: string | null
          contexte?: string | null
          created_at?: string
          entreprise_id?: string | null
          facilitateur_id?: string
          id?: string
          mission_id?: string | null
          pertinence?: string | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "introductions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_quota: {
        Row: {
          id: string
          total_slots: number
          updated_at: string
          used_slots: number
        }
        Insert: {
          id?: string
          total_slots?: number
          updated_at?: string
          used_slots?: number
        }
        Update: {
          id?: string
          total_slots?: number
          updated_at?: string
          used_slots?: number
        }
        Relationships: []
      }
      liste_contacts: {
        Row: {
          contact_id: string
          liste_id: string
        }
        Insert: {
          contact_id: string
          liste_id: string
        }
        Update: {
          contact_id?: string
          liste_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liste_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liste_contacts_liste_id_fkey"
            columns: ["liste_id"]
            isOneToOne: false
            referencedRelation: "listes"
            referencedColumns: ["id"]
          },
        ]
      }
      listes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          entreprise_id: string
          id: string
          recompense: string | null
          secteur: string | null
          statut: string | null
          titre: string
          type_client_recherche: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entreprise_id: string
          id?: string
          recompense?: string | null
          secteur?: string | null
          statut?: string | null
          titre: string
          type_client_recherche?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          recompense?: string | null
          secteur?: string | null
          statut?: string | null
          titre?: string
          type_client_recherche?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          onboarding_done: boolean
          prenom: string | null
          role: string | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          onboarding_done?: boolean
          prenom?: string | null
          role?: string | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          onboarding_done?: boolean
          prenom?: string | null
          role?: string | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          created_at: string
          end_at: string
          id: string
          promo_code_id: string
          redeemed_at: string
          start_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          promo_code_id: string
          redeemed_at?: string
          start_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          start_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          disabled_at: string | null
          duration_months: number
          expires_at: string | null
          id: string
          status: string
          usage_unique: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          status?: string
          usage_unique?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          duration_months?: number
          expires_at?: string | null
          id?: string
          status?: string
          usage_unique?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          offer_type: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          offer_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          offer_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
