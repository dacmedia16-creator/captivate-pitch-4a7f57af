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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agency_profiles: {
        Row: {
          about_global: string | null
          about_global_image_url: string | null
          about_global_stats: Json | null
          about_national: string | null
          about_national_image_url: string | null
          about_national_stats: Json | null
          about_regional: string | null
          about_regional_image_url: string | null
          about_regional_stats: Json | null
          branch_photo_url: string | null
          company_name: string | null
          created_at: string
          global_stats: Json | null
          id: string
          logo_url: string | null
          objectives: Json | null
          primary_color: string | null
          regional_numbers: string | null
          secondary_color: string | null
          tenant_id: string
          updated_at: string
          value_propositions: Json | null
        }
        Insert: {
          about_global?: string | null
          about_global_image_url?: string | null
          about_global_stats?: Json | null
          about_national?: string | null
          about_national_image_url?: string | null
          about_national_stats?: Json | null
          about_regional?: string | null
          about_regional_image_url?: string | null
          about_regional_stats?: Json | null
          branch_photo_url?: string | null
          company_name?: string | null
          created_at?: string
          global_stats?: Json | null
          id?: string
          logo_url?: string | null
          objectives?: Json | null
          primary_color?: string | null
          regional_numbers?: string | null
          secondary_color?: string | null
          tenant_id: string
          updated_at?: string
          value_propositions?: Json | null
        }
        Update: {
          about_global?: string | null
          about_global_image_url?: string | null
          about_global_stats?: Json | null
          about_national?: string | null
          about_national_image_url?: string | null
          about_national_stats?: Json | null
          about_regional?: string | null
          about_regional_image_url?: string | null
          about_regional_stats?: Json | null
          branch_photo_url?: string | null
          company_name?: string | null
          created_at?: string
          global_stats?: Json | null
          id?: string
          logo_url?: string | null
          objectives?: Json | null
          primary_color?: string | null
          regional_numbers?: string | null
          secondary_color?: string | null
          tenant_id?: string
          updated_at?: string
          value_propositions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      broker_profiles: {
        Row: {
          created_at: string
          creci: string | null
          education: string | null
          id: string
          preferred_layout: string | null
          preferred_tone: string | null
          service_regions: string | null
          short_bio: string | null
          specialties: string | null
          updated_at: string
          user_id: string
          vgv_summary: string | null
          years_in_market: number | null
        }
        Insert: {
          created_at?: string
          creci?: string | null
          education?: string | null
          id?: string
          preferred_layout?: string | null
          preferred_tone?: string | null
          service_regions?: string | null
          short_bio?: string | null
          specialties?: string | null
          updated_at?: string
          user_id: string
          vgv_summary?: string | null
          years_in_market?: number | null
        }
        Update: {
          created_at?: string
          creci?: string | null
          education?: string | null
          id?: string
          preferred_layout?: string | null
          preferred_tone?: string | null
          service_regions?: string | null
          short_bio?: string | null
          specialties?: string | null
          updated_at?: string
          user_id?: string
          vgv_summary?: string | null
          years_in_market?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_differentials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_differentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      export_history: {
        Row: {
          created_at: string
          created_by: string | null
          export_type: string
          file_url: string | null
          id: string
          presentation_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_type: string
          file_url?: string | null
          id?: string
          presentation_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          id?: string
          presentation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_history_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analysis_jobs: {
        Row: {
          created_at: string
          filters: Json | null
          finished_at: string | null
          id: string
          presentation_id: string
          selected_portals: Json | null
          started_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          finished_at?: string | null
          id?: string
          presentation_id: string
          selected_portals?: Json | null
          started_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          finished_at?: string | null
          id?: string
          presentation_id?: string
          selected_portals?: Json | null
          started_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_analysis_jobs_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_analysis_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_comparables: {
        Row: {
          address: string | null
          area: number | null
          bedrooms: number | null
          condominium: string | null
          created_at: string
          external_id: string | null
          id: string
          image_url: string | null
          is_approved: boolean
          market_analysis_job_id: string
          neighborhood: string | null
          parking_spots: number | null
          price: number | null
          price_per_sqm: number | null
          raw_data: Json | null
          similarity_score: number | null
          source_name: string | null
          source_url: string | null
          suites: number | null
          title: string | null
        }
        Insert: {
          address?: string | null
          area?: number | null
          bedrooms?: number | null
          condominium?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          market_analysis_job_id: string
          neighborhood?: string | null
          parking_spots?: number | null
          price?: number | null
          price_per_sqm?: number | null
          raw_data?: Json | null
          similarity_score?: number | null
          source_name?: string | null
          source_url?: string | null
          suites?: number | null
          title?: string | null
        }
        Update: {
          address?: string | null
          area?: number | null
          bedrooms?: number | null
          condominium?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          market_analysis_job_id?: string
          neighborhood?: string | null
          parking_spots?: number | null
          price?: number | null
          price_per_sqm?: number | null
          raw_data?: Json | null
          similarity_score?: number | null
          source_name?: string | null
          source_url?: string | null
          suites?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_comparables_market_analysis_job_id_fkey"
            columns: ["market_analysis_job_id"]
            isOneToOne: false
            referencedRelation: "market_analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_reports: {
        Row: {
          avg_price: number | null
          avg_price_per_sqm: number | null
          confidence_level: string | null
          created_at: string
          explanation: string | null
          id: string
          market_analysis_job_id: string
          median_price: number | null
          suggested_aspirational_price: number | null
          suggested_fast_sale_price: number | null
          suggested_market_price: number | null
          summary: string | null
        }
        Insert: {
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          confidence_level?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          market_analysis_job_id: string
          median_price?: number | null
          suggested_aspirational_price?: number | null
          suggested_fast_sale_price?: number | null
          suggested_market_price?: number | null
          summary?: string | null
        }
        Update: {
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          confidence_level?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          market_analysis_job_id?: string
          median_price?: number | null
          suggested_aspirational_price?: number | null
          suggested_fast_sale_price?: number | null
          suggested_market_price?: number | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_reports_market_analysis_job_id_fkey"
            columns: ["market_analysis_job_id"]
            isOneToOne: false
            referencedRelation: "market_analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_studies: {
        Row: {
          broker_id: string
          created_at: string
          current_phase: string | null
          id: string
          purpose: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          current_phase?: string | null
          id?: string
          purpose?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          current_phase?: string | null
          id?: string
          purpose?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_studies_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_studies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_adjustments: {
        Row: {
          adjustment_type: string
          comparable_id: string
          created_at: string
          direction: string
          id: string
          label: string
          percentage: number | null
          value: number | null
        }
        Insert: {
          adjustment_type: string
          comparable_id: string
          created_at?: string
          direction?: string
          id?: string
          label: string
          percentage?: number | null
          value?: number | null
        }
        Update: {
          adjustment_type?: string
          comparable_id?: string
          created_at?: string
          direction?: string
          id?: string
          label?: string
          percentage?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_study_adjustments_comparable_id_fkey"
            columns: ["comparable_id"]
            isOneToOne: false
            referencedRelation: "market_study_comparables"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_comparables: {
        Row: {
          address: string | null
          adjusted_price: number | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condominium: string | null
          conservation_state: string | null
          construction_standard: string | null
          created_at: string
          differentials: Json | null
          external_id: string | null
          id: string
          image_url: string | null
          is_approved: boolean
          listing_status: string | null
          market_study_id: string
          neighborhood: string | null
          origin: string
          parking_spots: number | null
          price: number | null
          price_per_sqm: number | null
          property_type: string | null
          raw_data: Json | null
          raw_listing_id: string | null
          similarity_score: number | null
          source_name: string | null
          source_url: string | null
          suites: number | null
          title: string | null
        }
        Insert: {
          address?: string | null
          adjusted_price?: number | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium?: string | null
          conservation_state?: string | null
          construction_standard?: string | null
          created_at?: string
          differentials?: Json | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          listing_status?: string | null
          market_study_id: string
          neighborhood?: string | null
          origin?: string
          parking_spots?: number | null
          price?: number | null
          price_per_sqm?: number | null
          property_type?: string | null
          raw_data?: Json | null
          raw_listing_id?: string | null
          similarity_score?: number | null
          source_name?: string | null
          source_url?: string | null
          suites?: number | null
          title?: string | null
        }
        Update: {
          address?: string | null
          adjusted_price?: number | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium?: string | null
          conservation_state?: string | null
          construction_standard?: string | null
          created_at?: string
          differentials?: Json | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          listing_status?: string | null
          market_study_id?: string
          neighborhood?: string | null
          origin?: string
          parking_spots?: number | null
          price?: number | null
          price_per_sqm?: number | null
          property_type?: string | null
          raw_data?: Json | null
          raw_listing_id?: string | null
          similarity_score?: number | null
          source_name?: string | null
          source_url?: string | null
          suites?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_study_comparables_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_study_comparables_raw_listing_id_fkey"
            columns: ["raw_listing_id"]
            isOneToOne: false
            referencedRelation: "market_study_raw_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_executions: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          listings_found: number | null
          listings_matched: number | null
          market_study_id: string
          metadata: Json | null
          portal_source_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          listings_found?: number | null
          listings_matched?: number | null
          market_study_id: string
          metadata?: Json | null
          portal_source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          listings_found?: number | null
          listings_matched?: number | null
          market_study_id?: string
          metadata?: Json | null
          portal_source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_study_executions_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_study_executions_portal_source_id_fkey"
            columns: ["portal_source_id"]
            isOneToOne: false
            referencedRelation: "portal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_raw_listings: {
        Row: {
          area: number | null
          bedrooms: number | null
          created_at: string
          execution_id: string | null
          external_id: string | null
          external_url: string | null
          id: string
          market_study_id: string
          portal_source_id: string | null
          price: number | null
          raw_data: Json | null
          status: string
          title: string | null
        }
        Insert: {
          area?: number | null
          bedrooms?: number | null
          created_at?: string
          execution_id?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          market_study_id: string
          portal_source_id?: string | null
          price?: number | null
          raw_data?: Json | null
          status?: string
          title?: string | null
        }
        Update: {
          area?: number | null
          bedrooms?: number | null
          created_at?: string
          execution_id?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          market_study_id?: string
          portal_source_id?: string | null
          price?: number | null
          raw_data?: Json | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_study_raw_listings_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "market_study_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_study_raw_listings_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_study_raw_listings_portal_source_id_fkey"
            columns: ["portal_source_id"]
            isOneToOne: false
            referencedRelation: "portal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_results: {
        Row: {
          avg_price: number | null
          avg_price_per_sqm: number | null
          confidence_level: string | null
          created_at: string
          executive_summary: string | null
          id: string
          justification: string | null
          market_insights: Json | null
          market_study_id: string
          median_price: number | null
          price_range_max: number | null
          price_range_min: number | null
          research_metadata: Json | null
          suggested_ad_price: number | null
          suggested_fast_sale_price: number | null
          suggested_market_price: number | null
          updated_at: string
        }
        Insert: {
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          confidence_level?: string | null
          created_at?: string
          executive_summary?: string | null
          id?: string
          justification?: string | null
          market_insights?: Json | null
          market_study_id: string
          median_price?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          research_metadata?: Json | null
          suggested_ad_price?: number | null
          suggested_fast_sale_price?: number | null
          suggested_market_price?: number | null
          updated_at?: string
        }
        Update: {
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          confidence_level?: string | null
          created_at?: string
          executive_summary?: string | null
          id?: string
          justification?: string | null
          market_insights?: Json | null
          market_study_id?: string
          median_price?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          research_metadata?: Json | null
          suggested_ad_price?: number | null
          suggested_fast_sale_price?: number | null
          suggested_market_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_study_results_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_settings: {
        Row: {
          adjustment_weights: Json | null
          created_at: string
          default_filters: Json | null
          id: string
          similarity_weights: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adjustment_weights?: Json | null
          created_at?: string
          default_filters?: Json | null
          id?: string
          similarity_weights?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adjustment_weights?: Json | null
          created_at?: string
          default_filters?: Json | null
          id?: string
          similarity_weights?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_study_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_study_subject_properties: {
        Row: {
          address: string | null
          area_built: number | null
          area_land: number | null
          area_useful: number | null
          bathrooms: number | null
          bedrooms: number | null
          cep: string | null
          city: string | null
          condominium: string | null
          condominium_fee: number | null
          conservation_state: string | null
          construction_standard: string | null
          created_at: string
          differentials: Json | null
          id: string
          iptu: number | null
          living_rooms: number | null
          market_study_id: string
          neighborhood: string | null
          observations: string | null
          owner_expected_price: number | null
          parking_spots: number | null
          powder_rooms: number | null
          pricing_objective: string | null
          property_age: string | null
          property_category: string | null
          property_type: string | null
          purpose: string | null
          state: string | null
          suites: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_built?: number | null
          area_land?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          condominium?: string | null
          condominium_fee?: number | null
          conservation_state?: string | null
          construction_standard?: string | null
          created_at?: string
          differentials?: Json | null
          id?: string
          iptu?: number | null
          living_rooms?: number | null
          market_study_id: string
          neighborhood?: string | null
          observations?: string | null
          owner_expected_price?: number | null
          parking_spots?: number | null
          powder_rooms?: number | null
          pricing_objective?: string | null
          property_age?: string | null
          property_category?: string | null
          property_type?: string | null
          purpose?: string | null
          state?: string | null
          suites?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_built?: number | null
          area_land?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          condominium?: string | null
          condominium_fee?: number | null
          conservation_state?: string | null
          construction_standard?: string | null
          created_at?: string
          differentials?: Json | null
          id?: string
          iptu?: number | null
          living_rooms?: number | null
          market_study_id?: string
          neighborhood?: string | null
          observations?: string | null
          owner_expected_price?: number | null
          parking_spots?: number | null
          powder_rooms?: number | null
          pricing_objective?: string | null
          property_age?: string | null
          property_category?: string | null
          property_type?: string | null
          purpose?: string | null
          state?: string | null
          suites?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_study_subject_properties_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_actions: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_sources: {
        Row: {
          base_url: string | null
          code: string
          id: string
          is_global: boolean
          name: string
        }
        Insert: {
          base_url?: string | null
          code: string
          id?: string
          is_global?: boolean
          name: string
        }
        Update: {
          base_url?: string | null
          code?: string
          id?: string
          is_global?: boolean
          name?: string
        }
        Relationships: []
      }
      presentation_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          presentation_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          presentation_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          presentation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_images_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean
          presentation_id: string
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          presentation_id: string
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          presentation_id?: string
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_sections_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_templates: {
        Row: {
          broker_id: string | null
          created_at: string
          id: string
          is_default: boolean
          layout: string | null
          name: string
          structure: Json | null
          tenant_id: string
        }
        Insert: {
          broker_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: string | null
          name: string
          structure?: Json | null
          tenant_id: string
        }
        Update: {
          broker_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: string | null
          name?: string
          structure?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_templates_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          address: string | null
          area_built: number | null
          area_land: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          broker_id: string
          cep: string | null
          city: string | null
          condominium: string | null
          created_at: string
          creation_mode: string | null
          highlights: string | null
          id: string
          market_study_id: string | null
          neighborhood: string | null
          notes: string | null
          owner_expected_price: number | null
          owner_name: string | null
          parking_spots: number | null
          property_age: string | null
          property_purpose: string | null
          property_standard: string | null
          property_type: string | null
          required_documents: Json | null
          selected_layout: string | null
          selected_tone: string | null
          share_expires_at: string | null
          share_token: string | null
          status: string
          suites: number | null
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_built?: number | null
          area_land?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id: string
          cep?: string | null
          city?: string | null
          condominium?: string | null
          created_at?: string
          creation_mode?: string | null
          highlights?: string | null
          id?: string
          market_study_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          owner_expected_price?: number | null
          owner_name?: string | null
          parking_spots?: number | null
          property_age?: string | null
          property_purpose?: string | null
          property_standard?: string | null
          property_type?: string | null
          required_documents?: Json | null
          selected_layout?: string | null
          selected_tone?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: string
          suites?: number | null
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_built?: number | null
          area_land?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id?: string
          cep?: string | null
          city?: string | null
          condominium?: string | null
          created_at?: string
          creation_mode?: string | null
          highlights?: string | null
          id?: string
          market_study_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          owner_expected_price?: number | null
          owner_name?: string | null
          parking_spots?: number | null
          property_age?: string | null
          property_purpose?: string | null
          property_standard?: string | null
          property_type?: string | null
          required_documents?: Json | null
          selected_layout?: string | null
          selected_tone?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: string
          suites?: number | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_market_study_id_fkey"
            columns: ["market_study_id"]
            isOneToOne: false
            referencedRelation: "market_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_results: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          metric_value: string | null
          sort_order: number
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metric_value?: string | null
          sort_order?: number
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metric_value?: string | null
          sort_order?: number
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          max_presentations_per_month: number | null
          max_storage_mb: number | null
          max_users: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_presentations_per_month?: number | null
          max_storage_mb?: number | null
          max_users?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          max_presentations_per_month?: number | null
          max_storage_mb?: number | null
          max_users?: number
          name?: string
        }
        Relationships: []
      }
      tenant_portal_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          portal_source_id: string
          priority: number
          tenant_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          portal_source_id: string
          priority?: number
          tenant_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          portal_source_id?: string
          priority?: number
          tenant_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_portal_settings_portal_source_id_fkey"
            columns: ["portal_source_id"]
            isOneToOne: false
            referencedRelation: "portal_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_portal_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          created_at: string
          id: string
          market_studies_count: number
          month: string
          presentations_count: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_studies_count?: number
          month: string
          presentations_count?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          market_studies_count?: number
          month?: string
          presentations_count?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          sort_order: number
          tenant_id: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          tenant_id: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_limit: {
        Args: { _field: string; _tenant_id: string }
        Returns: boolean
      }
      get_presentation_by_share_token: {
        Args: { _token: string }
        Returns: {
          address: string | null
          area_built: number | null
          area_land: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          broker_id: string
          cep: string | null
          city: string | null
          condominium: string | null
          created_at: string
          creation_mode: string | null
          highlights: string | null
          id: string
          market_study_id: string | null
          neighborhood: string | null
          notes: string | null
          owner_expected_price: number | null
          owner_name: string | null
          parking_spots: number | null
          property_age: string | null
          property_purpose: string | null
          property_standard: string | null
          property_type: string | null
          required_documents: Json | null
          selected_layout: string | null
          selected_tone: string | null
          share_expires_at: string | null
          share_token: string | null
          status: string
          suites: number | null
          tenant_id: string
          title: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "presentations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_tenant_usage: {
        Args: { _field: string; _tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "agency_admin" | "broker"
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
    Enums: {
      app_role: ["super_admin", "agency_admin", "broker"],
    },
  },
} as const
