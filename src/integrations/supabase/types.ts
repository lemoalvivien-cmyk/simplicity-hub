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
      anti_circumvention_flags: {
        Row: {
          created_at: string
          description: string
          flag_type: string
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          flag_type: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          flag_type?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      companies: {
        Row: {
          created_at: string
          description: string | null
          domain: string | null
          id: string
          industry: string | null
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_aliases: {
        Row: {
          alias_domain: string | null
          alias_name: string
          canonical_company_id: string
          confidence: number
          created_at: string
          id: string
          source: string
        }
        Insert: {
          alias_domain?: string | null
          alias_name: string
          canonical_company_id: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
        }
        Update: {
          alias_domain?: string | null
          alias_name?: string
          canonical_company_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_aliases_canonical_company_id_fkey"
            columns: ["canonical_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          langue: string | null
          origine: string | null
          owner_user_id: string
          prenom_nom: string
          secteur: string | null
          statut: string | null
          telephone: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          langue?: string | null
          origine?: string | null
          owner_user_id: string
          prenom_nom: string
          secteur?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          langue?: string | null
          origine?: string | null
          owner_user_id?: string
          prenom_nom?: string
          secteur?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_note: string | null
          created_at: string
          description: string
          dispute_type: string
          id: string
          impact_applied: boolean
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          reported_user_id: string | null
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          description: string
          dispute_type: string
          id?: string
          impact_applied?: boolean
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          reported_user_id?: string | null
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          description?: string
          dispute_type?: string
          id?: string
          impact_applied?: boolean
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          reported_user_id?: string | null
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      entreprise_profiles: {
        Row: {
          abonnement_statut: string | null
          business_corridors: string[] | null
          cible_client: string | null
          created_at: string
          description: string | null
          id: string
          languages: string[] | null
          nom_entreprise: string | null
          offre: string | null
          preferred_language: string | null
          secteur: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          abonnement_statut?: string | null
          business_corridors?: string[] | null
          cible_client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          languages?: string[] | null
          nom_entreprise?: string | null
          offre?: string | null
          preferred_language?: string | null
          secteur?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          abonnement_statut?: string | null
          business_corridors?: string[] | null
          cible_client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          languages?: string[] | null
          nom_entreprise?: string | null
          offre?: string | null
          preferred_language?: string | null
          secteur?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      facilitateur_profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          business_corridors: string[] | null
          created_at: string
          description_reseau: string | null
          id: string
          languages: string[] | null
          preferred_language: string | null
          response_rate: number | null
          secteur: string | null
          statut: string | null
          total_reviews: number | null
          types_contacts: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          business_corridors?: string[] | null
          created_at?: string
          description_reseau?: string | null
          id?: string
          languages?: string[] | null
          preferred_language?: string | null
          response_rate?: number | null
          secteur?: string | null
          statut?: string | null
          total_reviews?: number | null
          types_contacts?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          business_corridors?: string[] | null
          created_at?: string
          description_reseau?: string | null
          id?: string
          languages?: string[] | null
          preferred_language?: string | null
          response_rate?: number | null
          secteur?: string | null
          statut?: string | null
          total_reviews?: number | null
          types_contacts?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      facilitator_favorites: {
        Row: {
          company_user_id: string
          created_at: string
          facilitator_user_id: string
          id: string
        }
        Insert: {
          company_user_id: string
          created_at?: string
          facilitator_user_id: string
          id?: string
        }
        Update: {
          company_user_id?: string
          created_at?: string
          facilitator_user_id?: string
          id?: string
        }
        Relationships: []
      }
      facilitator_match_scores: {
        Row: {
          avg_response_days: number | null
          best_corridor: string | null
          best_language: string | null
          best_sector: string | null
          best_zone: string | null
          computed_at: string | null
          conversion_score: number | null
          corridor_score: number | null
          created_at: string | null
          explanation: string[] | null
          facilitator_user_id: string
          global_score: number | null
          id: string
          intros_validees: number | null
          language_score: number | null
          mission_types: string[] | null
          recency_score: number | null
          response_score: number | null
          revenue_generated: number | null
          revenue_score: number | null
          sector_score: number | null
          total_gains: number | null
          total_intros: number | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
          zone_score: number | null
        }
        Insert: {
          avg_response_days?: number | null
          best_corridor?: string | null
          best_language?: string | null
          best_sector?: string | null
          best_zone?: string | null
          computed_at?: string | null
          conversion_score?: number | null
          corridor_score?: number | null
          created_at?: string | null
          explanation?: string[] | null
          facilitator_user_id: string
          global_score?: number | null
          id?: string
          intros_validees?: number | null
          language_score?: number | null
          mission_types?: string[] | null
          recency_score?: number | null
          response_score?: number | null
          revenue_generated?: number | null
          revenue_score?: number | null
          sector_score?: number | null
          total_gains?: number | null
          total_intros?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
          zone_score?: number | null
        }
        Update: {
          avg_response_days?: number | null
          best_corridor?: string | null
          best_language?: string | null
          best_sector?: string | null
          best_zone?: string | null
          computed_at?: string | null
          conversion_score?: number | null
          corridor_score?: number | null
          created_at?: string | null
          explanation?: string[] | null
          facilitator_user_id?: string
          global_score?: number | null
          id?: string
          intros_validees?: number | null
          language_score?: number | null
          mission_types?: string[] | null
          recency_score?: number | null
          response_score?: number | null
          revenue_generated?: number | null
          revenue_score?: number | null
          sector_score?: number | null
          total_gains?: number | null
          total_intros?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
          zone_score?: number | null
        }
        Relationships: []
      }
      facilitator_requests: {
        Row: {
          company_user_id: string
          created_at: string
          facilitator_user_id: string
          id: string
          mission_id: string | null
          openclaw_note: string | null
          opportunity_id: string | null
          request_context: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_user_id: string
          created_at?: string
          facilitator_user_id: string
          id?: string
          mission_id?: string | null
          openclaw_note?: string | null
          opportunity_id?: string | null
          request_context?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_user_id?: string
          created_at?: string
          facilitator_user_id?: string
          id?: string
          mission_id?: string | null
          openclaw_note?: string | null
          opportunity_id?: string | null
          request_context?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilitator_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilitator_requests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      facilitator_reviews: {
        Row: {
          comment: string | null
          created_at: string
          facilitator_user_id: string
          id: string
          introduction_id: string | null
          rating: number
          recommended: boolean | null
          request_id: string | null
          reviewer_user_id: string
          tags: Json | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          facilitator_user_id: string
          id?: string
          introduction_id?: string | null
          rating: number
          recommended?: boolean | null
          request_id?: string | null
          reviewer_user_id: string
          tags?: Json | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          facilitator_user_id?: string
          id?: string
          introduction_id?: string | null
          rating?: number
          recommended?: boolean | null
          request_id?: string | null
          reviewer_user_id?: string
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "facilitator_reviews_introduction_id_fkey"
            columns: ["introduction_id"]
            isOneToOne: false
            referencedRelation: "introductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilitator_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "facilitator_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gains: {
        Row: {
          created_at: string
          facilitateur_id: string
          id: string
          introduction_id: string | null
          mission_id: string | null
          montant: number | null
          share_link_id: string | null
          shared_offer_id: string | null
          source: string | null
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
          share_link_id?: string | null
          shared_offer_id?: string | null
          source?: string | null
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
          share_link_id?: string | null
          shared_offer_id?: string | null
          source?: string | null
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
          {
            foreignKeyName: "gains_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "offer_share_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gains_shared_offer_id_fkey"
            columns: ["shared_offer_id"]
            isOneToOne: false
            referencedRelation: "shared_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_best_paths: {
        Row: {
          alternative_paths: Json | null
          best_facilitator_id: string | null
          best_facilitator_name: string | null
          computed_at: string | null
          corridor: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          language: string | null
          next_action: string | null
          path_confidence: number | null
          path_explanation: string[] | null
          risk_note: string | null
          target_id: string
          target_label: string | null
          target_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternative_paths?: Json | null
          best_facilitator_id?: string | null
          best_facilitator_name?: string | null
          computed_at?: string | null
          corridor?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language?: string | null
          next_action?: string | null
          path_confidence?: number | null
          path_explanation?: string[] | null
          risk_note?: string | null
          target_id: string
          target_label?: string | null
          target_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternative_paths?: Json | null
          best_facilitator_id?: string | null
          best_facilitator_name?: string | null
          computed_at?: string | null
          corridor?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language?: string | null
          next_action?: string | null
          path_confidence?: number | null
          path_explanation?: string[] | null
          risk_note?: string | null
          target_id?: string
          target_label?: string | null
          target_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          activity_score: number | null
          confidence_score: number | null
          conversion_score: number | null
          corridor_score: number | null
          created_at: string
          dispute_penalty: number | null
          from_entity_id: string
          from_entity_type: string
          id: string
          language_fit_score: number | null
          last_interaction_at: string | null
          metadata: Json | null
          recency_score: number | null
          relationship_type: string
          response_score: number | null
          revenue_score: number | null
          source: string
          strength_score: number
          to_entity_id: string
          to_entity_type: string
          total_weight: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number | null
          confidence_score?: number | null
          conversion_score?: number | null
          corridor_score?: number | null
          created_at?: string
          dispute_penalty?: number | null
          from_entity_id: string
          from_entity_type: string
          id?: string
          language_fit_score?: number | null
          last_interaction_at?: string | null
          metadata?: Json | null
          recency_score?: number | null
          relationship_type: string
          response_score?: number | null
          revenue_score?: number | null
          source?: string
          strength_score?: number
          to_entity_id: string
          to_entity_type: string
          total_weight?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number | null
          confidence_score?: number | null
          conversion_score?: number | null
          corridor_score?: number | null
          created_at?: string
          dispute_penalty?: number | null
          from_entity_id?: string
          from_entity_type?: string
          id?: string
          language_fit_score?: number | null
          last_interaction_at?: string | null
          metadata?: Json | null
          recency_score?: number | null
          relationship_type?: string
          response_score?: number | null
          revenue_score?: number | null
          source?: string
          strength_score?: number
          to_entity_id?: string
          to_entity_type?: string
          total_weight?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      graph_events: {
        Row: {
          created_at: string | null
          delta_weight: number | null
          edge_id: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delta_weight?: number | null
          edge_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delta_weight?: number | null
          edge_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intro_escrow: {
        Row: {
          company_id: string | null
          converted: boolean
          created_at: string
          facilitator_id: string
          gain_id: string | null
          id: string
          introduction_id: string
          proof_accumulated: boolean
          protected: boolean
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          converted?: boolean
          created_at?: string
          facilitator_id: string
          gain_id?: string | null
          id?: string
          introduction_id: string
          proof_accumulated?: boolean
          protected?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          converted?: boolean
          created_at?: string
          facilitator_id?: string
          gain_id?: string | null
          id?: string
          introduction_id?: string
          proof_accumulated?: boolean
          protected?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      introduction_proofs: {
        Row: {
          company_id: string | null
          created_at: string
          facilitator_id: string
          finalized_at: string | null
          id: string
          introduction_id: string
          last_event_at: string
          linked_gain_id: string | null
          linked_review_id: string | null
          proof_context: string | null
          proof_status: string
          requested_by: string | null
          updated_at: string
          validation_status: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          facilitator_id: string
          finalized_at?: string | null
          id?: string
          introduction_id: string
          last_event_at?: string
          linked_gain_id?: string | null
          linked_review_id?: string | null
          proof_context?: string | null
          proof_status?: string
          requested_by?: string | null
          updated_at?: string
          validation_status?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          facilitator_id?: string
          finalized_at?: string | null
          id?: string
          introduction_id?: string
          last_event_at?: string
          linked_gain_id?: string | null
          linked_review_id?: string | null
          proof_context?: string | null
          proof_status?: string
          requested_by?: string | null
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "introduction_proofs_introduction_id_fkey"
            columns: ["introduction_id"]
            isOneToOne: false
            referencedRelation: "introductions"
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
      lead_action_events: {
        Row: {
          action_id: string
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          new_status: string
          note: string | null
          previous_status: string | null
        }
        Insert: {
          action_id: string
          actor_user_id: string
          created_at?: string
          event_type?: string
          id?: string
          new_status: string
          note?: string | null
          previous_status?: string | null
        }
        Update: {
          action_id?: string
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          new_status?: string
          note?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_action_events_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "lead_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_actions: {
        Row: {
          action_type: string
          actor_user_id: string
          completed_at: string | null
          created_at: string
          id: string
          lead_intake_id: string
          opportunity_id: string | null
          payload: Json | null
          priority: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          actor_user_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_intake_id: string
          opportunity_id?: string | null
          payload?: Json | null
          priority?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_intake_id?: string
          opportunity_id?: string | null
          payload?: Json | null
          priority?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_actions_lead_intake_id_fkey"
            columns: ["lead_intake_id"]
            isOneToOne: false
            referencedRelation: "lead_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_actions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_entity_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          lead_intake_id: string
          link_reason: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          lead_intake_id: string
          link_reason?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          lead_intake_id?: string
          link_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_entity_links_lead_intake_id_fkey"
            columns: ["lead_intake_id"]
            isOneToOne: false
            referencedRelation: "lead_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intakes: {
        Row: {
          action_status: string
          company_name: string | null
          created_at: string
          dedup_match_id: string | null
          dedup_status: string
          enrichment_status: string
          entreprise_id: string | null
          facilitator_id: string | null
          free_text_context: string | null
          id: string
          introduction_id: string | null
          linked_contact_id: string | null
          linked_opportunity_id: string | null
          linkedin_url: string | null
          mission_id: string | null
          nba_context: Json | null
          next_best_action: string | null
          person_email: string | null
          person_name: string | null
          phone: string | null
          policy_status: string
          qualification_status: string
          source_event_id: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_status?: string
          company_name?: string | null
          created_at?: string
          dedup_match_id?: string | null
          dedup_status?: string
          enrichment_status?: string
          entreprise_id?: string | null
          facilitator_id?: string | null
          free_text_context?: string | null
          id?: string
          introduction_id?: string | null
          linked_contact_id?: string | null
          linked_opportunity_id?: string | null
          linkedin_url?: string | null
          mission_id?: string | null
          nba_context?: Json | null
          next_best_action?: string | null
          person_email?: string | null
          person_name?: string | null
          phone?: string | null
          policy_status?: string
          qualification_status?: string
          source_event_id?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_status?: string
          company_name?: string | null
          created_at?: string
          dedup_match_id?: string | null
          dedup_status?: string
          enrichment_status?: string
          entreprise_id?: string | null
          facilitator_id?: string | null
          free_text_context?: string | null
          id?: string
          introduction_id?: string | null
          linked_contact_id?: string | null
          linked_opportunity_id?: string | null
          linkedin_url?: string | null
          mission_id?: string | null
          nba_context?: Json | null
          next_best_action?: string | null
          person_email?: string | null
          person_name?: string | null
          phone?: string | null
          policy_status?: string
          qualification_status?: string
          source_event_id?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_intakes_introduction_id_fkey"
            columns: ["introduction_id"]
            isOneToOne: false
            referencedRelation: "introductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intakes_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intakes_linked_opportunity_id_fkey"
            columns: ["linked_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intakes_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "lead_source_events"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_source_events: {
        Row: {
          created_at: string
          id: string
          intake_id: string | null
          processed: boolean
          raw_payload: Json | null
          source_ref_id: string | null
          source_ref_type: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intake_id?: string | null
          processed?: boolean
          raw_payload?: Json | null
          source_ref_id?: string | null
          source_ref_type?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intake_id?: string | null
          processed?: boolean
          raw_payload?: Json | null
          source_ref_id?: string | null
          source_ref_type?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lse_intake"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "lead_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      link_events: {
        Row: {
          channel: string | null
          created_at: string
          event_type: string
          facilitator_id: string
          id: string
          ip_country: string | null
          language: string | null
          metadata: Json | null
          share_link_id: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          event_type: string
          facilitator_id: string
          id?: string
          ip_country?: string | null
          language?: string | null
          metadata?: Json | null
          share_link_id?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          event_type?: string
          facilitator_id?: string
          id?: string
          ip_country?: string | null
          language?: string | null
          metadata?: Json | null
          share_link_id?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_events_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "offer_share_links"
            referencedColumns: ["id"]
          },
        ]
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
      offer_packs: {
        Row: {
          approved_at: string | null
          company_id: string
          created_at: string
          email_premium: string | null
          email_simple: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          language: string
          offer_id: string | null
          pitch_ultra_short: string | null
          post_short: string | null
          private_message: string | null
          shared_offer_id: string | null
          status: string
          updated_at: string
          whatsapp_natural: string | null
          whatsapp_short: string | null
        }
        Insert: {
          approved_at?: string | null
          company_id: string
          created_at?: string
          email_premium?: string | null
          email_simple?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          language?: string
          offer_id?: string | null
          pitch_ultra_short?: string | null
          post_short?: string | null
          private_message?: string | null
          shared_offer_id?: string | null
          status?: string
          updated_at?: string
          whatsapp_natural?: string | null
          whatsapp_short?: string | null
        }
        Update: {
          approved_at?: string | null
          company_id?: string
          created_at?: string
          email_premium?: string | null
          email_simple?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          language?: string
          offer_id?: string | null
          pitch_ultra_short?: string | null
          post_short?: string | null
          private_message?: string | null
          shared_offer_id?: string | null
          status?: string
          updated_at?: string
          whatsapp_natural?: string | null
          whatsapp_short?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_packs_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_packs_shared_offer_id_fkey"
            columns: ["shared_offer_id"]
            isOneToOne: false
            referencedRelation: "shared_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_share_links: {
        Row: {
          channel: string | null
          clicks_count: number
          company_id: string | null
          converted: boolean
          created_at: string
          destination_url: string | null
          facilitator_id: string
          gain_count: number
          id: string
          introduction_count: number
          language: string | null
          last_click_at: string | null
          linked_gain_id: string | null
          linked_opportunity_id: string | null
          mission_id: string | null
          offer_id: string | null
          opportunity_count: number
          pack_id: string | null
          qualified_interest_count: number
          tracking_code: string
          unique_clicks_count: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          clicks_count?: number
          company_id?: string | null
          converted?: boolean
          created_at?: string
          destination_url?: string | null
          facilitator_id: string
          gain_count?: number
          id?: string
          introduction_count?: number
          language?: string | null
          last_click_at?: string | null
          linked_gain_id?: string | null
          linked_opportunity_id?: string | null
          mission_id?: string | null
          offer_id?: string | null
          opportunity_count?: number
          pack_id?: string | null
          qualified_interest_count?: number
          tracking_code?: string
          unique_clicks_count?: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          clicks_count?: number
          company_id?: string | null
          converted?: boolean
          created_at?: string
          destination_url?: string | null
          facilitator_id?: string
          gain_count?: number
          id?: string
          introduction_count?: number
          language?: string | null
          last_click_at?: string | null
          linked_gain_id?: string | null
          linked_opportunity_id?: string | null
          mission_id?: string | null
          offer_id?: string | null
          opportunity_count?: number
          pack_id?: string | null
          qualified_interest_count?: number
          tracking_code?: string
          unique_clicks_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_share_links_linked_gain_id_fkey"
            columns: ["linked_gain_id"]
            isOneToOne: false
            referencedRelation: "gains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_share_links_linked_opportunity_id_fkey"
            columns: ["linked_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_share_links_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_share_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "shared_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_share_links_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "offer_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          company_id: string
          created_at: string
          full_description: string | null
          id: string
          mission_id: string | null
          primary_cta: string | null
          reward_model: string | null
          sector: string | null
          status: string
          summary: string | null
          target_geo: string | null
          target_languages: string[] | null
          target_profile: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          full_description?: string | null
          id?: string
          mission_id?: string | null
          primary_cta?: string | null
          reward_model?: string | null
          sector?: string | null
          status?: string
          summary?: string | null
          target_geo?: string | null
          target_languages?: string[] | null
          target_profile?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          full_description?: string | null
          id?: string
          mission_id?: string | null
          primary_cta?: string | null
          reward_model?: string | null
          sector?: string | null
          status?: string
          summary?: string | null
          target_geo?: string | null
          target_languages?: string[] | null
          target_profile?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_agents: {
        Row: {
          action_en_cours: string | null
          actions_aujourd_hui: number
          agent_id: string
          created_at: string
          derniere_activite_at: string | null
          id: string
          kill_switch: boolean
          nom: string
          outils_autorises: Json | null
          role: string
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_en_cours?: string | null
          actions_aujourd_hui?: number
          agent_id: string
          created_at?: string
          derniere_activite_at?: string | null
          id?: string
          kill_switch?: boolean
          nom: string
          outils_autorises?: Json | null
          role: string
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_en_cours?: string | null
          actions_aujourd_hui?: number
          agent_id?: string
          created_at?: string
          derniere_activite_at?: string | null
          id?: string
          kill_switch?: boolean
          nom?: string
          outils_autorises?: Json | null
          role?: string
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_briefs: {
        Row: {
          created_at: string
          id: string
          priority_items: Json | null
          stats: Json | null
          suggested_actions: Json | null
          summary: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority_items?: Json | null
          stats?: Json | null
          suggested_actions?: Json | null
          summary: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority_items?: Json | null
          stats?: Json | null
          suggested_actions?: Json | null
          summary?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_channel_actions: {
        Row: {
          action_type: string
          approval_required: boolean
          approved_at: string | null
          channel: string
          created_at: string
          error_detail: string | null
          executed_at: string | null
          execution_id: string | null
          id: string
          job_type: string
          payload: Json | null
          payload_summary: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_run_id: string | null
          status: string
          trigger_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          approval_required?: boolean
          approved_at?: string | null
          channel: string
          created_at?: string
          error_detail?: string | null
          executed_at?: string | null
          execution_id?: string | null
          id?: string
          job_type: string
          payload?: Json | null
          payload_summary?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_run_id?: string | null
          status?: string
          trigger_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          approval_required?: boolean
          approved_at?: string | null
          channel?: string
          created_at?: string
          error_detail?: string | null
          executed_at?: string | null
          execution_id?: string | null
          id?: string
          job_type?: string
          payload?: Json | null
          payload_summary?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_run_id?: string | null
          status?: string
          trigger_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_channel_capabilities: {
        Row: {
          availability: string
          can_auto_send: boolean
          can_export_human: boolean
          can_prepare: boolean
          can_receive_receipt: boolean
          can_send_validated: boolean
          can_track_reply: boolean
          channel: string
          channel_name: string
          emoji: string
          honest_note: string | null
          requires_external_api: boolean
          requires_gateway: boolean
          updated_at: string
        }
        Insert: {
          availability?: string
          can_auto_send?: boolean
          can_export_human?: boolean
          can_prepare?: boolean
          can_receive_receipt?: boolean
          can_send_validated?: boolean
          can_track_reply?: boolean
          channel: string
          channel_name: string
          emoji?: string
          honest_note?: string | null
          requires_external_api?: boolean
          requires_gateway?: boolean
          updated_at?: string
        }
        Update: {
          availability?: string
          can_auto_send?: boolean
          can_export_human?: boolean
          can_prepare?: boolean
          can_receive_receipt?: boolean
          can_send_validated?: boolean
          can_track_reply?: boolean
          channel?: string
          channel_name?: string
          emoji?: string
          honest_note?: string | null
          requires_external_api?: boolean
          requires_gateway?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      openclaw_channel_deliveries: {
        Row: {
          approval_given_at: string | null
          cancelled_at: string | null
          channel: string
          channel_action_id: string
          created_at: string
          delivered_at: string | null
          dispatch_mode: string | null
          dispatch_status: string
          dispatched_at: string | null
          dispatched_by: string | null
          engagement_detected: boolean | null
          error_code: string | null
          error_summary: string | null
          error_type: string | null
          expired_at: string | null
          external_thread_id: string | null
          failed_at: string | null
          id: string
          linked_gain_id: string | null
          linked_introduction_id: string | null
          linked_opportunity_id: string | null
          outcome_type: string | null
          provider_message_id: string | null
          provider_response: Json | null
          provider_status: string | null
          queued_at: string | null
          replied_at: string | null
          reply_sentiment: string | null
          reply_summary: string | null
          requires_approval: boolean | null
          source_job_id: string | null
          source_run_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_given_at?: string | null
          cancelled_at?: string | null
          channel: string
          channel_action_id: string
          created_at?: string
          delivered_at?: string | null
          dispatch_mode?: string | null
          dispatch_status?: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          engagement_detected?: boolean | null
          error_code?: string | null
          error_summary?: string | null
          error_type?: string | null
          expired_at?: string | null
          external_thread_id?: string | null
          failed_at?: string | null
          id?: string
          linked_gain_id?: string | null
          linked_introduction_id?: string | null
          linked_opportunity_id?: string | null
          outcome_type?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          queued_at?: string | null
          replied_at?: string | null
          reply_sentiment?: string | null
          reply_summary?: string | null
          requires_approval?: boolean | null
          source_job_id?: string | null
          source_run_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_given_at?: string | null
          cancelled_at?: string | null
          channel?: string
          channel_action_id?: string
          created_at?: string
          delivered_at?: string | null
          dispatch_mode?: string | null
          dispatch_status?: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          engagement_detected?: boolean | null
          error_code?: string | null
          error_summary?: string | null
          error_type?: string | null
          expired_at?: string | null
          external_thread_id?: string | null
          failed_at?: string | null
          id?: string
          linked_gain_id?: string | null
          linked_introduction_id?: string | null
          linked_opportunity_id?: string | null
          outcome_type?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          queued_at?: string | null
          replied_at?: string | null
          reply_sentiment?: string | null
          reply_summary?: string | null
          requires_approval?: boolean | null
          source_job_id?: string | null
          source_run_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_channel_deliveries_channel_action_id_fkey"
            columns: ["channel_action_id"]
            isOneToOne: false
            referencedRelation: "openclaw_channel_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_channels: {
        Row: {
          channel_id: string
          channel_name: string
          config: Json | null
          created_at: string
          id: string
          is_openclaw_enabled: boolean
          is_ready: boolean
          last_probe_at: string | null
          probe_detail: string | null
          probe_latency_ms: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          channel_name: string
          config?: Json | null
          created_at?: string
          id?: string
          is_openclaw_enabled?: boolean
          is_ready?: boolean
          last_probe_at?: string | null
          probe_detail?: string | null
          probe_latency_ms?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_openclaw_enabled?: boolean
          is_ready?: boolean
          last_probe_at?: string | null
          probe_detail?: string | null
          probe_latency_ms?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_config: {
        Row: {
          autonomie_level: string
          created_at: string
          gateway_secret: string | null
          gateway_url: string | null
          healthcheck_status: string | null
          id: string
          is_connected: boolean
          kill_switch_global: boolean
          last_healthcheck_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autonomie_level?: string
          created_at?: string
          gateway_secret?: string | null
          gateway_url?: string | null
          healthcheck_status?: string | null
          id?: string
          is_connected?: boolean
          kill_switch_global?: boolean
          last_healthcheck_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autonomie_level?: string
          created_at?: string
          gateway_secret?: string | null
          gateway_url?: string | null
          healthcheck_status?: string | null
          id?: string
          is_connected?: boolean
          kill_switch_global?: boolean
          last_healthcheck_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_dossier: {
        Row: {
          actions_sensibles: string | null
          activite: string | null
          angle_principal: string | null
          canaux_autorises: string[] | null
          canaux_interdits: string[] | null
          cas_usage: string | null
          cible_ideale: string | null
          clients_interdits: string | null
          completion_score: number | null
          created_at: string
          derniere_sync_openclaw_at: string | null
          exclusions_geo: string | null
          id: string
          mode_prospection: string | null
          niveau_formalite: string | null
          objectif_introductions: number | null
          objectif_opportunites: number | null
          objectif_rdv: number | null
          offre: string | null
          openclaw_session_id: string | null
          priorite_secteur: string | null
          secteurs_prioritaires: string | null
          style_commercial: string | null
          taille_cible: string | null
          ton_messages: string | null
          type_decideur: string | null
          type_entreprise: string | null
          updated_at: string
          user_id: string
          valeur_proposee: string | null
          validation_humaine_requise: boolean
          villes: string | null
          zone_geo: string | null
        }
        Insert: {
          actions_sensibles?: string | null
          activite?: string | null
          angle_principal?: string | null
          canaux_autorises?: string[] | null
          canaux_interdits?: string[] | null
          cas_usage?: string | null
          cible_ideale?: string | null
          clients_interdits?: string | null
          completion_score?: number | null
          created_at?: string
          derniere_sync_openclaw_at?: string | null
          exclusions_geo?: string | null
          id?: string
          mode_prospection?: string | null
          niveau_formalite?: string | null
          objectif_introductions?: number | null
          objectif_opportunites?: number | null
          objectif_rdv?: number | null
          offre?: string | null
          openclaw_session_id?: string | null
          priorite_secteur?: string | null
          secteurs_prioritaires?: string | null
          style_commercial?: string | null
          taille_cible?: string | null
          ton_messages?: string | null
          type_decideur?: string | null
          type_entreprise?: string | null
          updated_at?: string
          user_id: string
          valeur_proposee?: string | null
          validation_humaine_requise?: boolean
          villes?: string | null
          zone_geo?: string | null
        }
        Update: {
          actions_sensibles?: string | null
          activite?: string | null
          angle_principal?: string | null
          canaux_autorises?: string[] | null
          canaux_interdits?: string[] | null
          cas_usage?: string | null
          cible_ideale?: string | null
          clients_interdits?: string | null
          completion_score?: number | null
          created_at?: string
          derniere_sync_openclaw_at?: string | null
          exclusions_geo?: string | null
          id?: string
          mode_prospection?: string | null
          niveau_formalite?: string | null
          objectif_introductions?: number | null
          objectif_opportunites?: number | null
          objectif_rdv?: number | null
          offre?: string | null
          openclaw_session_id?: string | null
          priorite_secteur?: string | null
          secteurs_prioritaires?: string | null
          style_commercial?: string | null
          taille_cible?: string | null
          ton_messages?: string | null
          type_decideur?: string | null
          type_entreprise?: string | null
          updated_at?: string
          user_id?: string
          valeur_proposee?: string | null
          validation_humaine_requise?: boolean
          villes?: string | null
          zone_geo?: string | null
        }
        Relationships: []
      }
      openclaw_job_executions: {
        Row: {
          actions_created: number
          alerts_created: number
          approved_at: string | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          id: string
          job_id: string | null
          job_type: string
          last_error: string | null
          opportunities_rescored: number
          output_count: number
          output_summary: string | null
          output_type: string | null
          recommendations_created: number
          requires_approval: boolean
          result_payload: Json | null
          retry_count: number
          run_id: string | null
          session_id: string | null
          started_at: string | null
          status: string
          trigger_source: string
          trust_updates: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actions_created?: number
          alerts_created?: number
          approved_at?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          job_id?: string | null
          job_type: string
          last_error?: string | null
          opportunities_rescored?: number
          output_count?: number
          output_summary?: string | null
          output_type?: string | null
          recommendations_created?: number
          requires_approval?: boolean
          result_payload?: Json | null
          retry_count?: number
          run_id?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          trigger_source?: string
          trust_updates?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actions_created?: number
          alerts_created?: number
          approved_at?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          job_id?: string | null
          job_type?: string
          last_error?: string | null
          opportunities_rescored?: number
          output_count?: number
          output_summary?: string | null
          output_type?: string | null
          recommendations_created?: number
          requires_approval?: boolean
          result_payload?: Json | null
          retry_count?: number
          run_id?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          trigger_source?: string
          trust_updates?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_job_executions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "openclaw_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openclaw_job_executions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "openclaw_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openclaw_job_executions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "openclaw_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_job_queue: {
        Row: {
          approved_at: string | null
          created_at: string
          ended_at: string | null
          error_summary: string | null
          execution_id: string | null
          id: string
          job_type: string
          lock_owner: string | null
          locked_at: string | null
          max_retries: number
          next_retry_at: string | null
          output_count: number
          output_summary: string | null
          priority: string
          requires_approval: boolean
          retry_count: number
          run_id: string | null
          scheduled_at: string
          session_id: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_event: string | null
          started_at: string | null
          status: string
          trigger_source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          ended_at?: string | null
          error_summary?: string | null
          execution_id?: string | null
          id?: string
          job_type: string
          lock_owner?: string | null
          locked_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          output_count?: number
          output_summary?: string | null
          priority?: string
          requires_approval?: boolean
          retry_count?: number
          run_id?: string | null
          scheduled_at?: string
          session_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_event?: string | null
          started_at?: string | null
          status?: string
          trigger_source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          ended_at?: string | null
          error_summary?: string | null
          execution_id?: string | null
          id?: string
          job_type?: string
          lock_owner?: string | null
          locked_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          output_count?: number
          output_summary?: string | null
          priority?: string
          requires_approval?: boolean
          retry_count?: number
          run_id?: string | null
          scheduled_at?: string
          session_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_event?: string | null
          started_at?: string | null
          status?: string
          trigger_source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_jobs: {
        Row: {
          config: Json | null
          created_at: string
          cron_expression: string | null
          enabled: boolean
          error_count: number
          id: string
          job_name: string
          job_type: string
          last_error: string | null
          last_run_at: string | null
          last_run_id: string | null
          next_run_at: string | null
          run_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          cron_expression?: string | null
          enabled?: boolean
          error_count?: number
          id?: string
          job_name: string
          job_type: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_id?: string | null
          next_run_at?: string | null
          run_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          cron_expression?: string | null
          enabled?: boolean
          error_count?: number
          id?: string
          job_name?: string
          job_type?: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_id?: string | null
          next_run_at?: string | null
          run_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_jobs_last_run_id_fkey"
            columns: ["last_run_id"]
            isOneToOne: false
            referencedRelation: "openclaw_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_logs: {
        Row: {
          agent_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          gateway_request_id: string | null
          id: string
          risque: string | null
          summary: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          gateway_request_id?: string | null
          id?: string
          risque?: string | null
          summary: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          gateway_request_id?: string | null
          id?: string
          risque?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_memory: {
        Row: {
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          key: string
          last_used_at: string | null
          memory_type: string
          source: string | null
          times_used: number
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          last_used_at?: string | null
          memory_type: string
          source?: string | null
          times_used?: number
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          last_used_at?: string | null
          memory_type?: string
          source?: string | null
          times_used?: number
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      openclaw_recommendations: {
        Row: {
          agent_name: string
          created_at: string
          execution_id: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          payload: Json | null
          priority: string
          recommended_action: string | null
          status: string
          summary: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name?: string
          created_at?: string
          execution_id?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          payload?: Json | null
          priority?: string
          recommended_action?: string | null
          status?: string
          summary: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          execution_id?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          payload?: Json | null
          priority?: string
          recommended_action?: string | null
          status?: string
          summary?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_recommendations_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "openclaw_job_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_runs: {
        Row: {
          agent_names: string[] | null
          channel_id: string | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          error_detail: string | null
          execution_id: string | null
          id: string
          next_run_at: string | null
          node_host: string | null
          outcome: Json | null
          requires_validation: boolean
          run_type: string
          session_id: string | null
          started_at: string | null
          status: string
          summary: string | null
          tool_policy: Json | null
          trigger_source: string
          updated_at: string
          user_id: string
          validation_id: string | null
        }
        Insert: {
          agent_names?: string[] | null
          channel_id?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_detail?: string | null
          execution_id?: string | null
          id?: string
          next_run_at?: string | null
          node_host?: string | null
          outcome?: Json | null
          requires_validation?: boolean
          run_type?: string
          session_id?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          tool_policy?: Json | null
          trigger_source?: string
          updated_at?: string
          user_id: string
          validation_id?: string | null
        }
        Update: {
          agent_names?: string[] | null
          channel_id?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_detail?: string | null
          execution_id?: string | null
          id?: string
          next_run_at?: string | null
          node_host?: string | null
          outcome?: Json | null
          requires_validation?: boolean
          run_type?: string
          session_id?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          tool_policy?: Json | null
          trigger_source?: string
          updated_at?: string
          user_id?: string
          validation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_runs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "openclaw_job_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openclaw_runs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "openclaw_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_scheduled_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          error_detail: string | null
          id: string
          jobs_claimed: number
          jobs_completed: number
          jobs_enqueued: number
          jobs_failed: number
          next_run_at: string | null
          run_key: string
          started_at: string
          status: string
          trigger_source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_detail?: string | null
          id?: string
          jobs_claimed?: number
          jobs_completed?: number
          jobs_enqueued?: number
          jobs_failed?: number
          next_run_at?: string | null
          run_key: string
          started_at?: string
          status?: string
          trigger_source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_detail?: string | null
          id?: string
          jobs_claimed?: number
          jobs_completed?: number
          jobs_enqueued?: number
          jobs_failed?: number
          next_run_at?: string | null
          run_key?: string
          started_at?: string
          status?: string
          trigger_source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      openclaw_scheduler_heartbeats: {
        Row: {
          beat_at: string
          engine_status: string
          id: string
          jobs_claimed: number
          jobs_completed: number
          jobs_due: number
          jobs_failed: number
          note: string | null
          user_id: string | null
        }
        Insert: {
          beat_at?: string
          engine_status?: string
          id?: string
          jobs_claimed?: number
          jobs_completed?: number
          jobs_due?: number
          jobs_failed?: number
          note?: string | null
          user_id?: string | null
        }
        Update: {
          beat_at?: string
          engine_status?: string
          id?: string
          jobs_claimed?: number
          jobs_completed?: number
          jobs_due?: number
          jobs_failed?: number
          note?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      openclaw_sessions: {
        Row: {
          autonomie_level: string
          channel_ids: string[] | null
          context: Json | null
          context_type: string | null
          created_at: string
          ended_at: string | null
          id: string
          last_run_at: string | null
          last_run_id: string | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          memory_snapshot: Json | null
          next_scheduled_at: string | null
          node_host: string | null
          runs_count: number
          session_score: number | null
          session_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          autonomie_level?: string
          channel_ids?: string[] | null
          context?: Json | null
          context_type?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_run_at?: string | null
          last_run_id?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          memory_snapshot?: Json | null
          next_scheduled_at?: string | null
          node_host?: string | null
          runs_count?: number
          session_score?: number | null
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          autonomie_level?: string
          channel_ids?: string[] | null
          context?: Json | null
          context_type?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_run_at?: string | null
          last_run_id?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          memory_snapshot?: Json | null
          next_scheduled_at?: string | null
          node_host?: string | null
          runs_count?: number
          session_score?: number | null
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_tool_policies: {
        Row: {
          access_level: string
          agent_id: string
          autonomie_level: string | null
          channel_id: string | null
          context_type: string | null
          created_at: string
          id: string
          override_reason: string | null
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          agent_id: string
          autonomie_level?: string | null
          channel_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          override_reason?: string | null
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          agent_id?: string
          autonomie_level?: string | null
          channel_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          override_reason?: string | null
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_validations: {
        Row: {
          agent_id: string
          channel_id: string | null
          consequence_refuse: string
          consequence_valide: string
          created_at: string
          description: string
          details: string[] | null
          expires_at: string | null
          gateway_callback_url: string | null
          id: string
          last_relance_at: string | null
          node_host: string | null
          outcome_injected: boolean | null
          payload: Json | null
          relance_count: number | null
          risque: string
          run_id: string | null
          session_id: string | null
          statut: string
          titre: string
          type_validation: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          agent_id: string
          channel_id?: string | null
          consequence_refuse: string
          consequence_valide: string
          created_at?: string
          description: string
          details?: string[] | null
          expires_at?: string | null
          gateway_callback_url?: string | null
          id?: string
          last_relance_at?: string | null
          node_host?: string | null
          outcome_injected?: boolean | null
          payload?: Json | null
          relance_count?: number | null
          risque?: string
          run_id?: string | null
          session_id?: string | null
          statut?: string
          titre: string
          type_validation: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          agent_id?: string
          channel_id?: string | null
          consequence_refuse?: string
          consequence_valide?: string
          created_at?: string
          description?: string
          details?: string[] | null
          expires_at?: string | null
          gateway_callback_url?: string | null
          id?: string
          last_relance_at?: string | null
          node_host?: string | null
          outcome_injected?: boolean | null
          payload?: Json | null
          relance_count?: number | null
          risque?: string
          run_id?: string | null
          session_id?: string | null
          statut?: string
          titre?: string
          type_validation?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          dossier_match_label: string | null
          dossier_match_reason: string | null
          facilitator_ref_id: string | null
          id: string
          intent_label: string
          intent_score: number
          lead_intake_id: string | null
          openclaw_recommendation_id: string | null
          origin: string
          recommended_next_action: string | null
          recommended_sector: string | null
          signal_id: string | null
          source_intro_id: string | null
          source_type_v2: string | null
          status: string
          suggested_facilitators: Json | null
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          dossier_match_label?: string | null
          dossier_match_reason?: string | null
          facilitator_ref_id?: string | null
          id?: string
          intent_label?: string
          intent_score?: number
          lead_intake_id?: string | null
          openclaw_recommendation_id?: string | null
          origin?: string
          recommended_next_action?: string | null
          recommended_sector?: string | null
          signal_id?: string | null
          source_intro_id?: string | null
          source_type_v2?: string | null
          status?: string
          suggested_facilitators?: Json | null
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          dossier_match_label?: string | null
          dossier_match_reason?: string | null
          facilitator_ref_id?: string | null
          id?: string
          intent_label?: string
          intent_score?: number
          lead_intake_id?: string | null
          openclaw_recommendation_id?: string | null
          origin?: string
          recommended_next_action?: string | null
          recommended_sector?: string | null
          signal_id?: string | null
          source_intro_id?: string | null
          source_type_v2?: string | null
          status?: string
          suggested_facilitators?: Json | null
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_matches: {
        Row: {
          created_at: string
          facilitator_id: string
          geo_fit_score: number
          id: string
          language_fit_score: number
          match_reason_summary: string | null
          match_score: number
          opportunity_id: string
          sector_fit_score: number
          status: string
          trust_fit_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facilitator_id: string
          geo_fit_score?: number
          id?: string
          language_fit_score?: number
          match_reason_summary?: string | null
          match_score?: number
          opportunity_id: string
          sector_fit_score?: number
          status?: string
          trust_fit_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facilitator_id?: string
          geo_fit_score?: number
          id?: string
          language_fit_score?: number
          match_reason_summary?: string | null
          match_score?: number
          opportunity_id?: string
          sector_fit_score?: number
          status?: string
          trust_fit_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      passive_alerts: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          priority: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          priority?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          priority?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          onboarding_done: boolean
          preferred_language: string | null
          prenom: string | null
          role: string | null
          statut: string | null
          ui_language: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          onboarding_done?: boolean
          preferred_language?: string | null
          prenom?: string | null
          role?: string | null
          statut?: string | null
          ui_language?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          onboarding_done?: boolean
          preferred_language?: string | null
          prenom?: string | null
          role?: string | null
          statut?: string | null
          ui_language?: string | null
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
      qualified_interests: {
        Row: {
          click_count: number
          created_at: string
          facilitator_id: string
          id: string
          metadata: Json | null
          offer_id: string | null
          opportunity_id: string | null
          share_link_id: string | null
          status: string
          updated_at: string
          visitor_fingerprint: string | null
        }
        Insert: {
          click_count?: number
          created_at?: string
          facilitator_id: string
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          opportunity_id?: string | null
          share_link_id?: string | null
          status?: string
          updated_at?: string
          visitor_fingerprint?: string | null
        }
        Update: {
          click_count?: number
          created_at?: string
          facilitator_id?: string
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          opportunity_id?: string | null
          share_link_id?: string | null
          status?: string
          updated_at?: string
          visitor_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualified_interests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "shared_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualified_interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualified_interests_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "offer_share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_offers: {
        Row: {
          company_user_id: string
          created_at: string
          email_text: string | null
          id: string
          mission_id: string | null
          pitch_vocal: string | null
          short_description: string | null
          social_text: string | null
          status: string
          title: string
          updated_at: string
          whatsapp_text: string | null
        }
        Insert: {
          company_user_id: string
          created_at?: string
          email_text?: string | null
          id?: string
          mission_id?: string | null
          pitch_vocal?: string | null
          short_description?: string | null
          social_text?: string | null
          status?: string
          title: string
          updated_at?: string
          whatsapp_text?: string | null
        }
        Update: {
          company_user_id?: string
          created_at?: string
          email_text?: string | null
          id?: string
          mission_id?: string | null
          pitch_vocal?: string | null
          short_description?: string | null
          social_text?: string | null
          status?: string
          title?: string
          updated_at?: string
          whatsapp_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_offers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          detected_at: string
          id: string
          normalized_summary: string | null
          raw_summary: string | null
          signal_strength: number
          signal_type: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          detected_at?: string
          id?: string
          normalized_summary?: string | null
          raw_summary?: string | null
          signal_strength?: number
          signal_type?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          detected_at?: string
          id?: string
          normalized_summary?: string | null
          raw_summary?: string | null
          signal_strength?: number
          signal_type?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      trust_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          impact_score: number
          source_entity_id: string | null
          source_entity_type: string | null
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          impact_score?: number
          source_entity_id?: string | null
          source_entity_type?: string | null
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          impact_score?: number
          source_entity_id?: string | null
          source_entity_type?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          badges: string[] | null
          compliance_score: number
          created_at: string
          gains_confirmes: number
          global_score: number
          id: string
          intros_validees: number
          last_updated_at: string
          quality_score: number
          reliability_score: number
          responsiveness_score: number
          role: string
          signalements_recus: number
          total_gains: number
          total_intros: number
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          compliance_score?: number
          created_at?: string
          gains_confirmes?: number
          global_score?: number
          id?: string
          intros_validees?: number
          last_updated_at?: string
          quality_score?: number
          reliability_score?: number
          responsiveness_score?: number
          role?: string
          signalements_recus?: number
          total_gains?: number
          total_intros?: number
          user_id: string
        }
        Update: {
          badges?: string[] | null
          compliance_score?: number
          created_at?: string
          gains_confirmes?: number
          global_score?: number
          id?: string
          intros_validees?: number
          last_updated_at?: string
          quality_score?: number
          reliability_score?: number
          responsiveness_score?: number
          role?: string
          signalements_recus?: number
          total_gains?: number
          total_intros?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      openclaw_cron_status: {
        Row: {
          avg_duration_ms: number | null
          last_cron_attempt_at: string | null
          last_cron_run_at: string | null
          next_run_at: string | null
          observed_status: string | null
          real_cron_runs: number | null
          run_key: string | null
          total_failed: number | null
          total_jobs_completed: number | null
          total_runs: number | null
          total_successful: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_lead_policy: { Args: { p_intake_id: string }; Returns: undefined }
      claim_next_job: {
        Args: {
          p_lock_owner?: string
          p_lock_timeout?: number
          p_user_id: string
        }
        Returns: {
          job_id: string
          job_type: string
          priority: string
          queue_row: Json
          retry_count: number
          source_event: string
          trigger_source: string
        }[]
      }
      complete_job_execution: {
        Args: {
          p_actions: number
          p_alerts: number
          p_error: string
          p_execution_id: string
          p_opportunities: number
          p_output_count: number
          p_output_summary: string
          p_recommendations: number
          p_result_payload: Json
          p_status: string
          p_trust_updates: number
        }
        Returns: undefined
      }
      complete_queue_job: {
        Args: {
          p_error_summary?: string
          p_execution_id?: string
          p_job_id: string
          p_output_count?: number
          p_output_summary?: string
          p_retry_backoff_mins?: number
          p_status: string
        }
        Returns: undefined
      }
      compute_facilitator_match: {
        Args: {
          p_facilitator_id: string
          p_target_corridor?: string
          p_target_language?: string
          p_target_sector?: string
          p_target_zone?: string
          p_user_id: string
        }
        Returns: Json
      }
      create_lead_from_import: {
        Args: {
          p_company_name: string
          p_contact_id?: string
          p_person_email: string
          p_person_name: string
          p_phone?: string
          p_user_id: string
        }
        Returns: string
      }
      enqueue_job: {
        Args: {
          p_dedup_minutes?: number
          p_job_type: string
          p_max_retries?: number
          p_priority?: string
          p_requires_approval?: boolean
          p_scheduled_at?: string
          p_source_entity_id?: string
          p_source_entity_type?: string
          p_source_event?: string
          p_trigger_source?: string
          p_user_id: string
        }
        Returns: string
      }
      find_best_access_path: {
        Args: {
          p_limit?: number
          p_target_corridor?: string
          p_target_language?: string
          p_target_sector?: string
          p_target_zone?: string
          p_user_id: string
        }
        Returns: {
          conversion_score: number
          corridor_score: number
          explanation: string[]
          facilitator_id: string
          global_score: number
          intros_validees: number
          language_score: number
          response_score: number
          revenue: number
          sector_score: number
          total_intros: number
          trust_score: number
          zone_score: number
        }[]
      }
      promote_lead_to_opportunity: {
        Args: { p_intake_id: string }
        Returns: string
      }
      recompute_edge_weight: { Args: { p_edge_id: string }; Returns: undefined }
      refresh_trust_score: {
        Args: { p_facilitator_id: string }
        Returns: undefined
      }
      seed_openclaw_channels: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      seed_openclaw_jobs: { Args: { p_user_id: string }; Returns: undefined }
      update_lead_action_status:
        | {
            Args: {
              p_action_id: string
              p_actor_id: string
              p_new_status: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_action_id: string
              p_actor_id: string
              p_new_status: string
              p_note?: string
            }
            Returns: boolean
          }
      upsert_graph_edge: {
        Args: {
          p_confidence?: number
          p_conversion?: number
          p_from_id: string
          p_from_type: string
          p_metadata?: Json
          p_relationship: string
          p_revenue?: number
          p_source?: string
          p_to_id: string
          p_to_type: string
          p_trust?: number
          p_user_id: string
        }
        Returns: string
      }
      upsert_lead_action: {
        Args: {
          p_action_type: string
          p_actor_id: string
          p_intake_id: string
          p_payload?: Json
          p_priority?: string
          p_reason?: string
        }
        Returns: string
      }
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
