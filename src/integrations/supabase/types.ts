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
      admin_notifications: {
        Row: {
          company_id: string | null
          contractor_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          read_by: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
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
          report_parsed_data: Json | null
          report_type: string | null
          report_uploaded_at: string | null
          report_uploaded_by: string | null
          report_url: string | null
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
          report_parsed_data?: Json | null
          report_type?: string | null
          report_uploaded_at?: string | null
          report_uploaded_by?: string | null
          report_url?: string | null
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
          report_parsed_data?: Json | null
          report_type?: string | null
          report_uploaded_at?: string | null
          report_uploaded_by?: string | null
          report_url?: string | null
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
      automation_rules: {
        Row: {
          action_label: string
          action_type: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          total_runs: number
          trigger_event: string
          trigger_label: string
          updated_at: string
        }
        Insert: {
          action_label: string
          action_type: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          total_runs?: number
          trigger_event: string
          trigger_label: string
          updated_at?: string
        }
        Update: {
          action_label?: string
          action_type?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          total_runs?: number
          trigger_event?: string
          trigger_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          code: string
          created_at: string | null
          criteria_type: string
          criteria_value: number | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean | null
          name: string
          points_awarded: number | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          criteria_type: string
          criteria_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name: string
          points_awarded?: number | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name?: string
          points_awarded?: number | null
          tier?: string | null
          updated_at?: string | null
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
      building_department_rules: {
        Row: {
          building_department_id: string | null
          city: string | null
          county: string
          created_at: string | null
          document_required: string | null
          id: string
          is_active: boolean | null
          permit_types: string[] | null
          priority: number | null
          rule_action: string | null
          rule_description: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          building_department_id?: string | null
          city?: string | null
          county: string
          created_at?: string | null
          document_required?: string | null
          id?: string
          is_active?: boolean | null
          permit_types?: string[] | null
          priority?: number | null
          rule_action?: string | null
          rule_description: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          building_department_id?: string | null
          city?: string | null
          county?: string
          created_at?: string | null
          document_required?: string | null
          id?: string
          is_active?: boolean | null
          permit_types?: string[] | null
          priority?: number | null
          rule_action?: string | null
          rule_description?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_department_rules_building_department_id_fkey"
            columns: ["building_department_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
        ]
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
      challenge_participants: {
        Row: {
          challenge_id: string
          company_id: string | null
          completed: boolean | null
          completed_at: string | null
          id: string
          joined_at: string | null
          progress: number | null
          reward_claimed: boolean | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          company_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          reward_claimed?: boolean | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          company_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          reward_claimed?: boolean | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_reward_id: string | null
          bonus_payout_percent: number | null
          challenge_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          starts_at: string
          target_metric: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          badge_reward_id?: string | null
          bonus_payout_percent?: number | null
          challenge_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          starts_at: string
          target_metric: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          badge_reward_id?: string | null
          bonus_payout_percent?: number | null
          challenge_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          starts_at?: string
          target_metric?: string
          target_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_badge_reward_id_fkey"
            columns: ["badge_reward_id"]
            isOneToOne: false
            referencedRelation: "badges"
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
      commission_rules: {
        Row: {
          bonus_percent: number | null
          bonus_threshold: number | null
          commission_percent: number
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          payment_schedule: string
          rep_name: string
          updated_at: string
        }
        Insert: {
          bonus_percent?: number | null
          bonus_threshold?: number | null
          commission_percent?: number
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          payment_schedule?: string
          rep_name: string
          updated_at?: string
        }
        Update: {
          bonus_percent?: number | null
          bonus_threshold?: number | null
          commission_percent?: number
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          payment_schedule?: string
          rep_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          banner_image_url: string | null
          bio_long: string | null
          bio_short: string | null
          certifications: Json | null
          city: string | null
          client_references: Json | null
          created_at: string | null
          created_by: string | null
          credential_warnings: Json | null
          description: string | null
          email: string | null
          has_crew: boolean | null
          id: string
          insurance_document_url: string | null
          insurance_expiration: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_active: boolean | null
          job_photos: Json | null
          license_expiration: string | null
          license_number: string | null
          license_state: string | null
          licenses: Json | null
          logo_url: string | null
          min_contract_value_out_of_area: number | null
          name: string
          payout_rules: Json | null
          phone: string | null
          primary_category: string | null
          services_offered: string[] | null
          social_links: Json | null
          state: string | null
          updated_at: string | null
          verification_score: number | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
          workers_comp_document_url: string | null
          workers_comp_expiration: string | null
          workers_comp_provider: string | null
          yearly_revenue_range: string | null
          years_in_business: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          banner_image_url?: string | null
          bio_long?: string | null
          bio_short?: string | null
          certifications?: Json | null
          city?: string | null
          client_references?: Json | null
          created_at?: string | null
          created_by?: string | null
          credential_warnings?: Json | null
          description?: string | null
          email?: string | null
          has_crew?: boolean | null
          id?: string
          insurance_document_url?: string | null
          insurance_expiration?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          job_photos?: Json | null
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          licenses?: Json | null
          logo_url?: string | null
          min_contract_value_out_of_area?: number | null
          name: string
          payout_rules?: Json | null
          phone?: string | null
          primary_category?: string | null
          services_offered?: string[] | null
          social_links?: Json | null
          state?: string | null
          updated_at?: string | null
          verification_score?: number | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          workers_comp_document_url?: string | null
          workers_comp_expiration?: string | null
          workers_comp_provider?: string | null
          yearly_revenue_range?: string | null
          years_in_business?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          banner_image_url?: string | null
          bio_long?: string | null
          bio_short?: string | null
          certifications?: Json | null
          city?: string | null
          client_references?: Json | null
          created_at?: string | null
          created_by?: string | null
          credential_warnings?: Json | null
          description?: string | null
          email?: string | null
          has_crew?: boolean | null
          id?: string
          insurance_document_url?: string | null
          insurance_expiration?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          job_photos?: Json | null
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          licenses?: Json | null
          logo_url?: string | null
          min_contract_value_out_of_area?: number | null
          name?: string
          payout_rules?: Json | null
          phone?: string | null
          primary_category?: string | null
          services_offered?: string[] | null
          social_links?: Json | null
          state?: string | null
          updated_at?: string | null
          verification_score?: number | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          workers_comp_document_url?: string | null
          workers_comp_expiration?: string | null
          workers_comp_provider?: string | null
          yearly_revenue_range?: string | null
          years_in_business?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_admins: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_super_admin: boolean | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_admins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_gamification: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          monthly_referrals: number | null
          rank_overall: number | null
          successful_referrals: number | null
          tier: string | null
          total_points: number | null
          total_referrals: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          monthly_referrals?: number | null
          rank_overall?: number | null
          successful_referrals?: number | null
          tier?: string | null
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          monthly_referrals?: number | null
          rank_overall?: number | null
          successful_referrals?: number | null
          tier?: string | null
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_gamification_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      company_resources: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          resource_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          resource_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          resource_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_communications: {
        Row: {
          comm_type: string
          company_id: string | null
          contact_id: string
          content: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          lead_id: string | null
          subject: string | null
        }
        Insert: {
          comm_type?: string
          company_id?: string | null
          contact_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Update: {
          comm_type?: string
          company_id?: string | null
          contact_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_documents: {
        Row: {
          company_id: string | null
          contact_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          lead_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      contractor_form_data: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contractor_profile_id: string | null
          created_at: string | null
          email: string | null
          fax: string | null
          id: string
          insurance_company: string | null
          insurance_expiration: string | null
          insurance_policy_number: string | null
          license_number: string | null
          license_state: string | null
          license_type: string | null
          phone: string | null
          qualifier_name: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          workers_comp_expiration: string | null
          workers_comp_policy: string | null
          workers_comp_provider: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contractor_profile_id?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiration?: string | null
          insurance_policy_number?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          workers_comp_expiration?: string | null
          workers_comp_policy?: string | null
          workers_comp_provider?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contractor_profile_id?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiration?: string | null
          insurance_policy_number?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          workers_comp_expiration?: string | null
          workers_comp_policy?: string | null
          workers_comp_provider?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_form_data_contractor_profile_id_fkey"
            columns: ["contractor_profile_id"]
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
          company_id: string | null
          company_name: string
          contractor_type: string | null
          created_at: string | null
          description: string | null
          email: string | null
          first_name: string | null
          google_business_url: string | null
          id: string
          insurance_info: Json | null
          is_directory_eligible: boolean | null
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
          team_id: string | null
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
          company_id?: string | null
          company_name: string
          contractor_type?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          google_business_url?: string | null
          id?: string
          insurance_info?: Json | null
          is_directory_eligible?: boolean | null
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
          team_id?: string | null
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
          company_id?: string | null
          company_name?: string
          contractor_type?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          google_business_url?: string | null
          id?: string
          insurance_info?: Json | null
          is_directory_eligible?: boolean | null
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
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_referrals: {
        Row: {
          accepted_by_customer: boolean | null
          assigned_contractor_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          customer_user_id: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          final_amount: number | null
          final_paid_at: string | null
          id: string
          invitation_accepted_at: string | null
          invitation_email_sent_at: string | null
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
          team_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_by_customer?: boolean | null
          assigned_contractor_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          final_amount?: number | null
          final_paid_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_email_sent_at?: string | null
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
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_by_customer?: boolean | null
          assigned_contractor_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          final_amount?: number | null
          final_paid_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_email_sent_at?: string | null
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
          team_id?: string | null
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
            foreignKeyName: "contractor_referrals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_referrals_referring_contractor_id_fkey"
            columns: ["referring_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_referrals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      crm_jobs: {
        Row: {
          assigned_crew_id: string | null
          assigned_rep_id: string | null
          collected_amount: number | null
          company_id: string | null
          completion_date: string | null
          contact_id: string | null
          contract_amount: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          job_number: string | null
          job_type: string | null
          lead_id: string | null
          notes: string | null
          priority: string | null
          property_id: string | null
          scheduled_date: string | null
          stage: string
          start_date: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_crew_id?: string | null
          assigned_rep_id?: string | null
          collected_amount?: number | null
          company_id?: string | null
          completion_date?: string | null
          contact_id?: string | null
          contract_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_number?: string | null
          job_type?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string | null
          property_id?: string | null
          scheduled_date?: string | null
          stage?: string
          start_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_crew_id?: string | null
          assigned_rep_id?: string | null
          collected_amount?: number | null
          company_id?: string | null
          completion_date?: string | null
          contact_id?: string | null
          contract_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_number?: string | null
          job_type?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string | null
          property_id?: string | null
          scheduled_date?: string | null
          stage?: string
          start_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_jobs_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_assigned_rep_id_fkey"
            columns: ["assigned_rep_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_production: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_date: string | null
          created_at: string | null
          id: string
          job_id: string
          notes: string | null
          phase: string
          scheduled_date: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          phase: string
          scheduled_date?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          phase?: string
          scheduled_date?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_production_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_production_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_production_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_source_websites: {
        Row: {
          crawl_depth: number
          crawl_status: string
          created_at: string
          created_by: string | null
          document_types: string[]
          documents_found: number
          error_message: string | null
          id: string
          is_active: boolean
          last_crawl_at: string | null
          name: string
          target_category: string
          updated_at: string
          url: string
          url_pattern: string | null
        }
        Insert: {
          crawl_depth?: number
          crawl_status?: string
          created_at?: string
          created_by?: string | null
          document_types?: string[]
          documents_found?: number
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_crawl_at?: string | null
          name: string
          target_category?: string
          updated_at?: string
          url: string
          url_pattern?: string | null
        }
        Update: {
          crawl_depth?: number
          crawl_status?: string
          created_at?: string
          created_by?: string | null
          document_types?: string[]
          documents_found?: number
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_crawl_at?: string | null
          name?: string
          target_category?: string
          updated_at?: string
          url?: string
          url_pattern?: string | null
        }
        Relationships: []
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
      door_knocks: {
        Row: {
          address: string | null
          appointment_date: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          disposition: Database["public"]["Enums"]["door_to_door_disposition"]
          dwell_time_seconds: number
          id: string
          lat: number
          lng: number
          notes: string | null
          points_awarded: number
          session_id: string
          user_id: string
        }
        Insert: {
          address?: string | null
          appointment_date?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          disposition: Database["public"]["Enums"]["door_to_door_disposition"]
          dwell_time_seconds?: number
          id?: string
          lat: number
          lng: number
          notes?: string | null
          points_awarded?: number
          session_id: string
          user_id: string
        }
        Update: {
          address?: string | null
          appointment_date?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          disposition?: Database["public"]["Enums"]["door_to_door_disposition"]
          dwell_time_seconds?: number
          id?: string
          lat?: number
          lng?: number
          notes?: string | null
          points_awarded?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_knocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_knocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      door_session_goals: {
        Row: {
          created_at: string
          goals_doors: number
          goals_leads: number
          id: string
          session_id: string
          user_id: string
          video_duration_seconds: number
          video_url: string
        }
        Insert: {
          created_at?: string
          goals_doors?: number
          goals_leads?: number
          id?: string
          session_id: string
          user_id: string
          video_duration_seconds?: number
          video_url: string
        }
        Update: {
          created_at?: string
          goals_doors?: number
          goals_leads?: number
          id?: string
          session_id?: string
          user_id?: string
          video_duration_seconds?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_session_goals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      door_to_door_stats: {
        Row: {
          current_streak_days: number
          id: string
          last_active_date: string | null
          longest_streak_days: number
          total_appointments: number
          total_contracts: number
          total_doors: number
          total_points: number
          total_sessions: number
          total_verifications: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak_days?: number
          id?: string
          last_active_date?: string | null
          longest_streak_days?: number
          total_appointments?: number
          total_contracts?: number
          total_doors?: number
          total_points?: number
          total_sessions?: number
          total_verifications?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak_days?: number
          id?: string
          last_active_date?: string | null
          longest_streak_days?: number
          total_appointments?: number
          total_contracts?: number
          total_doors?: number
          total_points?: number
          total_sessions?: number
          total_verifications?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_to_door_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          item_name: string
          quantity: number
          sort_order: number | null
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          item_name: string
          quantity: number
          sort_order?: number | null
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          item_name?: string
          quantity?: number
          sort_order?: number | null
          total?: number
          unit?: string | null
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
      estimate_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          labor_cost_per_sq: number
          material_cost_per_sq: number
          name: string
          trade: string
          waste_factor: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          labor_cost_per_sq?: number
          material_cost_per_sq?: number
          name: string
          trade?: string
          waste_factor?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          labor_cost_per_sq?: number
          material_cost_per_sq?: number
          name?: string
          trade?: string
          waste_factor?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount_amount: number | null
          estimate_number: string | null
          id: string
          labor_cost: number | null
          lead_id: string | null
          materials_cost: number | null
          measurement_id: string | null
          notes: string | null
          overhead_cost: number | null
          overhead_percent: number | null
          profit_percent: number | null
          quick_price_adjust_percent: number | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          template_id: string | null
          total: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          estimate_number?: string | null
          id?: string
          labor_cost?: number | null
          lead_id?: string | null
          materials_cost?: number | null
          measurement_id?: string | null
          notes?: string | null
          overhead_cost?: number | null
          overhead_percent?: number | null
          profit_percent?: number | null
          quick_price_adjust_percent?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          estimate_number?: string | null
          id?: string
          labor_cost?: number | null
          lead_id?: string | null
          materials_cost?: number | null
          measurement_id?: string | null
          notes?: string | null
          overhead_cost?: number | null
          overhead_percent?: number | null
          profit_percent?: number | null
          quick_price_adjust_percent?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "estimate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      fastener_patterns: {
        Row: {
          created_at: string
          deck_type: string | null
          fastener_for: string | null
          id: string
          is_hvhz: boolean | null
          jurisdiction_city: string | null
          jurisdiction_county: string
          nail_gauge: string | null
          nail_length: string | null
          nail_type: string | null
          nails_per_square: number | null
          notes: string | null
          product_approval_id: string | null
          roof_material: string | null
          source_document: string | null
          source_page: number | null
          spacing_description: string | null
          spacing_inches: number | null
          training_session_id: string | null
          updated_at: string
          zone_type: string | null
        }
        Insert: {
          created_at?: string
          deck_type?: string | null
          fastener_for?: string | null
          id?: string
          is_hvhz?: boolean | null
          jurisdiction_city?: string | null
          jurisdiction_county: string
          nail_gauge?: string | null
          nail_length?: string | null
          nail_type?: string | null
          nails_per_square?: number | null
          notes?: string | null
          product_approval_id?: string | null
          roof_material?: string | null
          source_document?: string | null
          source_page?: number | null
          spacing_description?: string | null
          spacing_inches?: number | null
          training_session_id?: string | null
          updated_at?: string
          zone_type?: string | null
        }
        Update: {
          created_at?: string
          deck_type?: string | null
          fastener_for?: string | null
          id?: string
          is_hvhz?: boolean | null
          jurisdiction_city?: string | null
          jurisdiction_county?: string
          nail_gauge?: string | null
          nail_length?: string | null
          nail_type?: string | null
          nails_per_square?: number | null
          notes?: string | null
          product_approval_id?: string | null
          roof_material?: string | null
          source_document?: string | null
          source_page?: number | null
          spacing_description?: string | null
          spacing_inches?: number | null
          training_session_id?: string | null
          updated_at?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fastener_patterns_product_approval_id_fkey"
            columns: ["product_approval_id"]
            isOneToOne: false
            referencedRelation: "product_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fastener_patterns_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "permit_packet_training"
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
      field_extraction_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_template_id: string | null
          current_template_name: string | null
          error_log: Json
          failed: number
          id: string
          processed: number
          scope_template_id: string | null
          started_at: string | null
          status: string
          succeeded: number
          template_ids: string[]
          total_templates: number
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_template_id?: string | null
          current_template_name?: string | null
          error_log?: Json
          failed?: number
          id?: string
          processed?: number
          scope_template_id?: string | null
          started_at?: string | null
          status?: string
          succeeded?: number
          template_ids?: string[]
          total_templates?: number
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_template_id?: string | null
          current_template_name?: string | null
          error_log?: Json
          failed?: number
          id?: string
          processed?: number
          scope_template_id?: string | null
          started_at?: string | null
          status?: string
          succeeded?: number
          template_ids?: string[]
          total_templates?: number
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
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
      field_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          goals_doors: number | null
          goals_leads: number | null
          id: string
          is_active: boolean
          route_geojson: Json | null
          started_at: string
          status: string | null
          storm_event_id: string | null
          total_doors: number
          total_points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          goals_doors?: number | null
          goals_leads?: number | null
          id?: string
          is_active?: boolean
          route_geojson?: Json | null
          started_at?: string
          status?: string | null
          storm_event_id?: string | null
          total_doors?: number
          total_points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          goals_doors?: number | null
          goals_leads?: number | null
          id?: string
          is_active?: boolean
          route_geojson?: Json | null
          started_at?: string
          status?: string | null
          storm_event_id?: string | null
          total_doors?: number
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_sessions_storm_event_id_fkey"
            columns: ["storm_event_id"]
            isOneToOne: false
            referencedRelation: "storm_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      firecrawl_crawl_jobs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          documents_converted: number | null
          documents_downloaded: number | null
          documents_found: number | null
          error_message: string | null
          firecrawl_job_id: string | null
          id: string
          job_type: string
          results_summary: Json | null
          started_at: string | null
          status: string
          target_department: string | null
          target_url: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          documents_converted?: number | null
          documents_downloaded?: number | null
          documents_found?: number | null
          error_message?: string | null
          firecrawl_job_id?: string | null
          id?: string
          job_type: string
          results_summary?: Json | null
          started_at?: string | null
          status?: string
          target_department?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          documents_converted?: number | null
          documents_downloaded?: number | null
          documents_found?: number | null
          error_message?: string | null
          firecrawl_job_id?: string | null
          id?: string
          job_type?: string
          results_summary?: Json | null
          started_at?: string | null
          status?: string
          target_department?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      firecrawl_discovered_documents: {
        Row: {
          content_markdown: string | null
          county: string | null
          crawl_job_id: string
          created_at: string
          department: string | null
          description: string | null
          document_type: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_converted_to_smart_doc: boolean | null
          is_downloaded: boolean | null
          metadata: Json | null
          smart_doc_id: string | null
          source_url: string | null
          storage_path: string | null
          title: string | null
        }
        Insert: {
          content_markdown?: string | null
          county?: string | null
          crawl_job_id: string
          created_at?: string
          department?: string | null
          description?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_converted_to_smart_doc?: boolean | null
          is_downloaded?: boolean | null
          metadata?: Json | null
          smart_doc_id?: string | null
          source_url?: string | null
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          content_markdown?: string | null
          county?: string | null
          crawl_job_id?: string
          created_at?: string
          department?: string | null
          description?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_converted_to_smart_doc?: boolean | null
          is_downloaded?: boolean | null
          metadata?: Json | null
          smart_doc_id?: string | null
          source_url?: string | null
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firecrawl_discovered_documents_crawl_job_id_fkey"
            columns: ["crawl_job_id"]
            isOneToOne: false
            referencedRelation: "firecrawl_crawl_jobs"
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
      inspection_checklists: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          items: Json
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      insurance_adjusters: {
        Row: {
          carrier_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          carrier_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          carrier_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_adjusters_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "insurance_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_adjusters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_carriers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          portal_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          portal_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          portal_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_carriers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      insurance_supplements: {
        Row: {
          amount_approved: number | null
          amount_requested: number | null
          claim_reference: string | null
          created_at: string | null
          date_submitted: string | null
          id: string
          notes: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_approved?: number | null
          amount_requested?: number | null
          claim_reference?: string | null
          created_at?: string | null
          date_submitted?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_approved?: number | null
          amount_requested?: number | null
          claim_reference?: string | null
          created_at?: string | null
          date_submitted?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_supplements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      job_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string | null
          description: string | null
          documents: Json | null
          expires_at: string | null
          homeowner_id: string
          id: string
          lat: number | null
          lng: number | null
          max_responses: number | null
          photos: Json | null
          property_address: string
          service_category: string
          state: string | null
          status: string | null
          timeline: string | null
          title: string
          updated_at: string | null
          urgency: string | null
          zip_code: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          expires_at?: string | null
          homeowner_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          max_responses?: number | null
          photos?: Json | null
          property_address: string
          service_category: string
          state?: string | null
          status?: string | null
          timeline?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
          zip_code?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          expires_at?: string | null
          homeowner_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          max_responses?: number | null
          photos?: Json | null
          property_address?: string
          service_category?: string
          state?: string | null
          status?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      job_responses: {
        Row: {
          available_start_date: string | null
          contractor_id: string
          created_at: string | null
          estimated_duration: string | null
          id: string
          job_id: string
          message: string | null
          proposed_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          available_start_date?: string | null
          contractor_id: string
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          job_id: string
          message?: string | null
          proposed_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          available_start_date?: string | null
          contractor_id?: string
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          job_id?: string
          message?: string | null
          proposed_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_responses_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_requests"
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
      jurisdiction_rules: {
        Row: {
          base_price: number | null
          building_dept_id: string | null
          common_rejection_reasons_json: Json | null
          complexity_multiplier: Json | null
          created_at: string | null
          fee_rules: string | null
          hvhz_required: boolean | null
          id: string
          is_active: boolean | null
          jurisdiction_county: string
          jurisdiction_name: string
          noa_required: boolean | null
          notes: string | null
          permit_type: string
          portal_url: string | null
          required_documents_json: Json | null
          required_fields_json: Json | null
          special_requirements_json: Json | null
          submission_method: string | null
          typical_turnaround_days: number | null
          updated_at: string | null
          wind_mitigation_required: boolean | null
        }
        Insert: {
          base_price?: number | null
          building_dept_id?: string | null
          common_rejection_reasons_json?: Json | null
          complexity_multiplier?: Json | null
          created_at?: string | null
          fee_rules?: string | null
          hvhz_required?: boolean | null
          id?: string
          is_active?: boolean | null
          jurisdiction_county: string
          jurisdiction_name: string
          noa_required?: boolean | null
          notes?: string | null
          permit_type: string
          portal_url?: string | null
          required_documents_json?: Json | null
          required_fields_json?: Json | null
          special_requirements_json?: Json | null
          submission_method?: string | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
          wind_mitigation_required?: boolean | null
        }
        Update: {
          base_price?: number | null
          building_dept_id?: string | null
          common_rejection_reasons_json?: Json | null
          complexity_multiplier?: Json | null
          created_at?: string | null
          fee_rules?: string | null
          hvhz_required?: boolean | null
          id?: string
          is_active?: boolean | null
          jurisdiction_county?: string
          jurisdiction_name?: string
          noa_required?: boolean | null
          notes?: string | null
          permit_type?: string
          portal_url?: string | null
          required_documents_json?: Json | null
          required_fields_json?: Json | null
          special_requirements_json?: Json | null
          submission_method?: string | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
          wind_mitigation_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_rules_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
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
          priority: string | null
          property_id: string
          qualification_notes: string | null
          roof_age: number | null
          roof_type: string | null
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
          priority?: string | null
          property_id: string
          qualification_notes?: string | null
          roof_age?: number | null
          roof_type?: string | null
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
          priority?: string | null
          property_id?: string
          qualification_notes?: string | null
          roof_age?: number | null
          roof_type?: string | null
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
      license_verifications: {
        Row: {
          concerns: string[] | null
          created_at: string
          id: string
          is_valid: boolean | null
          license_data: Json
          license_number: string
          license_type: string | null
          updated_at: string
          verified_at: string
        }
        Insert: {
          concerns?: string[] | null
          created_at?: string
          id?: string
          is_valid?: boolean | null
          license_data: Json
          license_number: string
          license_type?: string | null
          updated_at?: string
          verified_at: string
        }
        Update: {
          concerns?: string[] | null
          created_at?: string
          id?: string
          is_valid?: boolean | null
          license_data?: Json
          license_number?: string
          license_type?: string | null
          updated_at?: string
          verified_at?: string
        }
        Relationships: []
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
      maintenance_membership_waitlist: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          plan_interest: string | null
          property_address: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_interest?: string | null
          property_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_interest?: string | null
          property_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      material_orders: {
        Row: {
          actual_delivery_date: string | null
          company_id: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          job_id: string
          material_name: string
          notes: string | null
          quantity: number
          status: string
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          company_id?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          job_id: string
          material_name: string
          notes?: string | null
          quantity?: number
          status?: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          company_id?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          job_id?: string
          material_name?: string
          notes?: string | null
          quantity?: number
          status?: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
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
      measurement_reports: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          measurement_id: string
          report_data: Json | null
          share_token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          measurement_id: string
          report_data?: Json | null
          share_token?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          measurement_id?: string
          report_data?: Json | null
          share_token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurement_reports_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "roof_measurements"
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
      permit_addon_fees: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_percentage: boolean | null
          name: string
          price: number
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_percentage?: boolean | null
          name: string
          price: number
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_percentage?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
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
      permit_ai_knowledge: {
        Row: {
          city: string | null
          confidence: number | null
          created_at: string | null
          frequency: number | null
          id: string
          is_verified: boolean | null
          jurisdiction_county: string
          knowledge_type: string
          pattern_description: string
          source: string | null
          trade_type: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          city?: string | null
          confidence?: number | null
          created_at?: string | null
          frequency?: number | null
          id?: string
          is_verified?: boolean | null
          jurisdiction_county: string
          knowledge_type: string
          pattern_description: string
          source?: string | null
          trade_type?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          city?: string | null
          confidence?: number | null
          created_at?: string | null
          frequency?: number | null
          id?: string
          is_verified?: boolean | null
          jurisdiction_county?: string
          knowledge_type?: string
          pattern_description?: string
          source?: string | null
          trade_type?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      permit_building_departments: {
        Row: {
          address: string | null
          city: string | null
          county: string
          created_at: string | null
          email: string | null
          fax: string | null
          hours: string | null
          id: string
          is_hvhz: boolean | null
          jurisdiction_type: string
          name: string
          notes: string | null
          phone: string | null
          portal_url: string | null
          processing_time: string | null
          submission_method: string | null
          updated_at: string | null
          website: string | null
          zip_codes: string[] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county: string
          created_at?: string | null
          email?: string | null
          fax?: string | null
          hours?: string | null
          id?: string
          is_hvhz?: boolean | null
          jurisdiction_type?: string
          name: string
          notes?: string | null
          phone?: string | null
          portal_url?: string | null
          processing_time?: string | null
          submission_method?: string | null
          updated_at?: string | null
          website?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county?: string
          created_at?: string | null
          email?: string | null
          fax?: string | null
          hours?: string | null
          id?: string
          is_hvhz?: boolean | null
          jurisdiction_type?: string
          name?: string
          notes?: string | null
          phone?: string | null
          portal_url?: string | null
          processing_time?: string | null
          submission_method?: string | null
          updated_at?: string | null
          website?: string | null
          zip_codes?: string[] | null
        }
        Relationships: []
      }
      permit_chat_sessions: {
        Row: {
          context_snapshot: Json | null
          created_at: string | null
          id: string
          messages: Json | null
          permit_project_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          permit_project_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          permit_project_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_chat_sessions_permit_project_id_fkey"
            columns: ["permit_project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
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
      permit_department_documents: {
        Row: {
          building_dept_id: string
          created_at: string | null
          document_name: string
          document_url: string | null
          field_mapping: Json | null
          id: string
          is_required: boolean | null
          is_smart_doc: boolean | null
          notes: string | null
          sort_order: number | null
          template_id: string | null
          trade_type: string
          updated_at: string | null
        }
        Insert: {
          building_dept_id: string
          created_at?: string | null
          document_name: string
          document_url?: string | null
          field_mapping?: Json | null
          id?: string
          is_required?: boolean | null
          is_smart_doc?: boolean | null
          notes?: string | null
          sort_order?: number | null
          template_id?: string | null
          trade_type: string
          updated_at?: string | null
        }
        Update: {
          building_dept_id?: string
          created_at?: string | null
          document_name?: string
          document_url?: string | null
          field_mapping?: Json | null
          id?: string
          is_required?: boolean | null
          is_smart_doc?: boolean | null
          notes?: string | null
          sort_order?: number | null
          template_id?: string | null
          trade_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_department_documents_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_department_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "permit_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_document_library: {
        Row: {
          approval_number: string | null
          contractor_id: string | null
          created_at: string | null
          document_name: string
          document_type: string
          expiration_date: string | null
          file_path: string
          file_url: string
          id: string
          is_verified: boolean | null
          manufacturer: string | null
          notes: string | null
          product_name: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          approval_number?: string | null
          contractor_id?: string | null
          created_at?: string | null
          document_name: string
          document_type: string
          expiration_date?: string | null
          file_path: string
          file_url: string
          id?: string
          is_verified?: boolean | null
          manufacturer?: string | null
          notes?: string | null
          product_name?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          approval_number?: string | null
          contractor_id?: string | null
          created_at?: string | null
          document_name?: string
          document_type?: string
          expiration_date?: string | null
          file_path?: string
          file_url?: string
          id?: string
          is_verified?: boolean | null
          manufacturer?: string | null
          notes?: string | null
          product_name?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_document_library_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "permit_contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_field_mappings: {
        Row: {
          conditional_logic: Json | null
          county: string | null
          created_at: string | null
          default_value: string | null
          field_type: string | null
          id: string
          is_required: boolean | null
          notes: string | null
          our_field: string
          page_number: number | null
          pdf_field: string
          section: string | null
          template_id: string | null
          transform_function: string | null
          transform_type: string | null
          updated_at: string | null
          validation_pattern: string | null
        }
        Insert: {
          conditional_logic?: Json | null
          county?: string | null
          created_at?: string | null
          default_value?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          our_field: string
          page_number?: number | null
          pdf_field: string
          section?: string | null
          template_id?: string | null
          transform_function?: string | null
          transform_type?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Update: {
          conditional_logic?: Json | null
          county?: string | null
          created_at?: string | null
          default_value?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          our_field?: string
          page_number?: number | null
          pdf_field?: string
          section?: string | null
          template_id?: string | null
          transform_function?: string | null
          transform_type?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_field_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "permit_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_form_requirements: {
        Row: {
          building_dept_id: string
          conditions: Json
          created_at: string
          id: string
          notes: string | null
          permit_type: string
          priority: number
          required_template_ids: string[]
          updated_at: string
        }
        Insert: {
          building_dept_id: string
          conditions?: Json
          created_at?: string
          id?: string
          notes?: string | null
          permit_type: string
          priority?: number
          required_template_ids?: string[]
          updated_at?: string
        }
        Update: {
          building_dept_id?: string
          conditions?: Json
          created_at?: string
          id?: string
          notes?: string | null
          permit_type?: string
          priority?: number
          required_template_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_form_requirements_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_form_templates: {
        Row: {
          analysis_status: string | null
          building_dept_id: string | null
          category: string | null
          city: string | null
          common_errors: string[] | null
          conditional_logic: Json | null
          county: string | null
          created_at: string | null
          document_classification: string | null
          field_count: number | null
          field_mapping: Json | null
          file_path: string
          firecrawl_doc_id: string | null
          form_name: string
          form_type: string
          form_version: string | null
          hvhz_only: boolean | null
          id: string
          instructions: string | null
          is_fillable: boolean | null
          jurisdiction_id: string | null
          jurisdiction_name: string
          last_analyzed_at: string | null
          material_type: string | null
          notary_threshold: number | null
          notes: string | null
          page_count: number | null
          requires_notary: boolean | null
          requires_signature: boolean | null
          sections_required: Json | null
          signature_fields: Json | null
          signature_locations: Json | null
          source: string | null
          trade_types: string[] | null
          updated_at: string | null
        }
        Insert: {
          analysis_status?: string | null
          building_dept_id?: string | null
          category?: string | null
          city?: string | null
          common_errors?: string[] | null
          conditional_logic?: Json | null
          county?: string | null
          created_at?: string | null
          document_classification?: string | null
          field_count?: number | null
          field_mapping?: Json | null
          file_path: string
          firecrawl_doc_id?: string | null
          form_name: string
          form_type: string
          form_version?: string | null
          hvhz_only?: boolean | null
          id?: string
          instructions?: string | null
          is_fillable?: boolean | null
          jurisdiction_id?: string | null
          jurisdiction_name: string
          last_analyzed_at?: string | null
          material_type?: string | null
          notary_threshold?: number | null
          notes?: string | null
          page_count?: number | null
          requires_notary?: boolean | null
          requires_signature?: boolean | null
          sections_required?: Json | null
          signature_fields?: Json | null
          signature_locations?: Json | null
          source?: string | null
          trade_types?: string[] | null
          updated_at?: string | null
        }
        Update: {
          analysis_status?: string | null
          building_dept_id?: string | null
          category?: string | null
          city?: string | null
          common_errors?: string[] | null
          conditional_logic?: Json | null
          county?: string | null
          created_at?: string | null
          document_classification?: string | null
          field_count?: number | null
          field_mapping?: Json | null
          file_path?: string
          firecrawl_doc_id?: string | null
          form_name?: string
          form_type?: string
          form_version?: string | null
          hvhz_only?: boolean | null
          id?: string
          instructions?: string | null
          is_fillable?: boolean | null
          jurisdiction_id?: string | null
          jurisdiction_name?: string
          last_analyzed_at?: string | null
          material_type?: string | null
          notary_threshold?: number | null
          notes?: string | null
          page_count?: number | null
          requires_notary?: boolean | null
          requires_signature?: boolean | null
          sections_required?: Json | null
          signature_fields?: Json | null
          signature_locations?: Json | null
          source?: string | null
          trade_types?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_form_templates_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_form_templates_firecrawl_doc_id_fkey"
            columns: ["firecrawl_doc_id"]
            isOneToOne: false
            referencedRelation: "firecrawl_discovered_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_form_templates_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_inspections: {
        Row: {
          category: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          inspection_code: string | null
          inspection_type: string
          inspector_id: string | null
          inspector_name: string | null
          is_required: boolean | null
          order_in_sequence: number | null
          permit_project_id: string | null
          prerequisites: string[] | null
          result: string | null
          result_notes: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          seq_id: number
          training_session_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspection_code?: string | null
          inspection_type: string
          inspector_id?: string | null
          inspector_name?: string | null
          is_required?: boolean | null
          order_in_sequence?: number | null
          permit_project_id?: string | null
          prerequisites?: string[] | null
          result?: string | null
          result_notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          seq_id: number
          training_session_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspection_code?: string | null
          inspection_type?: string
          inspector_id?: string | null
          inspector_name?: string | null
          is_required?: boolean | null
          order_in_sequence?: number | null
          permit_project_id?: string | null
          prerequisites?: string[] | null
          result?: string | null
          result_notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          seq_id?: number
          training_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_inspections_permit_project_id_fkey"
            columns: ["permit_project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_inspections_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "permit_packet_training"
            referencedColumns: ["id"]
          },
        ]
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
      permit_messages: {
        Row: {
          attachments_json: Json | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_read: boolean | null
          message_type: string | null
          permit_request_id: string | null
          sender_name: string | null
          sender_role: string | null
          user_id: string | null
        }
        Insert: {
          attachments_json?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          permit_request_id?: string | null
          sender_name?: string | null
          sender_role?: string | null
          user_id?: string | null
        }
        Update: {
          attachments_json?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          permit_request_id?: string | null
          sender_name?: string | null
          sender_role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_messages_permit_request_id_fkey"
            columns: ["permit_request_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_notifications: {
        Row: {
          channel: string
          contractor_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_body: string | null
          message_title: string | null
          message_type: string
          permit_request_id: string | null
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string
          contractor_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          message_title?: string | null
          message_type: string
          permit_request_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          contractor_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          message_title?: string | null
          message_type?: string
          permit_request_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_notifications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_notifications_permit_request_id_fkey"
            columns: ["permit_request_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_packet_structures: {
        Row: {
          city: string | null
          conditional_documents: Json | null
          county: string
          created_at: string | null
          document_structure: Json
          id: string
          is_active: boolean | null
          is_hvhz: boolean | null
          material_type: string | null
          notes: string | null
          recording_requirements: Json | null
          signature_requirements: Json | null
          trade_type: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          conditional_documents?: Json | null
          county: string
          created_at?: string | null
          document_structure: Json
          id?: string
          is_active?: boolean | null
          is_hvhz?: boolean | null
          material_type?: string | null
          notes?: string | null
          recording_requirements?: Json | null
          signature_requirements?: Json | null
          trade_type: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          conditional_documents?: Json | null
          county?: string
          created_at?: string | null
          document_structure?: Json
          id?: string
          is_active?: boolean | null
          is_hvhz?: boolean | null
          material_type?: string | null
          notes?: string | null
          recording_requirements?: Json | null
          signature_requirements?: Json | null
          trade_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_packet_training: {
        Row: {
          admin_notes: string | null
          admin_verified: boolean | null
          auto_detected: boolean | null
          batch_id: string | null
          city: string | null
          county: string
          created_at: string | null
          detected_from: string[] | null
          detection_confidence: Json | null
          example_description: string | null
          extracted_documents: Json | null
          extracted_fields: Json | null
          file_url: string | null
          id: string
          is_hvhz: boolean | null
          mappings_learned: number | null
          material_type: string | null
          packet_structure: Json
          page_count: number | null
          processed_at: string | null
          processing_status: string | null
          products_extracted: number | null
          quality_score: number | null
          raw_text_content: string | null
          rules_discovered: number | null
          source_file_name: string | null
          trade_type: string
          training_usage_count: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_verified?: boolean | null
          auto_detected?: boolean | null
          batch_id?: string | null
          city?: string | null
          county: string
          created_at?: string | null
          detected_from?: string[] | null
          detection_confidence?: Json | null
          example_description?: string | null
          extracted_documents?: Json | null
          extracted_fields?: Json | null
          file_url?: string | null
          id?: string
          is_hvhz?: boolean | null
          mappings_learned?: number | null
          material_type?: string | null
          packet_structure: Json
          page_count?: number | null
          processed_at?: string | null
          processing_status?: string | null
          products_extracted?: number | null
          quality_score?: number | null
          raw_text_content?: string | null
          rules_discovered?: number | null
          source_file_name?: string | null
          trade_type: string
          training_usage_count?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_verified?: boolean | null
          auto_detected?: boolean | null
          batch_id?: string | null
          city?: string | null
          county?: string
          created_at?: string | null
          detected_from?: string[] | null
          detection_confidence?: Json | null
          example_description?: string | null
          extracted_documents?: Json | null
          extracted_fields?: Json | null
          file_url?: string | null
          id?: string
          is_hvhz?: boolean | null
          mappings_learned?: number | null
          material_type?: string | null
          packet_structure?: Json
          page_count?: number | null
          processed_at?: string | null
          processing_status?: string | null
          products_extracted?: number | null
          quality_score?: number | null
          raw_text_content?: string | null
          rules_discovered?: number | null
          source_file_name?: string | null
          trade_type?: string
          training_usage_count?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_packet_training_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "permit_training_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_packet_versions: {
        Row: {
          change_notes: string | null
          changes_from_previous: Json | null
          created_at: string
          document_count: number | null
          generated_at: string
          generated_by: string | null
          id: string
          packet_size_bytes: number | null
          packet_url: string
          permit_project_id: string | null
          result: string | null
          result_date: string | null
          result_notes: string | null
          reviewer_name: string | null
          submission_date: string | null
          submission_method: string | null
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          changes_from_previous?: Json | null
          created_at?: string
          document_count?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          packet_size_bytes?: number | null
          packet_url: string
          permit_project_id?: string | null
          result?: string | null
          result_date?: string | null
          result_notes?: string | null
          reviewer_name?: string | null
          submission_date?: string | null
          submission_method?: string | null
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          changes_from_previous?: Json | null
          created_at?: string
          document_count?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          packet_size_bytes?: number | null
          packet_url?: string
          permit_project_id?: string | null
          result?: string | null
          result_date?: string | null
          result_notes?: string | null
          reviewer_name?: string | null
          submission_date?: string | null
          submission_method?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "permit_packet_versions_permit_project_id_fkey"
            columns: ["permit_project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_packets: {
        Row: {
          ai_notes: string | null
          cover_sheet_html: string | null
          created_at: string | null
          document_count: number | null
          document_index: Json | null
          documents_included: Json | null
          file_path: string | null
          generated_by: string | null
          id: string
          packet_type: string | null
          permit_request_id: string | null
          status: string | null
          submitted_at: string | null
          total_pages: number | null
          updated_at: string | null
        }
        Insert: {
          ai_notes?: string | null
          cover_sheet_html?: string | null
          created_at?: string | null
          document_count?: number | null
          document_index?: Json | null
          documents_included?: Json | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          packet_type?: string | null
          permit_request_id?: string | null
          status?: string | null
          submitted_at?: string | null
          total_pages?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_notes?: string | null
          cover_sheet_html?: string | null
          created_at?: string | null
          document_count?: number | null
          document_index?: Json | null
          documents_included?: Json | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          packet_type?: string | null
          permit_request_id?: string | null
          status?: string | null
          submitted_at?: string | null
          total_pages?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_packets_permit_request_id_fkey"
            columns: ["permit_request_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_pricing_tiers: {
        Row: {
          base_price: number
          code: string
          created_at: string | null
          criteria_json: Json | null
          description: string | null
          features_json: Json | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          turnaround_days: number | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          code: string
          created_at?: string | null
          criteria_json?: Json | null
          description?: string | null
          features_json?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          turnaround_days?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          code?: string
          created_at?: string | null
          criteria_json?: Json | null
          description?: string | null
          features_json?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          turnaround_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_project_documents: {
        Row: {
          ai_analysis_json: Json | null
          created_at: string
          document_type: string
          extracted_data: Json | null
          extracted_text: string | null
          fields_populated: string[] | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notarization_session_url: string | null
          notarization_status: string | null
          notarization_type: string | null
          notarized_at: string | null
          notary_name: string | null
          processing_status: string | null
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          validation_notes: string | null
          validation_status: string | null
        }
        Insert: {
          ai_analysis_json?: Json | null
          created_at?: string
          document_type: string
          extracted_data?: Json | null
          extracted_text?: string | null
          fields_populated?: string[] | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notarization_session_url?: string | null
          notarization_status?: string | null
          notarization_type?: string | null
          notarized_at?: string | null
          notary_name?: string | null
          processing_status?: string | null
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
        }
        Update: {
          ai_analysis_json?: Json | null
          created_at?: string
          document_type?: string
          extracted_data?: Json | null
          extracted_text?: string | null
          fields_populated?: string[] | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notarization_session_url?: string | null
          notarization_status?: string | null
          notarization_type?: string | null
          notarized_at?: string | null
          notary_name?: string | null
          processing_status?: string | null
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
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
          after_hours: boolean | null
          ai_analysis_json: Json | null
          ai_analysis_timestamp: string | null
          ai_confidence_score: number | null
          ai_risk_factors: Json | null
          ai_suggested_actions: Json | null
          architectural_approval: boolean | null
          architectural_approval_required: boolean | null
          assigned_expediter_id: string | null
          bond_amount: string | null
          building_dept_id: string | null
          building_type: string | null
          city: string | null
          city_review_status: string | null
          city_submission_date: string | null
          completion_percentage: number | null
          complexity_tier: string | null
          contractor_id: string | null
          contractor_profile_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          deck_attachment_confirmed: boolean | null
          deck_type: string | null
          door_count: number | null
          door_noa: string | null
          door_product: string | null
          energy_code_compliant: boolean | null
          engineer_required: boolean | null
          existing_roof_material: string | null
          expedited: boolean | null
          fastener_noa: string | null
          fastener_pattern_confirmed: boolean | null
          fastener_product: string | null
          fee_actual: number | null
          fee_estimate: number | null
          flood_zone: string | null
          folio_number: string | null
          frame_material: string | null
          generated_document_paths: string[] | null
          generated_forms: Json | null
          has_exposed_ceilings: boolean | null
          has_hurricane_straps: boolean | null
          has_ponding_water: boolean | null
          hoa_approval: boolean | null
          hvhz_protocol: string | null
          id: string
          improvement_description: string | null
          inspection_requested: string | null
          inspection_requested_at: string | null
          is_hvhz: boolean | null
          jurisdiction_county: string | null
          legal_description: string | null
          lender_address: string | null
          lender_name: string | null
          license_numbers_json: Json | null
          missing_items_json: Json | null
          new_roof_material: string | null
          notes: string | null
          obstacles: string | null
          owner_address: string | null
          owner_city: string | null
          owner_email: string | null
          owner_fax: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_state: string | null
          owner_zip: string | null
          packet_status: string | null
          packet_url: string | null
          parcel_id: string | null
          payment_link: string | null
          payment_status: string | null
          permit_type: string | null
          pipeline_status: string | null
          property_address: string
          ready_for_payment_notified_at: string | null
          requires_overflow_scuppers: boolean | null
          revision_notes: string | null
          revision_requested: boolean | null
          roof_accessories: string | null
          roof_color: string | null
          roof_covering_noa: string | null
          roof_covering_product: string | null
          roof_pitch: string | null
          roof_size_sqft: number | null
          roof_stories: number | null
          roof_type: string | null
          roof_work_type: string | null
          scope_description: string | null
          selected_products: Json | null
          service_type: string
          shgc: string | null
          sliding_door_count: number | null
          square_footage: number | null
          state: string | null
          status: string
          stripe_session_id: string | null
          structured_scope_json: Json | null
          surety_name: string | null
          trade_data: Json | null
          u_factor: string | null
          underlayment_noa: string | null
          underlayment_product: string | null
          underlayment_type: string | null
          updated_at: string
          user_id: string
          valuation: number | null
          wind_speed_zone: string | null
          window_count: number | null
          window_noa: string | null
          window_product: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          after_hours?: boolean | null
          ai_analysis_json?: Json | null
          ai_analysis_timestamp?: string | null
          ai_confidence_score?: number | null
          ai_risk_factors?: Json | null
          ai_suggested_actions?: Json | null
          architectural_approval?: boolean | null
          architectural_approval_required?: boolean | null
          assigned_expediter_id?: string | null
          bond_amount?: string | null
          building_dept_id?: string | null
          building_type?: string | null
          city?: string | null
          city_review_status?: string | null
          city_submission_date?: string | null
          completion_percentage?: number | null
          complexity_tier?: string | null
          contractor_id?: string | null
          contractor_profile_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          deck_attachment_confirmed?: boolean | null
          deck_type?: string | null
          door_count?: number | null
          door_noa?: string | null
          door_product?: string | null
          energy_code_compliant?: boolean | null
          engineer_required?: boolean | null
          existing_roof_material?: string | null
          expedited?: boolean | null
          fastener_noa?: string | null
          fastener_pattern_confirmed?: boolean | null
          fastener_product?: string | null
          fee_actual?: number | null
          fee_estimate?: number | null
          flood_zone?: string | null
          folio_number?: string | null
          frame_material?: string | null
          generated_document_paths?: string[] | null
          generated_forms?: Json | null
          has_exposed_ceilings?: boolean | null
          has_hurricane_straps?: boolean | null
          has_ponding_water?: boolean | null
          hoa_approval?: boolean | null
          hvhz_protocol?: string | null
          id?: string
          improvement_description?: string | null
          inspection_requested?: string | null
          inspection_requested_at?: string | null
          is_hvhz?: boolean | null
          jurisdiction_county?: string | null
          legal_description?: string | null
          lender_address?: string | null
          lender_name?: string | null
          license_numbers_json?: Json | null
          missing_items_json?: Json | null
          new_roof_material?: string | null
          notes?: string | null
          obstacles?: string | null
          owner_address?: string | null
          owner_city?: string | null
          owner_email?: string | null
          owner_fax?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_state?: string | null
          owner_zip?: string | null
          packet_status?: string | null
          packet_url?: string | null
          parcel_id?: string | null
          payment_link?: string | null
          payment_status?: string | null
          permit_type?: string | null
          pipeline_status?: string | null
          property_address: string
          ready_for_payment_notified_at?: string | null
          requires_overflow_scuppers?: boolean | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          roof_accessories?: string | null
          roof_color?: string | null
          roof_covering_noa?: string | null
          roof_covering_product?: string | null
          roof_pitch?: string | null
          roof_size_sqft?: number | null
          roof_stories?: number | null
          roof_type?: string | null
          roof_work_type?: string | null
          scope_description?: string | null
          selected_products?: Json | null
          service_type: string
          shgc?: string | null
          sliding_door_count?: number | null
          square_footage?: number | null
          state?: string | null
          status?: string
          stripe_session_id?: string | null
          structured_scope_json?: Json | null
          surety_name?: string | null
          trade_data?: Json | null
          u_factor?: string | null
          underlayment_noa?: string | null
          underlayment_product?: string | null
          underlayment_type?: string | null
          updated_at?: string
          user_id: string
          valuation?: number | null
          wind_speed_zone?: string | null
          window_count?: number | null
          window_noa?: string | null
          window_product?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          after_hours?: boolean | null
          ai_analysis_json?: Json | null
          ai_analysis_timestamp?: string | null
          ai_confidence_score?: number | null
          ai_risk_factors?: Json | null
          ai_suggested_actions?: Json | null
          architectural_approval?: boolean | null
          architectural_approval_required?: boolean | null
          assigned_expediter_id?: string | null
          bond_amount?: string | null
          building_dept_id?: string | null
          building_type?: string | null
          city?: string | null
          city_review_status?: string | null
          city_submission_date?: string | null
          completion_percentage?: number | null
          complexity_tier?: string | null
          contractor_id?: string | null
          contractor_profile_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          deck_attachment_confirmed?: boolean | null
          deck_type?: string | null
          door_count?: number | null
          door_noa?: string | null
          door_product?: string | null
          energy_code_compliant?: boolean | null
          engineer_required?: boolean | null
          existing_roof_material?: string | null
          expedited?: boolean | null
          fastener_noa?: string | null
          fastener_pattern_confirmed?: boolean | null
          fastener_product?: string | null
          fee_actual?: number | null
          fee_estimate?: number | null
          flood_zone?: string | null
          folio_number?: string | null
          frame_material?: string | null
          generated_document_paths?: string[] | null
          generated_forms?: Json | null
          has_exposed_ceilings?: boolean | null
          has_hurricane_straps?: boolean | null
          has_ponding_water?: boolean | null
          hoa_approval?: boolean | null
          hvhz_protocol?: string | null
          id?: string
          improvement_description?: string | null
          inspection_requested?: string | null
          inspection_requested_at?: string | null
          is_hvhz?: boolean | null
          jurisdiction_county?: string | null
          legal_description?: string | null
          lender_address?: string | null
          lender_name?: string | null
          license_numbers_json?: Json | null
          missing_items_json?: Json | null
          new_roof_material?: string | null
          notes?: string | null
          obstacles?: string | null
          owner_address?: string | null
          owner_city?: string | null
          owner_email?: string | null
          owner_fax?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_state?: string | null
          owner_zip?: string | null
          packet_status?: string | null
          packet_url?: string | null
          parcel_id?: string | null
          payment_link?: string | null
          payment_status?: string | null
          permit_type?: string | null
          pipeline_status?: string | null
          property_address?: string
          ready_for_payment_notified_at?: string | null
          requires_overflow_scuppers?: boolean | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          roof_accessories?: string | null
          roof_color?: string | null
          roof_covering_noa?: string | null
          roof_covering_product?: string | null
          roof_pitch?: string | null
          roof_size_sqft?: number | null
          roof_stories?: number | null
          roof_type?: string | null
          roof_work_type?: string | null
          scope_description?: string | null
          selected_products?: Json | null
          service_type?: string
          shgc?: string | null
          sliding_door_count?: number | null
          square_footage?: number | null
          state?: string | null
          status?: string
          stripe_session_id?: string | null
          structured_scope_json?: Json | null
          surety_name?: string | null
          trade_data?: Json | null
          u_factor?: string | null
          underlayment_noa?: string | null
          underlayment_product?: string | null
          underlayment_type?: string | null
          updated_at?: string
          user_id?: string
          valuation?: number | null
          wind_speed_zone?: string | null
          window_count?: number | null
          window_noa?: string | null
          window_product?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_projects_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_projects_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "permit_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_projects_contractor_profile_id_fkey"
            columns: ["contractor_profile_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_rejections: {
        Row: {
          admin_notes: string | null
          admin_reviewed: boolean | null
          ai_extracted_rule: string | null
          ai_suggested_action: string | null
          created_at: string | null
          id: string
          jurisdiction_city: string | null
          jurisdiction_county: string
          permit_project_id: string | null
          rejection_category: string | null
          rejection_reason: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          trade: string
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          ai_extracted_rule?: string | null
          ai_suggested_action?: string | null
          created_at?: string | null
          id?: string
          jurisdiction_city?: string | null
          jurisdiction_county: string
          permit_project_id?: string | null
          rejection_category?: string | null
          rejection_reason: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          trade: string
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          ai_extracted_rule?: string | null
          ai_suggested_action?: string | null
          created_at?: string | null
          id?: string
          jurisdiction_city?: string | null
          jurisdiction_county?: string
          permit_project_id?: string | null
          rejection_category?: string | null
          rejection_reason?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          trade?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_rejections_permit_project_id_fkey"
            columns: ["permit_project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
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
      permit_required_info: {
        Row: {
          ai_extractable: boolean | null
          building_dept_id: string
          created_at: string | null
          example_value: string | null
          field_key: string | null
          id: string
          info_description: string | null
          info_name: string
          info_type: string
          is_required: boolean | null
          sort_order: number | null
          trade_type: string
        }
        Insert: {
          ai_extractable?: boolean | null
          building_dept_id: string
          created_at?: string | null
          example_value?: string | null
          field_key?: string | null
          id?: string
          info_description?: string | null
          info_name: string
          info_type: string
          is_required?: boolean | null
          sort_order?: number | null
          trade_type: string
        }
        Update: {
          ai_extractable?: boolean | null
          building_dept_id?: string
          created_at?: string | null
          example_value?: string | null
          field_key?: string | null
          id?: string
          info_description?: string | null
          info_name?: string
          info_type?: string
          is_required?: boolean | null
          sort_order?: number | null
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_required_info_building_dept_id_fkey"
            columns: ["building_dept_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_resources: {
        Row: {
          content_html: string | null
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean | null
          jurisdiction_city: string | null
          jurisdiction_county: string | null
          resource_type: string
          sort_order: number | null
          tags: string[] | null
          title: string
          trade: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          jurisdiction_city?: string | null
          jurisdiction_county?: string | null
          resource_type: string
          sort_order?: number | null
          tags?: string[] | null
          title: string
          trade?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          jurisdiction_city?: string | null
          jurisdiction_county?: string | null
          resource_type?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          trade?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      permit_status_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          new_status: string
          note: string | null
          permit_request_id: string | null
          previous_status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_status: string
          note?: string | null
          permit_request_id?: string | null
          previous_status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_status?: string
          note?: string | null
          permit_request_id?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_status_events_permit_request_id_fkey"
            columns: ["permit_request_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_training_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_files: number
          id: string
          processed_files: number
          status: string
          total_files: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_files?: number
          id?: string
          processed_files?: number
          status?: string
          total_files?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_files?: number
          id?: string
          processed_files?: number
          status?: string
          total_files?: number
        }
        Relationships: []
      }
      permit_training_books: {
        Row: {
          author: string | null
          category: string
          created_at: string | null
          description: string | null
          extracted_chapters: Json | null
          extracted_text: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          knowledge_items_extracted: number | null
          page_count: number | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          target_county: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          author?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          extracted_chapters?: Json | null
          extracted_text?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          knowledge_items_extracted?: number | null
          page_count?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          target_county?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          extracted_chapters?: Json | null
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          knowledge_items_extracted?: number | null
          page_count?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          target_county?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      permit_training_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          ocr_text: string | null
          page_count: number | null
          training_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          ocr_text?: string | null
          page_count?: number | null
          training_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          ocr_text?: string | null
          page_count?: number | null
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_training_files_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "permit_packet_training"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_types: {
        Row: {
          base_fee: number | null
          created_at: string | null
          description: string | null
          display_name: string
          engineering_threshold: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          requires_engineer: boolean | null
          requires_noc: boolean | null
          sort_order: number | null
          subtype: string | null
          trade: string
        }
        Insert: {
          base_fee?: number | null
          created_at?: string | null
          description?: string | null
          display_name: string
          engineering_threshold?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          requires_engineer?: boolean | null
          requires_noc?: boolean | null
          sort_order?: number | null
          subtype?: string | null
          trade: string
        }
        Update: {
          base_fee?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          engineering_threshold?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          requires_engineer?: boolean | null
          requires_noc?: boolean | null
          sort_order?: number | null
          subtype?: string | null
          trade?: string
        }
        Relationships: []
      }
      piq_api_configs: {
        Row: {
          api_description: string | null
          api_key: string
          api_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_description?: string | null
          api_key: string
          api_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_description?: string | null
          api_key?: string
          api_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      piq_building_components: {
        Row: {
          component_type: string | null
          condition: string | null
          estimated_life: number | null
          id: string
          install_year: number | null
          material: string | null
          property_id: string | null
        }
        Insert: {
          component_type?: string | null
          condition?: string | null
          estimated_life?: number | null
          id?: string
          install_year?: number | null
          material?: string | null
          property_id?: string | null
        }
        Update: {
          component_type?: string | null
          condition?: string | null
          estimated_life?: number | null
          id?: string
          install_year?: number | null
          material?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_building_components_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_code_violations: {
        Row: {
          description: string | null
          filed_date: string | null
          id: string
          property_id: string | null
          status: string | null
          violation_code: string | null
        }
        Insert: {
          description?: string | null
          filed_date?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
          violation_code?: string | null
        }
        Update: {
          description?: string | null
          filed_date?: string | null
          id?: string
          property_id?: string | null
          status?: string | null
          violation_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_code_violations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_companies: {
        Row: {
          company_name: string | null
          formation_date: string | null
          id: string
          owner_id: string | null
          registered_agent: string | null
          registration_number: string | null
          state_registered: string | null
          status: string | null
          sunbiz_url: string | null
        }
        Insert: {
          company_name?: string | null
          formation_date?: string | null
          id?: string
          owner_id?: string | null
          registered_agent?: string | null
          registration_number?: string | null
          state_registered?: string | null
          status?: string | null
          sunbiz_url?: string | null
        }
        Update: {
          company_name?: string | null
          formation_date?: string | null
          id?: string
          owner_id?: string | null
          registered_agent?: string | null
          registration_number?: string | null
          state_registered?: string | null
          status?: string | null
          sunbiz_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "piq_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_contractor_opportunities: {
        Row: {
          description: string | null
          id: string
          opportunity_type: string | null
          priority: string | null
          property_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          opportunity_type?: string | null
          priority?: string | null
          property_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          opportunity_type?: string | null
          priority?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_contractor_opportunities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_owner_portfolios: {
        Row: {
          id: string
          owner_id: string | null
          states: string[] | null
          total_properties: number | null
          total_sqft: number | null
          total_value: number | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          states?: string[] | null
          total_properties?: number | null
          total_sqft?: number | null
          total_value?: number | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          states?: string[] | null
          total_properties?: number | null
          total_sqft?: number | null
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_owner_portfolios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "piq_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_owners: {
        Row: {
          email: string | null
          facebook_url: string | null
          id: string
          linkedin_url: string | null
          mailing_address: string | null
          name: string
          owner_type: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          email?: string | null
          facebook_url?: string | null
          id?: string
          linkedin_url?: string | null
          mailing_address?: string | null
          name: string
          owner_type?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          email?: string | null
          facebook_url?: string | null
          id?: string
          linkedin_url?: string | null
          mailing_address?: string | null
          name?: string
          owner_type?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      piq_permits: {
        Row: {
          contractor: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          issue_date: string | null
          permit_number: string | null
          permit_type: string | null
          property_id: string | null
          status: string | null
        }
        Insert: {
          contractor?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          issue_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          property_id?: string | null
          status?: string | null
        }
        Update: {
          contractor?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          issue_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_permits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_properties: {
        Row: {
          address: string
          assessed_value: number | null
          building_sqft: number | null
          city: string
          construction_type: string | null
          created_at: string | null
          estimated_value: number | null
          flood_zone: string | null
          id: string
          latitude: number | null
          longitude: number | null
          lot_sqft: number | null
          occupancy_status: string | null
          parcel_id: string | null
          property_manager: string | null
          property_type: string | null
          state: string
          stories: number | null
          updated_at: string | null
          year_built: number | null
          zip: string | null
          zoning: string | null
        }
        Insert: {
          address: string
          assessed_value?: number | null
          building_sqft?: number | null
          city: string
          construction_type?: string | null
          created_at?: string | null
          estimated_value?: number | null
          flood_zone?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_sqft?: number | null
          occupancy_status?: string | null
          parcel_id?: string | null
          property_manager?: string | null
          property_type?: string | null
          state: string
          stories?: number | null
          updated_at?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Update: {
          address?: string
          assessed_value?: number | null
          building_sqft?: number | null
          city?: string
          construction_type?: string | null
          created_at?: string | null
          estimated_value?: number | null
          flood_zone?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_sqft?: number | null
          occupancy_status?: string | null
          parcel_id?: string | null
          property_manager?: string | null
          property_type?: string | null
          state?: string
          stories?: number | null
          updated_at?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Relationships: []
      }
      piq_property_ownership: {
        Row: {
          id: string
          is_current: boolean | null
          owner_id: string | null
          ownership_percent: number | null
          property_id: string | null
        }
        Insert: {
          id?: string
          is_current?: boolean | null
          owner_id?: string | null
          ownership_percent?: number | null
          property_id?: string | null
        }
        Update: {
          id?: string
          is_current?: boolean | null
          owner_id?: string | null
          ownership_percent?: number | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_property_ownership_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "piq_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piq_property_ownership_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_property_sales: {
        Row: {
          buyer: string | null
          id: string
          lender: string | null
          property_id: string | null
          sale_date: string | null
          sale_price: number | null
          seller: string | null
        }
        Insert: {
          buyer?: string | null
          id?: string
          lender?: string | null
          property_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          seller?: string | null
        }
        Update: {
          buyer?: string | null
          id?: string
          lender?: string | null
          property_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          seller?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_property_sales_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_property_scores: {
        Row: {
          id: string
          investment_score: number | null
          last_calculated: string | null
          overall_contractor_score: number | null
          property_id: string | null
          renovation_score: number | null
          roof_replacement_score: number | null
        }
        Insert: {
          id?: string
          investment_score?: number | null
          last_calculated?: string | null
          overall_contractor_score?: number | null
          property_id?: string | null
          renovation_score?: number | null
          roof_replacement_score?: number | null
        }
        Update: {
          id?: string
          investment_score?: number | null
          last_calculated?: string | null
          overall_contractor_score?: number | null
          property_id?: string | null
          renovation_score?: number | null
          roof_replacement_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_property_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_saved_properties: {
        Row: {
          created_at: string | null
          id: string
          list_name: string | null
          property_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_name?: string | null
          property_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_name?: string | null
          property_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piq_saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      piq_storm_events: {
        Row: {
          category: string | null
          damage_reported: boolean | null
          event_date: string | null
          event_name: string | null
          event_type: string | null
          id: string
          insurance_claims: number | null
          property_id: string | null
          wind_speed: number | null
        }
        Insert: {
          category?: string | null
          damage_reported?: boolean | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          insurance_claims?: number | null
          property_id?: string | null
          wind_speed?: number | null
        }
        Update: {
          category?: string | null
          damage_reported?: boolean | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          insurance_claims?: number | null
          property_id?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "piq_storm_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "piq_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          member_id: string
          points: number
          redeemed: boolean | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          member_id: string
          points: number
          redeemed?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          member_id?: string
          points?: number
          redeemed?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
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
      product_approvals: {
        Row: {
          ai_extracted_at: string | null
          applicable_trades: string[] | null
          approval_date: string | null
          created_at: string | null
          expiration_date: string | null
          extraction_confidence: number | null
          file_path: string | null
          file_url: string | null
          fl_approval_pdf_url: string | null
          fl_product_approval: string | null
          hvhz_approved: boolean | null
          id: string
          impact_test_url: string | null
          installation_guide_url: string | null
          is_active: boolean | null
          jurisdiction_scope: string[] | null
          last_source_attempt: string | null
          last_verified_at: string | null
          manufacturer: string
          metadata: Json | null
          noa_number: string | null
          noa_pdf_url: string | null
          pe_evaluation_url: string | null
          premium_tier: number | null
          product_category: string
          product_line: string | null
          product_name: string
          source_attempts: number | null
          source_notes: string | null
          source_status: string | null
          source_url_fl: string | null
          source_url_noa: string | null
          source_website: string | null
          specifications: Json | null
          uil_number: string | null
          ul_2218_class: string | null
          ul_listing_url: string | null
          updated_at: string | null
          wind_speed_rating: number | null
        }
        Insert: {
          ai_extracted_at?: string | null
          applicable_trades?: string[] | null
          approval_date?: string | null
          created_at?: string | null
          expiration_date?: string | null
          extraction_confidence?: number | null
          file_path?: string | null
          file_url?: string | null
          fl_approval_pdf_url?: string | null
          fl_product_approval?: string | null
          hvhz_approved?: boolean | null
          id?: string
          impact_test_url?: string | null
          installation_guide_url?: string | null
          is_active?: boolean | null
          jurisdiction_scope?: string[] | null
          last_source_attempt?: string | null
          last_verified_at?: string | null
          manufacturer: string
          metadata?: Json | null
          noa_number?: string | null
          noa_pdf_url?: string | null
          pe_evaluation_url?: string | null
          premium_tier?: number | null
          product_category: string
          product_line?: string | null
          product_name: string
          source_attempts?: number | null
          source_notes?: string | null
          source_status?: string | null
          source_url_fl?: string | null
          source_url_noa?: string | null
          source_website?: string | null
          specifications?: Json | null
          uil_number?: string | null
          ul_2218_class?: string | null
          ul_listing_url?: string | null
          updated_at?: string | null
          wind_speed_rating?: number | null
        }
        Update: {
          ai_extracted_at?: string | null
          applicable_trades?: string[] | null
          approval_date?: string | null
          created_at?: string | null
          expiration_date?: string | null
          extraction_confidence?: number | null
          file_path?: string | null
          file_url?: string | null
          fl_approval_pdf_url?: string | null
          fl_product_approval?: string | null
          hvhz_approved?: boolean | null
          id?: string
          impact_test_url?: string | null
          installation_guide_url?: string | null
          is_active?: boolean | null
          jurisdiction_scope?: string[] | null
          last_source_attempt?: string | null
          last_verified_at?: string | null
          manufacturer?: string
          metadata?: Json | null
          noa_number?: string | null
          noa_pdf_url?: string | null
          pe_evaluation_url?: string | null
          premium_tier?: number | null
          product_category?: string
          product_line?: string | null
          product_name?: string
          source_attempts?: number | null
          source_notes?: string | null
          source_status?: string | null
          source_url_fl?: string | null
          source_url_noa?: string | null
          source_website?: string | null
          specifications?: Json | null
          uil_number?: string | null
          ul_2218_class?: string | null
          ul_listing_url?: string | null
          updated_at?: string | null
          wind_speed_rating?: number | null
        }
        Relationships: []
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
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      property_cache: {
        Row: {
          address_normalized: string | null
          county: string
          created_at: string
          folio: string
          id: string
          property_data: Json
          scraped_at: string
          updated_at: string | null
        }
        Insert: {
          address_normalized?: string | null
          county: string
          created_at?: string
          folio: string
          id?: string
          property_data: Json
          scraped_at?: string
          updated_at?: string | null
        }
        Update: {
          address_normalized?: string | null
          county?: string
          created_at?: string
          folio?: string
          id?: string
          property_data?: Json
          scraped_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_dispositions: {
        Row: {
          address: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          disposition: string
          id: string
          insurance_claim: boolean | null
          lat: number
          lat_lng_hash: string
          lng: number
          notes: string | null
          priority: string | null
          roof_condition: string | null
          roof_type: string | null
          storm_date: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          disposition?: string
          id?: string
          insurance_claim?: boolean | null
          lat: number
          lat_lng_hash: string
          lng: number
          notes?: string | null
          priority?: string | null
          roof_condition?: string | null
          roof_type?: string | null
          storm_date?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          disposition?: string
          id?: string
          insurance_claim?: boolean | null
          lat?: number
          lat_lng_hash?: string
          lng?: number
          notes?: string | null
          priority?: string | null
          roof_condition?: string | null
          roof_type?: string | null
          storm_date?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_dispositions"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_type: string | null
          photo_url: string
          property_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type?: string | null
          photo_url: string
          property_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type?: string | null
          photo_url?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_dispositions"
            referencedColumns: ["id"]
          },
        ]
      }
      property_residents: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string | null
          phone: string | null
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          phone?: string | null
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          phone?: string | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_residents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_dispositions"
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
      reward_redemptions: {
        Row: {
          expires_at: string | null
          id: string
          points_spent: number
          redeemed_at: string | null
          reward_id: string
          status: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          points_spent: number
          redeemed_at?: string | null
          reward_id: string
          status?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          points_spent?: number
          redeemed_at?: string | null
          reward_id?: string
          status?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          points_cost: number
          quantity_available: number | null
          reward_type: string
          reward_value: string | null
          updated_at: string | null
          valid_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          points_cost: number
          quantity_available?: number | null
          reward_type: string
          reward_value?: string | null
          updated_at?: string | null
          valid_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          points_cost?: number
          quantity_available?: number | null
          reward_type?: string
          reward_value?: string | null
          updated_at?: string | null
          valid_days?: number | null
        }
        Relationships: []
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
      roof_measurements: {
        Row: {
          address: string
          chimney_count: number | null
          company_id: string | null
          complexity: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          drip_edge_ft: number | null
          eave_ft: number | null
          facets_count: number | null
          flashing_ft: number | null
          headwall_ft: number | null
          hip_ft: number | null
          id: string
          is_active: boolean
          latitude: number | null
          lead_id: string | null
          longitude: number | null
          material_takeoff: Json | null
          notes: string | null
          perimeter_ft: number | null
          pipe_boots_count: number | null
          pitch: string | null
          pitch_degrees: number | null
          pitch_multiplier: number | null
          predominant_pitch: string | null
          quality: string | null
          rake_ft: number | null
          ridge_ft: number | null
          roof_type: string | null
          segments_count: number | null
          share_token: string | null
          skylights_count: number | null
          solar_api_response: Json | null
          source: string
          step_flashing_ft: number | null
          stories: number | null
          total_area_sqft: number
          total_squares: number
          updated_at: string
          valley_ft: number | null
          waste_percent: number | null
        }
        Insert: {
          address: string
          chimney_count?: number | null
          company_id?: string | null
          complexity?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          drip_edge_ft?: number | null
          eave_ft?: number | null
          facets_count?: number | null
          flashing_ft?: number | null
          headwall_ft?: number | null
          hip_ft?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          material_takeoff?: Json | null
          notes?: string | null
          perimeter_ft?: number | null
          pipe_boots_count?: number | null
          pitch?: string | null
          pitch_degrees?: number | null
          pitch_multiplier?: number | null
          predominant_pitch?: string | null
          quality?: string | null
          rake_ft?: number | null
          ridge_ft?: number | null
          roof_type?: string | null
          segments_count?: number | null
          share_token?: string | null
          skylights_count?: number | null
          solar_api_response?: Json | null
          source?: string
          step_flashing_ft?: number | null
          stories?: number | null
          total_area_sqft?: number
          total_squares?: number
          updated_at?: string
          valley_ft?: number | null
          waste_percent?: number | null
        }
        Update: {
          address?: string
          chimney_count?: number | null
          company_id?: string | null
          complexity?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          drip_edge_ft?: number | null
          eave_ft?: number | null
          facets_count?: number | null
          flashing_ft?: number | null
          headwall_ft?: number | null
          hip_ft?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          material_takeoff?: Json | null
          notes?: string | null
          perimeter_ft?: number | null
          pipe_boots_count?: number | null
          pitch?: string | null
          pitch_degrees?: number | null
          pitch_multiplier?: number | null
          predominant_pitch?: string | null
          quality?: string | null
          rake_ft?: number | null
          ridge_ft?: number | null
          roof_type?: string | null
          segments_count?: number | null
          share_token?: string | null
          skylights_count?: number | null
          solar_api_response?: Json | null
          source?: string
          step_flashing_ft?: number | null
          stories?: number | null
          total_area_sqft?: number
          total_squares?: number
          updated_at?: string
          valley_ft?: number | null
          waste_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roof_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roof_measurements_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roof_measurements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roof_measurements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      roofing_materials: {
        Row: {
          category: string
          company_id: string | null
          cost_per_unit: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          supplier: string | null
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category?: string
          company_id?: string | null
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          supplier?: string | null
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string | null
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          supplier?: string | null
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roofing_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      roofr_reports: {
        Row: {
          created_at: string | null
          eaves_length: number | null
          facets: number | null
          hips_length: number | null
          id: string
          pdf_path: string | null
          permit_project_id: string | null
          predominant_pitch: string | null
          raw_data: Json | null
          ridges_length: number | null
          roofr_project_id: string | null
          total_area_sqft: number | null
          valleys_length: number | null
        }
        Insert: {
          created_at?: string | null
          eaves_length?: number | null
          facets?: number | null
          hips_length?: number | null
          id?: string
          pdf_path?: string | null
          permit_project_id?: string | null
          predominant_pitch?: string | null
          raw_data?: Json | null
          ridges_length?: number | null
          roofr_project_id?: string | null
          total_area_sqft?: number | null
          valleys_length?: number | null
        }
        Update: {
          created_at?: string | null
          eaves_length?: number | null
          facets?: number | null
          hips_length?: number | null
          id?: string
          pdf_path?: string | null
          permit_project_id?: string | null
          predominant_pitch?: string | null
          raw_data?: Json | null
          ridges_length?: number | null
          roofr_project_id?: string | null
          total_area_sqft?: number | null
          valleys_length?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roofr_reports_permit_project_id_fkey"
            columns: ["permit_project_id"]
            isOneToOne: false
            referencedRelation: "permit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      section_1524_mappings: {
        Row: {
          checkbox_id: string
          checkbox_label: string
          condition_field: string | null
          condition_operator: string | null
          condition_type: string
          condition_value: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          pdf_field_name: string | null
        }
        Insert: {
          checkbox_id: string
          checkbox_label: string
          condition_field?: string | null
          condition_operator?: string | null
          condition_type: string
          condition_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          pdf_field_name?: string | null
        }
        Update: {
          checkbox_id?: string
          checkbox_label?: string
          condition_field?: string | null
          condition_operator?: string | null
          condition_type?: string
          condition_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          pdf_field_name?: string | null
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
      session_feed_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "session_feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "session_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      session_feed_posts: {
        Row: {
          content: string | null
          created_at: string
          doors_knocked: number
          goals_doors: number | null
          goals_leads: number | null
          id: string
          image_url: string | null
          leads_gotten: number
          points_earned: number
          post_type: string | null
          session_id: string
          user_id: string
          video_type: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          doors_knocked?: number
          goals_doors?: number | null
          goals_leads?: number | null
          id?: string
          image_url?: string | null
          leads_gotten?: number
          points_earned?: number
          post_type?: string | null
          session_id: string
          user_id: string
          video_type?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          doors_knocked?: number
          goals_doors?: number | null
          goals_leads?: number | null
          id?: string
          image_url?: string | null
          leads_gotten?: number
          points_earned?: number
          post_type?: string | null
          session_id?: string
          user_id?: string
          video_type?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_feed_posts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_feed_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "session_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      session_progress_videos: {
        Row: {
          challenges_mentioned: string | null
          created_at: string
          id: string
          points_awarded: number
          points_multiplier: number
          session_id: string
          update_number: number
          updated_goals_doors: number | null
          updated_goals_leads: number | null
          user_id: string
          video_duration_seconds: number
          video_type: string
          video_url: string
        }
        Insert: {
          challenges_mentioned?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          points_multiplier?: number
          session_id: string
          update_number?: number
          updated_goals_doors?: number | null
          updated_goals_leads?: number | null
          user_id: string
          video_duration_seconds?: number
          video_type?: string
          video_url: string
        }
        Update: {
          challenges_mentioned?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          points_multiplier?: number
          session_id?: string
          update_number?: number
          updated_goals_doors?: number | null
          updated_goals_leads?: number | null
          user_id?: string
          video_duration_seconds?: number
          video_type?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_progress_videos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
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
      storm_events: {
        Row: {
          affected_area: string
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          severity: string | null
          storm_date: string
          updated_at: string
        }
        Insert: {
          affected_area: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          severity?: string | null
          storm_date: string
          updated_at?: string
        }
        Update: {
          affected_area?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          severity?: string | null
          storm_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storm_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storm_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      suppliers: {
        Row: {
          account_number: string | null
          company_id: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          company_id?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      team_gamification: {
        Row: {
          created_at: string | null
          id: string
          monthly_referrals: number | null
          rank_in_company: number | null
          successful_referrals: number | null
          team_id: string
          total_points: number | null
          total_referrals: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_referrals?: number | null
          rank_in_company?: number | null
          successful_referrals?: number | null
          team_id: string
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_referrals?: number | null
          rank_in_company?: number | null
          successful_referrals?: number | null
          team_id?: string
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_gamification_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          service_counties: string[] | null
          service_zip_codes: string[] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          service_counties?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          service_counties?: string[] | null
          service_zip_codes?: string[] | null
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
      trade_requirements: {
        Row: {
          conditional_documents: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          jurisdiction_id: string | null
          notes: string | null
          photo_requirements: string[] | null
          required_documents: string[] | null
          revision_triggers: string[] | null
          trade: string
          updated_at: string | null
        }
        Insert: {
          conditional_documents?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_id?: string | null
          notes?: string | null
          photo_requirements?: string[] | null
          required_documents?: string[] | null
          revision_triggers?: string[] | null
          trade: string
          updated_at?: string | null
        }
        Update: {
          conditional_documents?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_id?: string | null
          notes?: string | null
          photo_requirements?: string[] | null
          required_documents?: string[] | null
          revision_triggers?: string[] | null
          trade?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_requirements_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "permit_building_departments"
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
      user_badges: {
        Row: {
          badge_id: string
          displayed: boolean | null
          earned_at: string | null
          id: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          badge_id: string
          displayed?: boolean | null
          earned_at?: string | null
          id?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          badge_id?: string
          displayed?: boolean | null
          earned_at?: string | null
          id?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          available_points: number | null
          created_at: string | null
          current_level: string | null
          current_streak: number | null
          daily_streak: number | null
          id: string
          last_active_at: string | null
          last_streak_action_at: string | null
          longest_streak: number | null
          monthly_points: number | null
          monthly_referrals: number | null
          successful_referrals: number | null
          total_points: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string | null
          current_level?: string | null
          current_streak?: number | null
          daily_streak?: number | null
          id?: string
          last_active_at?: string | null
          last_streak_action_at?: string | null
          longest_streak?: number | null
          monthly_points?: number | null
          monthly_referrals?: number | null
          successful_referrals?: number | null
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_points?: number | null
          created_at?: string | null
          current_level?: string | null
          current_streak?: number | null
          daily_streak?: number | null
          id?: string
          last_active_at?: string | null
          last_streak_action_at?: string | null
          longest_streak?: number | null
          monthly_points?: number | null
          monthly_referrals?: number | null
          successful_referrals?: number | null
          total_points?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          lat: number
          lng: number
          session_id: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          session_id: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      video_verifications: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          points_awarded: number
          session_id: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          points_awarded?: number
          session_id: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          points_awarded?: number
          session_id?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_verifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "field_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_verifications_user_id_fkey"
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
      calculate_company_tier: { Args: { referrals: number }; Returns: string }
      calculate_company_verification_score: {
        Args: { company_row: Database["public"]["Tables"]["companies"]["Row"] }
        Returns: number
      }
      calculate_user_level: { Args: { points: number }; Returns: string }
      cleanup_stuck_form_templates: { Args: never; Returns: number }
      cleanup_stuck_training_books: { Args: never; Returns: number }
      cleanup_stuck_training_records: { Args: never; Returns: number }
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
      increment_batch_processed: {
        Args: { batch_id: string }
        Returns: undefined
      }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_company_or_super_admin: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_permit_admin: { Args: never; Returns: boolean }
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
      doc_validation_status:
        | "pending"
        | "valid"
        | "invalid"
        | "needs_signature"
        | "needs_review"
      door_to_door_disposition:
        | "not_home"
        | "not_interested"
        | "go_back"
        | "interested"
        | "needs_inspection"
        | "appointment_set"
        | "contract_signed"
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
      permit_payment_status:
        | "unpaid"
        | "pending"
        | "paid"
        | "refunded"
        | "failed"
      permit_pipeline_status:
        | "intake"
        | "data_capture"
        | "docs_needed"
        | "packet_assembly"
        | "compliance_check"
        | "awaiting_payment"
        | "ready_to_submit"
        | "under_review"
        | "corrections_needed"
        | "approved_ready_to_pay"
        | "issued_closed"
      permit_type_enum:
        | "roofing"
        | "windows_doors"
        | "fence"
        | "solar"
        | "hvac"
        | "electrical"
        | "plumbing"
        | "pool"
        | "demolition"
        | "addition"
        | "other"
        | "engineering"
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
      doc_validation_status: [
        "pending",
        "valid",
        "invalid",
        "needs_signature",
        "needs_review",
      ],
      door_to_door_disposition: [
        "not_home",
        "not_interested",
        "go_back",
        "interested",
        "needs_inspection",
        "appointment_set",
        "contract_signed",
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
      permit_payment_status: [
        "unpaid",
        "pending",
        "paid",
        "refunded",
        "failed",
      ],
      permit_pipeline_status: [
        "intake",
        "data_capture",
        "docs_needed",
        "packet_assembly",
        "compliance_check",
        "awaiting_payment",
        "ready_to_submit",
        "under_review",
        "corrections_needed",
        "approved_ready_to_pay",
        "issued_closed",
      ],
      permit_type_enum: [
        "roofing",
        "windows_doors",
        "fence",
        "solar",
        "hvac",
        "electrical",
        "plumbing",
        "pool",
        "demolition",
        "addition",
        "other",
        "engineering",
      ],
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
