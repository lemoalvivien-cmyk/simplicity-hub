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
      graph_edges: {
        Row: {
          created_at: string
          from_entity_id: string
          from_entity_type: string
          id: string
          relationship_type: string
          source: string
          strength_score: number
          to_entity_id: string
          to_entity_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_entity_id: string
          from_entity_type: string
          id?: string
          relationship_type: string
          source?: string
          strength_score?: number
          to_entity_id: string
          to_entity_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_entity_id?: string
          from_entity_type?: string
          id?: string
          relationship_type?: string
          source?: string
          strength_score?: number
          to_entity_id?: string
          to_entity_type?: string
          updated_at?: string
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
      openclaw_recommendations: {
        Row: {
          agent_name: string
          created_at: string
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
        Relationships: []
      }
      openclaw_validations: {
        Row: {
          agent_id: string
          consequence_refuse: string
          consequence_valide: string
          created_at: string
          description: string
          details: string[] | null
          expires_at: string | null
          gateway_callback_url: string | null
          id: string
          payload: Json | null
          risque: string
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
          consequence_refuse: string
          consequence_valide: string
          created_at?: string
          description: string
          details?: string[] | null
          expires_at?: string | null
          gateway_callback_url?: string | null
          id?: string
          payload?: Json | null
          risque?: string
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
          consequence_refuse?: string
          consequence_valide?: string
          created_at?: string
          description?: string
          details?: string[] | null
          expires_at?: string | null
          gateway_callback_url?: string | null
          id?: string
          payload?: Json | null
          risque?: string
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
          id: string
          intent_label: string
          intent_score: number
          openclaw_recommendation_id: string | null
          origin: string
          recommended_next_action: string | null
          recommended_sector: string | null
          signal_id: string | null
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
          id?: string
          intent_label?: string
          intent_score?: number
          openclaw_recommendation_id?: string | null
          origin?: string
          recommended_next_action?: string | null
          recommended_sector?: string | null
          signal_id?: string | null
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
          id?: string
          intent_label?: string
          intent_score?: number
          openclaw_recommendation_id?: string | null
          origin?: string
          recommended_next_action?: string | null
          recommended_sector?: string | null
          signal_id?: string | null
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
      [_ in never]: never
    }
    Functions: {
      refresh_trust_score: {
        Args: { p_facilitator_id: string }
        Returns: undefined
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
