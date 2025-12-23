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
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
        cohorts: {
          Row: {
            capacity: number
            course_id: string
            created_at: string
            end_date: string | null
            id: string
            location: string
            name: string
            start_date: string
            status: Database["public"]["Enums"]["cohort_status"]
            updated_at: string
            year: number
          }
          Insert: {
            capacity?: number
            course_id: string
            created_at?: string
            end_date?: string | null
            id?: string
            location: string
            name: string
            start_date: string
            status?: Database["public"]["Enums"]["cohort_status"]
            updated_at?: string
            year: number
          }
          Update: {
            capacity?: number
            course_id?: string
            created_at?: string
            end_date?: string | null
            id?: string
            location?: string
            name?: string
            start_date?: string
            status?: Database["public"]["Enums"]["cohort_status"]
            updated_at?: string
            year?: number
          }
          Relationships: [
            {
              foreignKeyName: "cohorts_course_id_fkey"
              columns: ["course_id"]
              isOneToOne: false
              referencedRelation: "courses"
              referencedColumns: ["id"]
            },
          ]
        }
        contacts: {
          Row: {
            id: string
            name: string
            email: string | null
            phone: string | null
            ltv: number
            total_purchases: number
            kommo_contact_id: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            name: string
            email?: string | null
            phone?: string | null
            ltv?: number
            total_purchases?: number
            kommo_contact_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            name?: string
            email?: string | null
            phone?: string | null
            ltv?: number
            total_purchases?: number
            kommo_contact_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        }
        products: {
          Row: {
            id: string
            name: string
            price: number | null
            status: string
            nucleo_id: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            name: string
            price?: number | null
            status?: string
            nucleo_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            name?: string
            price?: number | null
            status?: string
            nucleo_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        }
        sellers: {
          Row: {
            id: string
            name: string
            active: boolean
            nucleo_id: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            name: string
            active?: boolean
            nucleo_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            name?: string
            active?: boolean
            nucleo_id?: string | null
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      csv_import_history: {
        Row: {
          cohorts_affected: string[]
          failed_imports: number
          file_name: string | null
          id: string
          import_type: string
          imported_at: string
          imported_by: string | null
          notes: string | null
          successful_imports: number
          total_students: number
          user_email: string | null
        }
        Insert: {
          cohorts_affected?: string[]
          failed_imports?: number
          file_name?: string | null
          id?: string
          import_type?: string
          imported_at?: string
          imported_by?: string | null
          notes?: string | null
          successful_imports?: number
          total_students?: number
          user_email?: string | null
        }
        Update: {
          cohorts_affected?: string[]
          failed_imports?: number
          file_name?: string | null
          id?: string
          import_type?: string
          imported_at?: string
          imported_by?: string | null
          notes?: string | null
          successful_imports?: number
          total_students?: number
          user_email?: string | null
        }
        Relationships: []
      }
      csv_template_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          multi_cohort: boolean
          name: string
          selected_fields: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          multi_cohort?: boolean
          name: string
          selected_fields: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          multi_cohort?: boolean
          name?: string
          selected_fields?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_enrollment_sources: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
        enrollments: {
          Row: {
            address: string | null
            city: string | null
            clicksign_document_id: string | null
            cohort_id: string
            contact_id: string | null
            contract_status: Database["public"]["Enums"]["enrollment_contract_status"]
            cpf: string
            created_at: string
            created_by: string | null
            email: string
            external_metadata: Json | null
            financial_status: Database["public"]["Enums"]["enrollment_financial_status"]
            id: string
            kommo_lead_id: string | null
            lead_date: string | null
            observations: string | null
            payment_amount: number | null
            payment_details: string
            payment_proof_url: string | null
            phone: string | null
            position_in_cohort: number | null
            product_id: string | null
            product_name: string | null
            purchase_date: string | null
            seller_id: string | null
            sales_rep: string
            source: Database["public"]["Enums"]["enrollment_source"]
            state: string | null
            student_name: string
            submitted_at: string | null
            typeform_response_id: string | null
            updated_at: string
            utm_campaign: string | null
            utm_content: string | null
            utm_medium: string | null
            utm_source: string | null
            utm_term: string | null
            zipcode: string | null
          }
          Insert: {
            address?: string | null
            city?: string | null
            clicksign_document_id?: string | null
            cohort_id: string
            contact_id?: string | null
            contract_status?: Database["public"]["Enums"]["enrollment_contract_status"]
            cpf: string
            created_at?: string
            created_by?: string | null
            email: string
            external_metadata?: Json | null
            financial_status?: Database["public"]["Enums"]["enrollment_financial_status"]
            id?: string
            kommo_lead_id?: string | null
            lead_date?: string | null
            observations?: string | null
            payment_amount?: number | null
            payment_details: string
            payment_proof_url?: string | null
            phone?: string | null
            position_in_cohort?: number | null
            product_id?: string | null
            product_name?: string | null
            purchase_date?: string | null
            seller_id?: string | null
            sales_rep: string
            source?: Database["public"]["Enums"]["enrollment_source"]
            state?: string | null
            student_name: string
            submitted_at?: string | null
            typeform_response_id?: string | null
            updated_at?: string
            utm_campaign?: string | null
            utm_content?: string | null
            utm_medium?: string | null
            utm_source?: string | null
            utm_term?: string | null
            zipcode?: string | null
          }
          Update: {
            address?: string | null
            city?: string | null
            clicksign_document_id?: string | null
            cohort_id?: string
            contact_id?: string | null
            contract_status?: Database["public"]["Enums"]["enrollment_contract_status"]
            cpf?: string
            created_at?: string
            created_by?: string | null
            email?: string
            external_metadata?: Json | null
            financial_status?: Database["public"]["Enums"]["enrollment_financial_status"]
            id?: string
            kommo_lead_id?: string | null
            lead_date?: string | null
            observations?: string | null
            payment_amount?: number | null
            payment_details?: string
            payment_proof_url?: string | null
            phone?: string | null
            position_in_cohort?: number | null
            product_id?: string | null
            product_name?: string | null
            purchase_date?: string | null
            seller_id?: string | null
            sales_rep?: string
            source?: Database["public"]["Enums"]["enrollment_source"]
            state?: string | null
            student_name?: string
            submitted_at?: string | null
            typeform_response_id?: string | null
            updated_at?: string
            utm_campaign?: string | null
            utm_content?: string | null
            utm_medium?: string | null
            utm_source?: string | null
            utm_term?: string | null
            zipcode?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "enrollments_cohort_id_fkey"
              columns: ["cohort_id"]
              isOneToOne: false
              referencedRelation: "cohorts"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "enrollments_contact_id_fkey"
              columns: ["contact_id"]
              isOneToOne: false
              referencedRelation: "contacts"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "enrollments_product_id_fkey"
              columns: ["product_id"]
              isOneToOne: false
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "enrollments_seller_id_fkey"
              columns: ["seller_id"]
              isOneToOne: false
              referencedRelation: "sellers"
              referencedColumns: ["id"]
            },
          ]
        }
      integration_logs: {
        Row: {
          created_at: string
          enrollment_id: string | null
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          retry_count: number | null
          source_system: string
          status: string
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number | null
          source_system: string
          status: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number | null
          source_system?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          api_key: string | null
          config: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          last_sync_at: string | null
          system_name: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key?: string | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          system_name: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          system_name?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          foreground_color: string | null
          id: string
          logo_url: string | null
          organization_name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          foreground_color?: string | null
          id?: string
          logo_url?: string | null
          organization_name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          foreground_color?: string | null
          id?: string
          logo_url?: string | null
          organization_name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_representatives: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      cleanup_old_import_history: { Args: never; Returns: undefined }
      get_cohort_stats: {
        Args: { p_cohort_id: string }
        Returns: {
          available_spots: number
          capacity: number
          enrolled_count: number
          is_overbooked: boolean
          paid_count: number
          reserved_count: number
          signed_count: number
          total_revenue: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sanitize_audit_data: { Args: { data: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "operator" | "sales" | "viewer"
      cohort_status: "open" | "full" | "completed" | "cancelled"
      enrollment_contract_status: "pending" | "signed"
      enrollment_financial_status: "pending" | "paid"
      enrollment_source:
        | "Instagram"
        | "Facebook"
        | "Indicação"
        | "Tráfego Pago"
        | "Direto"
        | "Outro"
        | "Instagram Bio"
        | "Instagram Manychat"
        | "WEB - Downsell"
        | "Área de Membros FOTS"
        | "Tráfego Pago (Público Frio)"
        | "Tráfego Pago (Público Quente)"
        | "API Remarketing"
        | "Aluno Mentoria"
        | "Programa de Indicação"
        | "Não Rastreada"
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
      app_role: ["admin", "operator", "sales", "viewer"],
      cohort_status: ["open", "full", "completed", "cancelled"],
      enrollment_contract_status: ["pending", "signed"],
      enrollment_financial_status: ["pending", "paid"],
      enrollment_source: [
        "Instagram",
        "Facebook",
        "Indicação",
        "Tráfego Pago",
        "Direto",
        "Outro",
        "Instagram Bio",
        "Instagram Manychat",
        "WEB - Downsell",
        "Área de Membros FOTS",
        "Tráfego Pago (Público Frio)",
        "Tráfego Pago (Público Quente)",
        "API Remarketing",
        "Aluno Mentoria",
        "Programa de Indicação",
        "Não Rastreada",
      ],
    },
  },
} as const
