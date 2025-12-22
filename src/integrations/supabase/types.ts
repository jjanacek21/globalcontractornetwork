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
          estimate_high: number | null
          estimate_low: number | null
          estimated_sqft: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          property_address: string
          property_type: string | null
          roof_age: string | null
          roof_condition: string | null
          roof_type: string
          show_as_winner: boolean | null
          status: string | null
          testimonial_text: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          coating_type: string
          created_at?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          email: string
          estimate_high?: number | null
          estimate_low?: number | null
          estimated_sqft?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          property_address: string
          property_type?: string | null
          roof_age?: string | null
          roof_condition?: string | null
          roof_type: string
          show_as_winner?: boolean | null
          status?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          coating_type?: string
          created_at?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          email?: string
          estimate_high?: number | null
          estimate_low?: number | null
          estimated_sqft?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          property_address?: string
          property_type?: string | null
          roof_age?: string | null
          roof_condition?: string | null
          roof_type?: string
          show_as_winner?: boolean | null
          status?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
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
          id: string
          message: string | null
          name: string
          phone: string | null
          product_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          product_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          product_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_profiles: {
        Row: {
          average_rating: number | null
          category: string
          company_name: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          phone: string | null
          review_count: number | null
          service_area: string[] | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          average_rating?: number | null
          category: string
          company_name: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          review_count?: number | null
          service_area?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          company_name?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          review_count?: number | null
          service_area?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contractor_reviews: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
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
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          estimated_price: number | null
          id: string
          priority: string | null
          recommended_package: string | null
          roof_type: string | null
          sqft: number | null
          status: string | null
          timeline: string | null
          updated_at: string | null
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
          estimated_price?: number | null
          id?: string
          priority?: string | null
          recommended_package?: string | null
          roof_type?: string | null
          sqft?: number | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
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
          estimated_price?: number | null
          id?: string
          priority?: string | null
          recommended_package?: string | null
          roof_type?: string | null
          sqft?: number | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
          zip_code?: string | null
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
          id: string
          message: string | null
          name: string
          phone: string
          property_address: string | null
          service_tier_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          property_address?: string | null
          service_tier_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          property_address?: string | null
          service_tier_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_service_tier_id_fkey"
            columns: ["service_tier_id"]
            isOneToOne: false
            referencedRelation: "service_tiers"
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
          show_as_winner: boolean | null
          spin_result: string | null
          state: string | null
          status: string | null
          testimonial_text: string | null
          total_windows: number | null
          updated_at: string | null
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
          show_as_winner?: boolean | null
          spin_result?: string | null
          state?: string | null
          status?: string | null
          testimonial_text?: string | null
          total_windows?: number | null
          updated_at?: string | null
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
          show_as_winner?: boolean | null
          spin_result?: string | null
          state?: string | null
          status?: string | null
          testimonial_text?: string | null
          total_windows?: number | null
          updated_at?: string | null
          window_selections?: Json | null
          zip_code?: string | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_company_or_super_admin: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "sales_rep" | "teacher" | "student" | "contractor"
      company_role:
        | "company_admin"
        | "manager"
        | "project_manager"
        | "sales_rep"
        | "crew"
      pipeline_stage:
        | "lead"
        | "inspection"
        | "estimate_sent"
        | "sold"
        | "in_production"
        | "complete"
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
      company_role: [
        "company_admin",
        "manager",
        "project_manager",
        "sales_rep",
        "crew",
      ],
      pipeline_stage: [
        "lead",
        "inspection",
        "estimate_sent",
        "sold",
        "in_production",
        "complete",
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
