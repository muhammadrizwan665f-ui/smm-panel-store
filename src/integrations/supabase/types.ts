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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          description: string | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_note: string | null
          amount: number
          bank_ref_id: string | null
          callback_received_at: string | null
          created_at: string
          credited_amount: number | null
          currency: string
          expires_at: string | null
          gateway_id: string | null
          gateway_transaction_id: string | null
          id: string
          payment_mode: string | null
          processed_at: string | null
          qr_image_url: string | null
          qr_payload: string | null
          reference_id: string | null
          status: string
          user_id: string
          utr: string | null
          verification_response: Json | null
          virtual_accounts_id: string | null
          vpa: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_ref_id?: string | null
          callback_received_at?: string | null
          created_at?: string
          credited_amount?: number | null
          currency?: string
          expires_at?: string | null
          gateway_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          payment_mode?: string | null
          processed_at?: string | null
          qr_image_url?: string | null
          qr_payload?: string | null
          reference_id?: string | null
          status?: string
          user_id: string
          utr?: string | null
          verification_response?: Json | null
          virtual_accounts_id?: string | null
          vpa?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_ref_id?: string | null
          callback_received_at?: string | null
          created_at?: string
          credited_amount?: number | null
          currency?: string
          expires_at?: string | null
          gateway_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          payment_mode?: string | null
          processed_at?: string | null
          qr_image_url?: string | null
          qr_payload?: string | null
          reference_id?: string | null
          status?: string
          user_id?: string
          utr?: string | null
          verification_response?: Json | null
          virtual_accounts_id?: string | null
          vpa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string | null
          target: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string | null
          target?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string | null
          target?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          contact_whatsapp: string | null
          created_at: string
          estimated_profit: number | null
          id: string
          link: string
          note: string | null
          order_type: string
          platform: string | null
          price: number
          provider_cost: number | null
          provider_id: string | null
          provider_order_id: string | null
          provider_response: Json | null
          provider_status: string | null
          quantity: number
          service_id: string | null
          service_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_whatsapp?: string | null
          created_at?: string
          estimated_profit?: number | null
          id?: string
          link: string
          note?: string | null
          order_type?: string
          platform?: string | null
          price: number
          provider_cost?: number | null
          provider_id?: string | null
          provider_order_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          quantity: number
          service_id?: string | null
          service_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_whatsapp?: string | null
          created_at?: string
          estimated_profit?: number | null
          id?: string
          link?: string
          note?: string | null
          order_type?: string
          platform?: string | null
          price?: number
          provider_cost?: number | null
          provider_id?: string | null
          provider_order_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          quantity?: number
          service_id?: string | null
          service_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          access_token: string | null
          account_number: string | null
          api_url: string | null
          auto_verify: boolean
          bonus_percent: number
          bonus_start_amount: number
          callback_url: string | null
          created_at: string
          display_order: number
          expiry_minutes: number
          fee_percent: number
          iban: string | null
          id: string
          instructions: string | null
          max_amount: number
          merchant_id: string | null
          min_amount: number
          mobile_number: string | null
          name: string
          provider: string
          qr_api_url: string | null
          qr_image_url: string | null
          qr_request_template: Json | null
          qr_response_path: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_number?: string | null
          api_url?: string | null
          auto_verify?: boolean
          bonus_percent?: number
          bonus_start_amount?: number
          callback_url?: string | null
          created_at?: string
          display_order?: number
          expiry_minutes?: number
          fee_percent?: number
          iban?: string | null
          id?: string
          instructions?: string | null
          max_amount?: number
          merchant_id?: string | null
          min_amount?: number
          mobile_number?: string | null
          name: string
          provider?: string
          qr_api_url?: string | null
          qr_image_url?: string | null
          qr_request_template?: Json | null
          qr_response_path?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_number?: string | null
          api_url?: string | null
          auto_verify?: boolean
          bonus_percent?: number
          bonus_start_amount?: number
          callback_url?: string | null
          created_at?: string
          display_order?: number
          expiry_minutes?: number
          fee_percent?: number
          iban?: string | null
          id?: string
          instructions?: string | null
          max_amount?: number
          merchant_id?: string | null
          min_amount?: number
          mobile_number?: string | null
          name?: string
          provider?: string
          qr_api_url?: string | null
          qr_image_url?: string | null
          qr_request_template?: Json | null
          qr_response_path?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          gateway: string | null
          gateway_transaction_id: string | null
          id: string
          method: string
          reference: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          gateway?: string | null
          gateway_transaction_id?: string | null
          id?: string
          method: string
          reference?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          gateway?: string | null
          gateway_transaction_id?: string | null
          id?: string
          method?: string
          reference?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          mobile_number: string
          referral_code: string | null
          referred_by: string | null
          status: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          id: string
          mobile_number: string
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          mobile_number?: string
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_api_logs: {
        Row: {
          created_at: string
          id: string
          is_success: boolean | null
          operation: string
          provider_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_success?: boolean | null
          operation: string
          provider_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_success?: boolean | null
          operation?: string
          provider_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_api_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          cancel: boolean | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          last_synced_at: string | null
          name: string | null
          provider_cost: number | null
          provider_currency: string | null
          provider_id: string | null
          provider_max: number | null
          provider_min: number | null
          provider_service_id: string
          refill: boolean | null
          service_id: string | null
          status: string
          type: string | null
        }
        Insert: {
          cancel?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string | null
          provider_cost?: number | null
          provider_currency?: string | null
          provider_id?: string | null
          provider_max?: number | null
          provider_min?: number | null
          provider_service_id: string
          refill?: boolean | null
          service_id?: string | null
          status?: string
          type?: string | null
        }
        Update: {
          cancel?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string | null
          provider_cost?: number | null
          provider_currency?: string | null
          provider_id?: string | null
          provider_max?: number | null
          provider_min?: number | null
          provider_service_id?: string
          refill?: boolean | null
          service_id?: string | null
          status?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          api_key: string
          api_url: string
          api_version: string | null
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          last_balance_check: string | null
          last_sync: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          api_version?: string | null
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          last_balance_check?: string | null
          last_sync?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          api_version?: string | null
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          last_balance_check?: string | null
          last_sync?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          referred_id: string | null
          referrer_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          referred_id?: string | null
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          referred_id?: string | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          service_type: string
          status: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          service_type?: string
          status?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          service_type?: string
          status?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          allow_quantity: boolean
          category_id: string | null
          converted_cost: number | null
          created_at: string
          customer_currency: string | null
          customer_price: number | null
          customer_rate: number | null
          description: string | null
          discount_percent: number | null
          fixed_price: number | null
          icon: string | null
          id: string
          last_synced_at: string | null
          markup_amount: number | null
          markup_type: string | null
          max_quantity: number
          min_quantity: number
          name: string
          normalized_usdt_cost: number | null
          price_per_1000: number
          profit_type: string | null
          profit_value: number | null
          provider_cost: number | null
          provider_currency: string | null
          provider_id: string | null
          provider_rate: number | null
          provider_service_id: string | null
          service_type: string
          status: string | null
          usdt_rate_at_calculation: number | null
        }
        Insert: {
          allow_quantity?: boolean
          category_id?: string | null
          converted_cost?: number | null
          created_at?: string
          customer_currency?: string | null
          customer_price?: number | null
          customer_rate?: number | null
          description?: string | null
          discount_percent?: number | null
          fixed_price?: number | null
          icon?: string | null
          id?: string
          last_synced_at?: string | null
          markup_amount?: number | null
          markup_type?: string | null
          max_quantity?: number
          min_quantity?: number
          name: string
          normalized_usdt_cost?: number | null
          price_per_1000?: number
          profit_type?: string | null
          profit_value?: number | null
          provider_cost?: number | null
          provider_currency?: string | null
          provider_id?: string | null
          provider_rate?: number | null
          provider_service_id?: string | null
          service_type?: string
          status?: string | null
          usdt_rate_at_calculation?: number | null
        }
        Update: {
          allow_quantity?: boolean
          category_id?: string | null
          converted_cost?: number | null
          created_at?: string
          customer_currency?: string | null
          customer_price?: number | null
          customer_rate?: number | null
          description?: string | null
          discount_percent?: number | null
          fixed_price?: number | null
          icon?: string | null
          id?: string
          last_synced_at?: string | null
          markup_amount?: number | null
          markup_type?: string | null
          max_quantity?: number
          min_quantity?: number
          name?: string
          normalized_usdt_cost?: number | null
          price_per_1000?: number
          profit_type?: string | null
          profit_value?: number | null
          provider_cost?: number | null
          provider_currency?: string | null
          provider_id?: string | null
          provider_rate?: number | null
          provider_service_id?: string | null
          service_type?: string
          status?: string | null
          usdt_rate_at_calculation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_bharatpay_callback: {
        Args: {
          p_amount: number
          p_bank_ref: string
          p_gateway_id: string
          p_payload: Json
          p_payment_mode: string
          p_reference: string
          p_status: string
          p_txn_id: string
          p_va_id: string
          p_vpa: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
