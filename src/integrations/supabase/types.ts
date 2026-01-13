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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_sessions: {
        Row: {
          accepted_error_percent: number | null
          address: string
          ai_building_type: string | null
          ai_confidence: string | null
          ai_error_percent: number | null
          ai_estimated_sqft: number | null
          ai_estimated_sqft_high: number | null
          ai_estimated_sqft_low: number | null
          ai_methodology: string | null
          ai_model_version: string | null
          ai_pixel_estimate: string | null
          ai_raw_response: Json | null
          ai_reference_objects: string | null
          ai_request_timestamp: string | null
          ai_response_time_ms: number | null
          ai_roof_complexity: string | null
          ai_roof_shape: string | null
          ai_segment_breakdown: string | null
          calculated_squares: number | null
          calculated_total_with_waste: number | null
          calculated_true_sqft: number | null
          created_at: string | null
          final_accepted_sqft: number | null
          final_accepted_squares: number | null
          ground_truth_date: string | null
          ground_truth_notes: string | null
          ground_truth_source: string | null
          ground_truth_sqft: number | null
          ground_truth_squares: number | null
          id: string
          is_usable_for_training: boolean | null
          latitude: number
          longitude: number
          manual_drawing_sqft: number | null
          measurement_method: string | null
          normalized_address: string
          property_type: string | null
          quality_notes: string | null
          satellite_image_url: string | null
          service_type: string
          session_duration_seconds: number | null
          session_id: string
          user_adjusted_sqft: number | null
          user_adjusted_squares: number | null
          user_agent: string | null
          user_id: string | null
          user_selected_complexity: string | null
          user_selected_pitch: string | null
          user_used_manual_drawing: boolean | null
          zoom_level: number | null
        }
        Insert: {
          accepted_error_percent?: number | null
          address: string
          ai_building_type?: string | null
          ai_confidence?: string | null
          ai_error_percent?: number | null
          ai_estimated_sqft?: number | null
          ai_estimated_sqft_high?: number | null
          ai_estimated_sqft_low?: number | null
          ai_methodology?: string | null
          ai_model_version?: string | null
          ai_pixel_estimate?: string | null
          ai_raw_response?: Json | null
          ai_reference_objects?: string | null
          ai_request_timestamp?: string | null
          ai_response_time_ms?: number | null
          ai_roof_complexity?: string | null
          ai_roof_shape?: string | null
          ai_segment_breakdown?: string | null
          calculated_squares?: number | null
          calculated_total_with_waste?: number | null
          calculated_true_sqft?: number | null
          created_at?: string | null
          final_accepted_sqft?: number | null
          final_accepted_squares?: number | null
          ground_truth_date?: string | null
          ground_truth_notes?: string | null
          ground_truth_source?: string | null
          ground_truth_sqft?: number | null
          ground_truth_squares?: number | null
          id?: string
          is_usable_for_training?: boolean | null
          latitude: number
          longitude: number
          manual_drawing_sqft?: number | null
          measurement_method?: string | null
          normalized_address: string
          property_type?: string | null
          quality_notes?: string | null
          satellite_image_url?: string | null
          service_type: string
          session_duration_seconds?: number | null
          session_id: string
          user_adjusted_sqft?: number | null
          user_adjusted_squares?: number | null
          user_agent?: string | null
          user_id?: string | null
          user_selected_complexity?: string | null
          user_selected_pitch?: string | null
          user_used_manual_drawing?: boolean | null
          zoom_level?: number | null
        }
        Update: {
          accepted_error_percent?: number | null
          address?: string
          ai_building_type?: string | null
          ai_confidence?: string | null
          ai_error_percent?: number | null
          ai_estimated_sqft?: number | null
          ai_estimated_sqft_high?: number | null
          ai_estimated_sqft_low?: number | null
          ai_methodology?: string | null
          ai_model_version?: string | null
          ai_pixel_estimate?: string | null
          ai_raw_response?: Json | null
          ai_reference_objects?: string | null
          ai_request_timestamp?: string | null
          ai_response_time_ms?: number | null
          ai_roof_complexity?: string | null
          ai_roof_shape?: string | null
          ai_segment_breakdown?: string | null
          calculated_squares?: number | null
          calculated_total_with_waste?: number | null
          calculated_true_sqft?: number | null
          created_at?: string | null
          final_accepted_sqft?: number | null
          final_accepted_squares?: number | null
          ground_truth_date?: string | null
          ground_truth_notes?: string | null
          ground_truth_source?: string | null
          ground_truth_sqft?: number | null
          ground_truth_squares?: number | null
          id?: string
          is_usable_for_training?: boolean | null
          latitude?: number
          longitude?: number
          manual_drawing_sqft?: number | null
          measurement_method?: string | null
          normalized_address?: string
          property_type?: string | null
          quality_notes?: string | null
          satellite_image_url?: string | null
          service_type?: string
          session_duration_seconds?: number | null
          session_id?: string
          user_adjusted_sqft?: number | null
          user_adjusted_squares?: number | null
          user_agent?: string | null
          user_id?: string | null
          user_selected_complexity?: string | null
          user_selected_pitch?: string | null
          user_used_manual_drawing?: boolean | null
          zoom_level?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_ai_generated: boolean | null
          published_at: string | null
          slug: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          published_at?: string | null
          slug?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          published_at?: string | null
          slug?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      canvassing_logs: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          disposition: Database["public"]["Enums"]["canvassing_disposition"]
          follow_up_at: string | null
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          property_id: string | null
          rep_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          disposition: Database["public"]["Enums"]["canvassing_disposition"]
          follow_up_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          property_id?: string | null
          rep_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          disposition?: Database["public"]["Enums"]["canvassing_disposition"]
          follow_up_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          property_id?: string | null
          rep_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvassing_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvassing_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvassing_logs_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category: string | null
          code: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          markup_percent: number | null
          name: string
          trade_id: string
          unit_cost: number | null
          unit_of_measure: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          markup_percent?: number | null
          name: string
          trade_id: string
          unit_cost?: number | null
          unit_of_measure: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          markup_percent?: number | null
          name?: string
          trade_id?: string
          unit_cost?: number | null
          unit_of_measure?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      coating_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      coating_leads: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          coating_type: string
          created_at: string | null
          discount_percent: number | null
          discounted_price: number | null
          email: string
          email_normalized: string | null
          estimate_high: number | null
          estimate_low: number | null
          estimated_sqft: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          property_address: string
          property_type: string | null
          referral_contractor_id: string | null
          referral_source: string | null
          roof_age: string | null
          roof_condition: string | null
          roof_type: string
          show_as_winner: boolean | null
          status: string | null
          testimonial_text: string | null
          updated_at: string | null
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          coating_type: string
          created_at?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          email: string
          email_normalized?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          estimated_sqft?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          property_address: string
          property_type?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          roof_age?: string | null
          roof_condition?: string | null
          roof_type: string
          show_as_winner?: boolean | null
          status?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          coating_type?: string
          created_at?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          email?: string
          email_normalized?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          estimated_sqft?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          property_address?: string
          property_type?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          roof_age?: string | null
          roof_condition?: string | null
          roof_type?: string
          show_as_winner?: boolean | null
          status?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coating_leads_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coating_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          manager_id: string | null
          role: Database["public"]["Enums"]["company_role"]
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          manager_id?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          manager_id?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string | null
          email: string
          email_normalized: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          product_id: string | null
          referral_contractor_id: string | null
          referral_source: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          product_id?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          product_id?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          preferred_contact_method:
            | Database["public"]["Enums"]["contact_method"]
            | null
          primary_phone: string | null
          secondary_phone: string | null
          source: Database["public"]["Enums"]["contact_source"] | null
          source_details: string | null
          spouse_first_name: string | null
          spouse_last_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          primary_phone?: string | null
          secondary_phone?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          source_details?: string | null
          spouse_first_name?: string | null
          spouse_last_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          primary_phone?: string | null
          secondary_phone?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          source_details?: string | null
          spouse_first_name?: string | null
          spouse_last_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contingencies: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          is_required: boolean | null
          lead_id: string
          signed_at: string | null
          terms_summary: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          is_required?: boolean | null
          lead_id: string
          signed_at?: string | null
          terms_summary?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          is_required?: boolean | null
          lead_id?: string
          signed_at?: string | null
          terms_summary?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contingencies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_feature_access: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contractor_id: string
          created_at: string | null
          feature_name: string
          id: string
          is_approved: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contractor_id: string
          created_at?: string | null
          feature_name: string
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contractor_id?: string
          created_at?: string | null
          feature_name?: string
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_feature_access_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_jobs: {
        Row: {
          collected_amount: number | null
          contractor_id: string
          created_at: string
          homeowner_email: string | null
          homeowner_name: string
          homeowner_phone: string | null
          id: string
          job_details: Json | null
          notes: string | null
          project_id: string | null
          property_address: string
          quoted_amount: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          collected_amount?: number | null
          contractor_id: string
          created_at?: string
          homeowner_email?: string | null
          homeowner_name: string
          homeowner_phone?: string | null
          id?: string
          job_details?: Json | null
          notes?: string | null
          project_id?: string | null
          property_address: string
          quoted_amount?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          collected_amount?: number | null
          contractor_id?: string
          created_at?: string
          homeowner_email?: string | null
          homeowner_name?: string
          homeowner_phone?: string | null
          id?: string
          job_details?: Json | null
          notes?: string | null
          project_id?: string | null
          property_address?: string
          quoted_amount?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_jobs_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "homeowner_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_leads: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          quoted_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          quoted_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          quoted_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "homeowner_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_profiles: {
        Row: {
          availability_days: number | null
          average_rating: number | null
          banner_image_url: string | null
          bio_long: string | null
          bio_short: string | null
          category: string
          client_references: Json | null
          company_name: string
          created_at: string | null
          description: string | null
          email: string | null
          first_name: string | null
          google_business_url: string | null
          id: string
          insurance_info: Json | null
          is_verified: boolean | null
          last_name: string | null
          license_expiration: string | null
          license_number: string | null
          license_state: string | null
          logo_url: string | null
          phone: string | null
          price_tier: string | null
          profile_gallery: Json | null
          review_count: number | null
          secondary_trades: string[] | null
          service_area: string[] | null
          service_areas: Json | null
          services_offered: string[] | null
          social_access_approved: boolean | null
          social_approved_at: string | null
          social_approved_by: string | null
          social_links: Json | null
          subscription_expires_at: string | null
          subscription_status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          availability_days?: number | null
          average_rating?: number | null
          banner_image_url?: string | null
          bio_long?: string | null
          bio_short?: string | null
          category: string
          client_references?: Json | null
          company_name: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          google_business_url?: string | null
          id?: string
          insurance_info?: Json | null
          is_verified?: boolean | null
          last_name?: string | null
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          logo_url?: string | null
          phone?: string | null
          price_tier?: string | null
          profile_gallery?: Json | null
          review_count?: number | null
          secondary_trades?: string[] | null
          service_area?: string[] | null
          service_areas?: Json | null
          services_offered?: string[] | null
          social_access_approved?: boolean | null
          social_approved_at?: string | null
          social_approved_by?: string | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          availability_days?: number | null
          average_rating?: number | null
          banner_image_url?: string | null
          bio_long?: string | null
          bio_short?: string | null
          category?: string
          client_references?: Json | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          google_business_url?: string | null
          id?: string
          insurance_info?: Json | null
          is_verified?: boolean | null
          last_name?: string | null
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          logo_url?: string | null
          phone?: string | null
          price_tier?: string | null
          profile_gallery?: Json | null
          review_count?: number | null
          secondary_trades?: string[] | null
          service_area?: string[] | null
          service_areas?: Json | null
          services_offered?: string[] | null
          social_access_approved?: boolean | null
          social_approved_at?: string | null
          social_approved_by?: string | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contractor_referrals: {
        Row: {
          assigned_contractor_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          job_amount: number | null
          notes: string | null
          paid_at: string | null
          payout_amount: number | null
          property_address: string
          referral_fee_percentage: number | null
          referral_source_context: string | null
          referred_customer_email: string | null
          referred_customer_name: string
          referred_customer_phone: string | null
          referred_service_type: string
          referring_contractor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_contractor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payout_amount?: number | null
          property_address: string
          referral_fee_percentage?: number | null
          referral_source_context?: string | null
          referred_customer_email?: string | null
          referred_customer_name: string
          referred_customer_phone?: string | null
          referred_service_type: string
          referring_contractor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_contractor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payout_amount?: number | null
          property_address?: string
          referral_fee_percentage?: number | null
          referral_source_context?: string | null
          referred_customer_email?: string | null
          referred_customer_name?: string
          referred_customer_phone?: string | null
          referred_service_type?: string
          referring_contractor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_referrals_assigned_contractor_id_fkey"
            columns: ["assigned_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_referrals_referring_contractor_id_fkey"
            columns: ["referring_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_reviews: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          project_id: string | null
          rating: number
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string
          user_id: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          project_id?: string | null
          rating: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name: string
          user_id?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          project_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "homeowner_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string | null
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          module_id: string | null
          pdf_url: string | null
          sort_order: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          pdf_url?: string | null
          sort_order?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          pdf_url?: string | null
          sort_order?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string | null
          passing_score: number | null
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number | null
          questions: Json
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number | null
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string | null
          customer_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_rep_id: string | null
          city: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          insurance_company: string | null
          insurance_policy: string | null
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_rep_id?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance_company?: string | null
          insurance_policy?: string | null
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_rep_id?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance_company?: string | null
          insurance_policy?: string | null
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_rep_id_fkey"
            columns: ["assigned_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          item_name: string
          quantity: number
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          item_name: string
          quantity: number
          sort_order?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          item_name?: string
          quantity?: number
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_packages: {
        Row: {
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          is_recommended: boolean | null
          items: Json | null
          name: string
          total: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          is_recommended?: boolean | null
          items?: Json | null
          name: string
          total?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          is_recommended?: boolean | null
          items?: Json | null
          name?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_packages_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          estimate_number: string | null
          id: string
          measurement_id: string | null
          notes: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          estimate_number?: string | null
          id?: string
          measurement_id?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          estimate_number?: string | null
          id?: string
          measurement_id?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_contractors: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      field_properties: {
        Row: {
          address: string
          city: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          disposition: string | null
          id: string
          last_contacted_at: string | null
          last_contacted_by: string | null
          latitude: number
          longitude: number
          notes: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          disposition?: string | null
          id?: string
          last_contacted_at?: string | null
          last_contacted_by?: string | null
          latitude: number
          longitude: number
          notes?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          disposition?: string | null
          id?: string
          last_contacted_at?: string | null
          last_contacted_by?: string | null
          latitude?: number
          longitude?: number
          notes?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          company_id: string | null
          created_at: string | null
          document_category: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_category?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_category?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_appointments: {
        Row: {
          appointment_type: string
          cancelled_at: string | null
          confirmed_at: string | null
          contractor_id: string
          conversation_id: string | null
          created_at: string | null
          duration_minutes: number | null
          homeowner_id: string
          id: string
          notes: string | null
          property_address: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_type: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          contractor_id: string
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          homeowner_id: string
          id?: string
          notes?: string | null
          property_address?: string | null
          scheduled_date: string
          scheduled_time: string
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          contractor_id?: string
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          homeowner_id?: string
          id?: string
          notes?: string | null
          property_address?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_appointments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "homeowner_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_conversations: {
        Row: {
          contractor_id: string
          contractor_unread_count: number | null
          created_at: string | null
          homeowner_id: string
          homeowner_unread_count: number | null
          id: string
          last_message_at: string | null
        }
        Insert: {
          contractor_id: string
          contractor_unread_count?: number | null
          created_at?: string | null
          homeowner_id: string
          homeowner_unread_count?: number | null
          id?: string
          last_message_at?: string | null
        }
        Update: {
          contractor_id?: string
          contractor_unread_count?: number | null
          created_at?: string | null
          homeowner_id?: string
          homeowner_unread_count?: number | null
          id?: string
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_conversations_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_estimates: {
        Row: {
          created_at: string | null
          email_normalized: string
          estimate_data: Json | null
          estimate_high: number | null
          estimate_low: number | null
          estimate_name: string
          estimate_version: number | null
          id: string
          line_items: Json | null
          pdf_url: string | null
          property_address: string | null
          service_type: string
          signature_data: string | null
          signed_at: string | null
          signed_ip: string | null
          status: string | null
          terms_agreed: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_normalized: string
          estimate_data?: Json | null
          estimate_high?: number | null
          estimate_low?: number | null
          estimate_name: string
          estimate_version?: number | null
          id?: string
          line_items?: Json | null
          pdf_url?: string | null
          property_address?: string | null
          service_type?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          status?: string | null
          terms_agreed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_normalized?: string
          estimate_data?: Json | null
          estimate_high?: number | null
          estimate_low?: number | null
          estimate_name?: string
          estimate_version?: number | null
          id?: string
          line_items?: Json | null
          pdf_url?: string | null
          property_address?: string | null
          service_type?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          status?: string | null
          terms_agreed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      homeowner_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "homeowner_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_table?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      homeowner_photos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      homeowner_projects: {
        Row: {
          ai_estimate_high: number | null
          ai_estimate_low: number | null
          assigned_contractor_id: string | null
          city: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          official_quote: number | null
          project_details: Json | null
          property_address: string
          service_type: string
          state: string | null
          status: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          ai_estimate_high?: number | null
          ai_estimate_low?: number | null
          assigned_contractor_id?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          official_quote?: number | null
          project_details?: Json | null
          property_address: string
          service_type: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          ai_estimate_high?: number | null
          ai_estimate_low?: number | null
          assigned_contractor_id?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          official_quote?: number | null
          project_details?: Json | null
          property_address?: string
          service_type?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_projects_assigned_contractor_id_fkey"
            columns: ["assigned_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_referral_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          declined_at: string | null
          homeowner_email: string | null
          homeowner_id: string | null
          id: string
          job_type: string
          message: string | null
          project_id: string | null
          property_address: string | null
          recommended_contractor_id: string
          referring_contractor_id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          homeowner_email?: string | null
          homeowner_id?: string | null
          id?: string
          job_type: string
          message?: string | null
          project_id?: string | null
          property_address?: string | null
          recommended_contractor_id: string
          referring_contractor_id: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          homeowner_email?: string | null
          homeowner_id?: string | null
          id?: string
          job_type?: string
          message?: string | null
          project_id?: string | null
          property_address?: string | null
          recommended_contractor_id?: string
          referring_contractor_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_referral_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "homeowner_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_referral_invitations_recommended_contractor_id_fkey"
            columns: ["recommended_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_referral_invitations_referring_contractor_id_fkey"
            columns: ["referring_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          completed_at: string | null
          created_at: string | null
          damage_types: Json | null
          id: string
          inspector_id: string | null
          lead_id: string
          property_id: string | null
          recommendation:
            | Database["public"]["Enums"]["inspection_recommendation"]
            | null
          roof_type: Database["public"]["Enums"]["roof_type"] | null
          scheduled_at: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          damage_types?: Json | null
          id?: string
          inspector_id?: string | null
          lead_id: string
          property_id?: string | null
          recommendation?:
            | Database["public"]["Enums"]["inspection_recommendation"]
            | null
          roof_type?: Database["public"]["Enums"]["roof_type"] | null
          scheduled_at?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          damage_types?: Json | null
          id?: string
          inspector_id?: string | null
          lead_id?: string
          property_id?: string | null
          recommendation?:
            | Database["public"]["Enums"]["inspection_recommendation"]
            | null
          roof_type?: Database["public"]["Enums"]["roof_type"] | null
          scheduled_at?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_profiles: {
        Row: {
          acv_amount: number | null
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          claim_number: string | null
          coverage_type: string | null
          created_at: string | null
          date_of_loss: string | null
          deductible_amount: number | null
          id: string
          insurance_carrier: string | null
          notes: string | null
          policy_number: string | null
          property_id: string
          rcv_amount: number | null
          recoverable_depreciation: number | null
          updated_at: string | null
        }
        Insert: {
          acv_amount?: number | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          claim_number?: string | null
          coverage_type?: string | null
          created_at?: string | null
          date_of_loss?: string | null
          deductible_amount?: number | null
          id?: string
          insurance_carrier?: string | null
          notes?: string | null
          policy_number?: string | null
          property_id: string
          rcv_amount?: number | null
          recoverable_depreciation?: number | null
          updated_at?: string | null
        }
        Update: {
          acv_amount?: number | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          claim_number?: string | null
          coverage_type?: string | null
          created_at?: string | null
          date_of_loss?: string | null
          deductible_amount?: number | null
          id?: string
          insurance_carrier?: string | null
          notes?: string | null
          policy_number?: string | null
          property_id?: string
          rcv_amount?: number | null
          recoverable_depreciation?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invoices: {
        Row: {
          amount: number
          created_at: string
          due_at: string | null
          id: string
          invoice_number: string
          invoice_type: string | null
          job_id: string
          notes: string | null
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          due_at?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string | null
          job_id: string
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string | null
          job_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_at: string | null
          id: string
          job_id: string
          notes: string | null
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          appointment_at: string | null
          assigned_crew_id: string | null
          assigned_pm_id: string | null
          assigned_rep_id: string | null
          closed_at: string | null
          cogs_budget: Json | null
          commission_forecast: Json | null
          company_id: string | null
          contact_id: string | null
          contract_amount: number | null
          contract_signed_at: string | null
          created_at: string
          gross_profit_estimate: number | null
          id: string
          lost_reason: string | null
          measurement_data: Json | null
          notes: string | null
          priority: string | null
          property_id: string | null
          rep_card_data: Json | null
          service_type: string | null
          source: string | null
          stage: Database["public"]["Enums"]["job_stage"]
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_at?: string | null
          assigned_crew_id?: string | null
          assigned_pm_id?: string | null
          assigned_rep_id?: string | null
          closed_at?: string | null
          cogs_budget?: Json | null
          commission_forecast?: Json | null
          company_id?: string | null
          contact_id?: string | null
          contract_amount?: number | null
          contract_signed_at?: string | null
          created_at?: string
          gross_profit_estimate?: number | null
          id?: string
          lost_reason?: string | null
          measurement_data?: Json | null
          notes?: string | null
          priority?: string | null
          property_id?: string | null
          rep_card_data?: Json | null
          service_type?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["job_stage"]
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_at?: string | null
          assigned_crew_id?: string | null
          assigned_pm_id?: string | null
          assigned_rep_id?: string | null
          closed_at?: string | null
          cogs_budget?: Json | null
          commission_forecast?: Json | null
          company_id?: string | null
          contact_id?: string | null
          contract_amount?: number | null
          contract_signed_at?: string | null
          created_at?: string
          gross_profit_estimate?: number | null
          id?: string
          lost_reason?: string | null
          measurement_data?: Json | null
          notes?: string | null
          priority?: string | null
          property_id?: string | null
          rep_card_data?: Json | null
          service_type?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["job_stage"]
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_pm_id_fkey"
            columns: ["assigned_pm_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_rep_id_fkey"
            columns: ["assigned_rep_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_communication_history: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          lead_type: string
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          lead_type: string
          message: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          lead_type?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_rep_id: string | null
          closed_at: string | null
          closed_reason: string | null
          company_id: string | null
          contact_id: string
          created_at: string | null
          expected_value: number | null
          id: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          property_id: string
          qualification_notes: string | null
          source: Database["public"]["Enums"]["contact_source"] | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_rep_id?: string | null
          closed_at?: string | null
          closed_reason?: string | null
          company_id?: string | null
          contact_id: string
          created_at?: string | null
          expected_value?: number | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          property_id: string
          qualification_notes?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_rep_id?: string | null
          closed_at?: string | null
          closed_reason?: string | null
          company_id?: string | null
          contact_id?: string
          created_at?: string | null
          expected_value?: number | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          property_id?: string
          qualification_notes?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_rep_id_fkey"
            columns: ["assigned_rep_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          enrollment_id: string | null
          id: string
          lesson_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          enrollment_id?: string | null
          id?: string
          lesson_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          enrollment_id?: string | null
          id?: string
          lesson_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      login_requests: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          contractor_id: string | null
          created_at: string | null
          email: string
          escalated_at: string | null
          escalation_count: number | null
          first_name: string | null
          id: string
          is_auto_approved: boolean | null
          is_escalated: boolean | null
          last_name: string | null
          last_reminder_sent_at: string | null
          request_notes: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          contractor_id?: string | null
          created_at?: string | null
          email: string
          escalated_at?: string | null
          escalation_count?: number | null
          first_name?: string | null
          id?: string
          is_auto_approved?: boolean | null
          is_escalated?: boolean | null
          last_name?: string | null
          last_reminder_sent_at?: string | null
          request_notes?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          contractor_id?: string | null
          created_at?: string | null
          email?: string
          escalated_at?: string | null
          escalation_count?: number | null
          first_name?: string | null
          id?: string
          is_auto_approved?: boolean | null
          is_escalated?: boolean | null
          last_name?: string | null
          last_reminder_sent_at?: string | null
          request_notes?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_requests_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          budget_range: string | null
          company_name: string | null
          created_at: string | null
          email: string
          email_normalized: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          referral_contractor_id: string | null
          referral_source: string | null
          service_interest: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget_range?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          service_interest?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget_range?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          service_interest?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_leads_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          id: string
          materials: string
          notes: string | null
          quantity: string | null
          requested_by: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
          work_order_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          materials: string
          notes?: string | null
          quantity?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          work_order_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          materials?: string
          notes?: string | null
          quantity?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          linear_feet_eave: number | null
          linear_feet_hip: number | null
          linear_feet_rake: number | null
          linear_feet_valley: number | null
          notes: string | null
          pitch_multiplier: number | null
          polygon_data: Json | null
          property_image_url: string | null
          total_square_feet: number | null
          total_squares: number | null
          updated_at: string | null
          waste_factor_percent: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          linear_feet_eave?: number | null
          linear_feet_hip?: number | null
          linear_feet_rake?: number | null
          linear_feet_valley?: number | null
          notes?: string | null
          pitch_multiplier?: number | null
          polygon_data?: Json | null
          property_image_url?: string | null
          total_square_feet?: number | null
          total_squares?: number | null
          updated_at?: string | null
          waste_factor_percent?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          linear_feet_eave?: number | null
          linear_feet_hip?: number | null
          linear_feet_rake?: number | null
          linear_feet_valley?: number | null
          notes?: string | null
          pitch_multiplier?: number | null
          polygon_data?: Json | null
          property_image_url?: string | null
          total_square_feet?: number | null
          total_squares?: number | null
          updated_at?: string | null
          waste_factor_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      network_members: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          member_type: string
          phone: string | null
          state: string | null
          status: string
          updated_at: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          member_type?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          member_type?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_user_id: string | null
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_pinned: boolean | null
          updated_at: string | null
        }
        Insert: {
          author_user_id?: string | null
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author_user_id?: string | null
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_admins: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permit_building_departments: {
        Row: {
          address: string | null
          city: string | null
          county: string
          created_at: string | null
          hours: string | null
          id: string
          jurisdiction_type: string
          name: string
          phone: string | null
          portal_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county: string
          created_at?: string | null
          hours?: string | null
          id?: string
          jurisdiction_type?: string
          name: string
          phone?: string | null
          portal_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county?: string
          created_at?: string | null
          hours?: string | null
          id?: string
          jurisdiction_type?: string
          name?: string
          phone?: string | null
          portal_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      permit_contractors: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permit_local_codes: {
        Row: {
          building_dept_id: string | null
          code_reference: string | null
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          requirement_description: string | null
          requirement_title: string
          trade_type: string
        }
        Insert: {
          building_dept_id?: string | null
          code_reference?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          requirement_description?: string | null
          requirement_title: string
          trade_type: string
        }
        Update: {
          building_dept_id?: string | null
          code_reference?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          requirement_description?: string | null
          requirement_title?: string
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_local_codes_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_project_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_projects: {
        Row: {
          architectural_approval: boolean | null
          architectural_approval_required: boolean | null
          city: string | null
          contractor_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          has_hurricane_straps: boolean | null
          hoa_approval: boolean | null
          id: string
          inspection_requested: string | null
          inspection_requested_at: string | null
          notes: string | null
          property_address: string
          revision_notes: string | null
          revision_requested: boolean | null
          roof_accessories: string | null
          roof_color: string | null
          roof_type: string | null
          service_type: string
          state: string | null
          status: string
          underlayment_type: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          architectural_approval?: boolean | null
          architectural_approval_required?: boolean | null
          city?: string | null
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          has_hurricane_straps?: boolean | null
          hoa_approval?: boolean | null
          id?: string
          inspection_requested?: string | null
          inspection_requested_at?: string | null
          notes?: string | null
          property_address: string
          revision_notes?: string | null
          revision_requested?: boolean | null
          roof_accessories?: string | null
          roof_color?: string | null
          roof_type?: string | null
          service_type: string
          state?: string | null
          status?: string
          underlayment_type?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          architectural_approval?: boolean | null
          architectural_approval_required?: boolean | null
          city?: string | null
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          has_hurricane_straps?: boolean | null
          hoa_approval?: boolean | null
          id?: string
          inspection_requested?: string | null
          inspection_requested_at?: string | null
          notes?: string | null
          property_address?: string
          revision_notes?: string | null
          revision_requested?: boolean | null
          roof_accessories?: string | null
          roof_color?: string | null
          roof_type?: string | null
          service_type?: string
          state?: string | null
          status?: string
          underlayment_type?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_projects_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "permit_contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_required_documents: {
        Row: {
          building_dept_id: string | null
          created_at: string | null
          document_name: string
          document_url: string | null
          id: string
          is_required: boolean | null
          notes: string | null
          sort_order: number | null
          trade_type: string
        }
        Insert: {
          building_dept_id?: string | null
          created_at?: string | null
          document_name: string
          document_url?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          sort_order?: number | null
          trade_type: string
        }
        Update: {
          building_dept_id?: string | null
          created_at?: string | null
          document_name?: string
          document_url?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          sort_order?: number | null
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_required_documents_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          member_id: string
          points: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_id: string
          points: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_id?: string
          points?: number
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "store_members"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          presentation_id: string
          slide_type: string
          sort_order: number
          title: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          presentation_id: string
          slide_type: string
          sort_order: number
          title?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          presentation_id?: string
          slide_type?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_template: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          email_normalized: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_normalized?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_normalized?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          project_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          project_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          project_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "homeowner_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string | null
          company_id: string | null
          contact_id: string
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          mapbox_place_id: string | null
          notes: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          state: string | null
          updated_at: string | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mapbox_place_id?: string | null
          notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          updated_at?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mapbox_place_id?: string | null
          notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          updated_at?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempted_at: string | null
          enrollment_id: string | null
          id: string
          passed: boolean
          quiz_id: string | null
          score: number
        }
        Insert: {
          answers?: Json | null
          attempted_at?: string | null
          enrollment_id?: string | null
          id?: string
          passed: boolean
          quiz_id?: string | null
          score: number
        }
        Update: {
          answers?: Json | null
          attempted_at?: string | null
          enrollment_id?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      roof_analysis_cache: {
        Row: {
          address: string
          adjusted_sqft: number | null
          complexity_factor: number | null
          confidence: string | null
          created_at: string
          degradation_notes: string | null
          estimated_roof_age_years: number | null
          expires_at: string | null
          flat_section_color: string | null
          flat_section_sqft: number | null
          flat_sqft: number
          has_mixed_roof: boolean | null
          id: string
          latitude: number
          longitude: number
          methodology: string | null
          normalized_address: string
          pitch_factor: number | null
          roof_age_confidence: string | null
          roof_complexity: string | null
          roof_shape: string | null
          satellite_image_url: string | null
          shingle_section_color: string | null
          shingle_section_sqft: number | null
          total_squares: number | null
          updated_at: string
          user_adjusted_sqft: number | null
          user_adjusted_squares: number | null
        }
        Insert: {
          address: string
          adjusted_sqft?: number | null
          complexity_factor?: number | null
          confidence?: string | null
          created_at?: string
          degradation_notes?: string | null
          estimated_roof_age_years?: number | null
          expires_at?: string | null
          flat_section_color?: string | null
          flat_section_sqft?: number | null
          flat_sqft: number
          has_mixed_roof?: boolean | null
          id?: string
          latitude: number
          longitude: number
          methodology?: string | null
          normalized_address: string
          pitch_factor?: number | null
          roof_age_confidence?: string | null
          roof_complexity?: string | null
          roof_shape?: string | null
          satellite_image_url?: string | null
          shingle_section_color?: string | null
          shingle_section_sqft?: number | null
          total_squares?: number | null
          updated_at?: string
          user_adjusted_sqft?: number | null
          user_adjusted_squares?: number | null
        }
        Update: {
          address?: string
          adjusted_sqft?: number | null
          complexity_factor?: number | null
          confidence?: string | null
          created_at?: string
          degradation_notes?: string | null
          estimated_roof_age_years?: number | null
          expires_at?: string | null
          flat_section_color?: string | null
          flat_section_sqft?: number | null
          flat_sqft?: number
          has_mixed_roof?: boolean | null
          id?: string
          latitude?: number
          longitude?: number
          methodology?: string | null
          normalized_address?: string
          pitch_factor?: number | null
          roof_age_confidence?: string | null
          roof_complexity?: string | null
          roof_shape?: string | null
          satellite_image_url?: string | null
          shingle_section_color?: string | null
          shingle_section_sqft?: number | null
          total_squares?: number | null
          updated_at?: string
          user_adjusted_sqft?: number | null
          user_adjusted_squares?: number | null
        }
        Relationships: []
      }
      roof_photos: {
        Row: {
          address: string
          analysis_result: Json | null
          cache_id: string | null
          created_at: string
          detected_color: string | null
          detected_condition: string | null
          detected_material: string | null
          id: string
          normalized_address: string
          photo_type: string | null
          photo_url: string
        }
        Insert: {
          address: string
          analysis_result?: Json | null
          cache_id?: string | null
          created_at?: string
          detected_color?: string | null
          detected_condition?: string | null
          detected_material?: string | null
          id?: string
          normalized_address: string
          photo_type?: string | null
          photo_url: string
        }
        Update: {
          address?: string
          analysis_result?: Json | null
          cache_id?: string | null
          created_at?: string
          detected_color?: string | null
          detected_condition?: string | null
          detected_material?: string | null
          id?: string
          normalized_address?: string
          photo_type?: string | null
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "roof_photos_cache_id_fkey"
            columns: ["cache_id"]
            isOneToOne: false
            referencedRelation: "roof_analysis_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      roofing_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      roofing_consultations: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          budget: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          email_normalized: string | null
          estimated_price: number | null
          id: string
          notes: string | null
          priority: string | null
          recommended_package: string | null
          roof_type: string | null
          sqft: number | null
          status: string | null
          timeline: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          budget?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          email_normalized?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          recommended_package?: string | null
          roof_type?: string | null
          sqft?: number | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          budget?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          email_normalized?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          recommended_package?: string | null
          roof_type?: string | null
          sqft?: number | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roofing_consultations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roofing_quiz_responses: {
        Row: {
          address: string
          answers: Json
          appointment_scheduled: boolean | null
          appointment_type: string | null
          city_state: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          email_normalized: string | null
          id: string
          recommendations: Json | null
          roof_squares: number | null
          selected_estimate_high: number | null
          selected_estimate_low: number | null
          selected_package: string | null
          selected_tier: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          answers: Json
          appointment_scheduled?: boolean | null
          appointment_type?: string | null
          city_state?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          email_normalized?: string | null
          id?: string
          recommendations?: Json | null
          roof_squares?: number | null
          selected_estimate_high?: number | null
          selected_estimate_low?: number | null
          selected_package?: string | null
          selected_tier?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          answers?: Json
          appointment_scheduled?: boolean | null
          appointment_type?: string | null
          city_state?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          email_normalized?: string | null
          id?: string
          recommendations?: Json | null
          roof_squares?: number | null
          selected_estimate_high?: number | null
          selected_estimate_low?: number | null
          selected_package?: string | null
          selected_tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          created_at: string | null
          email: string
          email_normalized: string | null
          id: string
          message: string | null
          name: string
          phone: string
          property_address: string | null
          referral_contractor_id: string | null
          referral_source: string | null
          service_tier_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          property_address?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          service_tier_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_normalized?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          property_address?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          service_tier_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_tier_id_fkey"
            columns: ["service_tier_id"]
            isOneToOne: false
            referencedRelation: "service_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tiers: {
        Row: {
          category_id: string | null
          created_at: string | null
          features: string[] | null
          id: string
          name: string
          price: number | null
          sort_order: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          features?: string[] | null
          id?: string
          name: string
          price?: number | null
          sort_order?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          features?: string[] | null
          id?: string
          name?: string
          price?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_tiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      social_conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "social_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_conversations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_group: boolean | null
          last_message_at: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "social_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      social_messages: {
        Row: {
          content_text: string | null
          conversation_id: string
          created_at: string | null
          edited_at: string | null
          has_attachments: boolean | null
          id: string
          is_deleted: boolean | null
          sender_id: string
        }
        Insert: {
          content_text?: string | null
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          has_attachments?: boolean | null
          id?: string
          is_deleted?: boolean | null
          sender_id: string
        }
        Update: {
          content_text?: string | null
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          has_attachments?: boolean | null
          id?: string
          is_deleted?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "social_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_comments: {
        Row: {
          author_id: string
          content_text: string
          created_at: string | null
          id: string
          like_count: number | null
          post_id: string
          reply_to_comment_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content_text: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id: string
          reply_to_comment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content_text?: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id?: string
          reply_to_comment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_comments_reply_to_comment_id_fkey"
            columns: ["reply_to_comment_id"]
            isOneToOne: false
            referencedRelation: "social_post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_media: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          post_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content_text: string
          created_at: string | null
          id: string
          is_repost: boolean | null
          like_count: number | null
          location_tags: string[] | null
          original_post_id: string | null
          reply_to_post_id: string | null
          repost_count: number | null
          trade_tags: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content_text: string
          created_at?: string | null
          id?: string
          is_repost?: boolean | null
          like_count?: number | null
          location_tags?: string[] | null
          original_post_id?: string | null
          reply_to_post_id?: string | null
          repost_count?: number | null
          trade_tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content_text?: string
          created_at?: string | null
          id?: string
          is_repost?: boolean | null
          like_count?: number | null
          location_tags?: string[] | null
          original_post_id?: string | null
          reply_to_post_id?: string | null
          repost_count?: number | null
          trade_tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_reply_to_post_id_fkey"
            columns: ["reply_to_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_comment_id: string | null
          reported_post_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "social_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_reports_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string | null
          id: string
          points_balance: number
          total_points_earned: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_balance?: number
          total_points_earned?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_balance?: number
          total_points_earned?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      supplement_admins: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_contractors: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_lead_documents: {
        Row: {
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          lead_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          lead_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          lead_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "supplement_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_lead_notes: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          lead_id: string
          note_text: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          lead_id: string
          note_text: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_lead_notes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "supplement_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "supplement_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_lead_requests: {
        Row: {
          completed_at: string | null
          id: string
          lead_id: string
          notes: string | null
          request_type: string
          requested_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          request_type: string
          requested_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          request_type?: string
          requested_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_lead_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "supplement_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_leads: {
        Row: {
          assigned_amount: number | null
          claim_number: string | null
          claim_type: string
          contractor_id: string
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date_of_loss: string | null
          id: string
          insurance_company: string | null
          notes: string | null
          property_address: string
          property_city: string
          property_state: string | null
          property_zip: string | null
          referral_contractor_id: string | null
          referral_source: string | null
          settled_amount: number | null
          status: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_amount?: number | null
          claim_number?: string | null
          claim_type: string
          contractor_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date_of_loss?: string | null
          id?: string
          insurance_company?: string | null
          notes?: string | null
          property_address: string
          property_city: string
          property_state?: string | null
          property_zip?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          settled_amount?: number | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_amount?: number | null
          claim_number?: string | null
          claim_type?: string
          contractor_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date_of_loss?: string | null
          id?: string
          insurance_company?: string | null
          notes?: string | null
          property_address?: string
          property_city?: string
          property_state?: string | null
          property_zip?: string | null
          referral_contractor_id?: string | null
          referral_source?: string | null
          settled_amount?: number | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "supplement_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_leads_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          expertise: string[] | null
          id: string
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      window_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      window_leads: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          city: string | null
          created_at: string | null
          discount_percent: number | null
          discount_type: string | null
          discounted_price: number | null
          email: string
          email_normalized: string | null
          estimate_high: number | null
          estimate_low: number | null
          existing_window_type: string | null
          exterior_color: string | null
          financing_option: string | null
          glass_type: string | null
          grid_style: string | null
          id: string
          interior_color: string | null
          name: string
          notes: string | null
          performance_level: string | null
          phone: string | null
          property_address: string
          referral_contractor_id: string | null
          referral_source: string | null
          show_as_winner: boolean | null
          spin_result: string | null
          state: string | null
          status: string | null
          testimonial_text: string | null
          total_windows: number | null
          updated_at: string | null
          user_id: string | null
          window_selections: Json | null
          zip_code: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          city?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discounted_price?: number | null
          email: string
          email_normalized?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          existing_window_type?: string | null
          exterior_color?: string | null
          financing_option?: string | null
          glass_type?: string | null
          grid_style?: string | null
          id?: string
          interior_color?: string | null
          name: string
          notes?: string | null
          performance_level?: string | null
          phone?: string | null
          property_address: string
          referral_contractor_id?: string | null
          referral_source?: string | null
          show_as_winner?: boolean | null
          spin_result?: string | null
          state?: string | null
          status?: string | null
          testimonial_text?: string | null
          total_windows?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_selections?: Json | null
          zip_code?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          city?: string | null
          created_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discounted_price?: number | null
          email?: string
          email_normalized?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          existing_window_type?: string | null
          exterior_color?: string | null
          financing_option?: string | null
          glass_type?: string | null
          grid_style?: string | null
          id?: string
          interior_color?: string | null
          name?: string
          notes?: string | null
          performance_level?: string | null
          phone?: string | null
          property_address?: string
          referral_contractor_id?: string | null
          referral_source?: string | null
          show_as_winner?: boolean | null
          spin_result?: string | null
          state?: string | null
          status?: string | null
          testimonial_text?: string | null
          total_windows?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_selections?: Json | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "window_leads_referral_contractor_id_fkey"
            columns: ["referral_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "window_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string
          id: string
          notes: string | null
          photo_type: string | null
          uploaded_by: string | null
          work_order_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          uploaded_by?: string | null
          work_order_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          uploaded_by?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          address: string | null
          assigned_crew_id: string | null
          assigned_rep_id: string | null
          city: string | null
          company_id: string
          created_at: string | null
          customer_id: string | null
          id: string
          job_details: Json | null
          job_type: string | null
          notes: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_crew_id?: string | null
          assigned_rep_id?: string | null
          city?: string | null
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          job_details?: Json | null
          job_type?: string | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_crew_id?: string | null
          assigned_rep_id?: string | null
          city?: string | null
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          job_details?: Json | null
          job_type?: string | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_assigned_rep_id_fkey"
            columns: ["assigned_rep_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_role: {
        Args: { _company_id: string }
        Returns: Database["public"]["Enums"]["company_role"]
      }
      get_contractor_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_social_access: { Args: never; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_company_or_super_admin: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      normalize_address: { Args: { addr: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "sales_rep" | "teacher" | "student" | "contractor"
      canvassing_disposition:
        | "not_home"
        | "not_interested"
        | "follow_up"
        | "appointment_set"
        | "sold"
        | "bad_data"
      company_role:
        | "company_admin"
        | "manager"
        | "project_manager"
        | "sales_rep"
        | "crew"
      contact_method: "call" | "text" | "email"
      contact_source:
        | "canvass"
        | "web_form"
        | "referral"
        | "inbound_call"
        | "door_hanger"
        | "social_media"
        | "advertisement"
        | "other"
      inspection_recommendation:
        | "repair"
        | "partial_replacement"
        | "full_replacement"
        | "coating"
        | "no_action"
      job_stage:
        | "new_lead"
        | "contacted"
        | "inspection_scheduled"
        | "inspection_completed"
        | "estimate_sent"
        | "presented"
        | "won"
        | "permitting"
        | "material_ordered"
        | "scheduled"
        | "in_production"
        | "final_walkthrough"
        | "invoice_sent"
        | "paid"
        | "closed_out"
        | "lost"
      lead_status:
        | "new"
        | "contact_made"
        | "inspection_scheduled"
        | "inspected"
        | "estimate_sent"
        | "negotiating"
        | "closed_won"
        | "closed_lost"
        | "no_deal"
      lead_type: "retail" | "insurance"
      pipeline_stage:
        | "lead"
        | "inspection"
        | "estimate_sent"
        | "sold"
        | "in_production"
        | "complete"
      property_type: "residential" | "commercial" | "multifamily" | "hoa"
      roof_type:
        | "shingle"
        | "tile"
        | "metal"
        | "flat"
        | "coating_candidate"
        | "other"
      transaction_type:
        | "purchase"
        | "reward"
        | "referral"
        | "redemption"
        | "welcome_bonus"
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
      app_role: ["admin", "sales_rep", "teacher", "student", "contractor"],
      canvassing_disposition: [
        "not_home",
        "not_interested",
        "follow_up",
        "appointment_set",
        "sold",
        "bad_data",
      ],
      company_role: [
        "company_admin",
        "manager",
        "project_manager",
        "sales_rep",
        "crew",
      ],
      contact_method: ["call", "text", "email"],
      contact_source: [
        "canvass",
        "web_form",
        "referral",
        "inbound_call",
        "door_hanger",
        "social_media",
        "advertisement",
        "other",
      ],
      inspection_recommendation: [
        "repair",
        "partial_replacement",
        "full_replacement",
        "coating",
        "no_action",
      ],
      job_stage: [
        "new_lead",
        "contacted",
        "inspection_scheduled",
        "inspection_completed",
        "estimate_sent",
        "presented",
        "won",
        "permitting",
        "material_ordered",
        "scheduled",
        "in_production",
        "final_walkthrough",
        "invoice_sent",
        "paid",
        "closed_out",
        "lost",
      ],
      lead_status: [
        "new",
        "contact_made",
        "inspection_scheduled",
        "inspected",
        "estimate_sent",
        "negotiating",
        "closed_won",
        "closed_lost",
        "no_deal",
      ],
      lead_type: ["retail", "insurance"],
      pipeline_stage: [
        "lead",
        "inspection",
        "estimate_sent",
        "sold",
        "in_production",
        "complete",
      ],
      property_type: ["residential", "commercial", "multifamily", "hoa"],
      roof_type: [
        "shingle",
        "tile",
        "metal",
        "flat",
        "coating_candidate",
        "other",
      ],
      transaction_type: [
        "purchase",
        "reward",
        "referral",
        "redemption",
        "welcome_bonus",
      ],
    },
  },
} as const
