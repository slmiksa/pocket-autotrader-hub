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
      announcement_banner: {
        Row: {
          background_color: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          text_color: string
          updated_at: string
          website_text: string | null
          website_url: string | null
          whatsapp_number: string | null
          whatsapp_text: string | null
        }
        Insert: {
          background_color?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          text_color?: string
          updated_at?: string
          website_text?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
          whatsapp_text?: string | null
        }
        Update: {
          background_color?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          text_color?: string
          updated_at?: string
          website_text?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
          whatsapp_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_code: string | null
          created_at: string
          email: string | null
          id: string
          image_analysis_enabled: boolean | null
          subscription_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          image_analysis_enabled?: boolean | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          image_analysis_enabled?: boolean | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      signals: {
        Row: {
          amount: number
          asset: string
          created_at: string
          direction: string
          entry_time: string | null
          id: string
          raw_message: string | null
          received_at: string
          result: string | null
          status: string
          telegram_message_id: string | null
          timeframe: string
        }
        Insert: {
          amount?: number
          asset: string
          created_at?: string
          direction: string
          entry_time?: string | null
          id?: string
          raw_message?: string | null
          received_at?: string
          result?: string | null
          status?: string
          telegram_message_id?: string | null
          timeframe: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          direction?: string
          entry_time?: string | null
          id?: string
          raw_message?: string | null
          received_at?: string
          result?: string | null
          status?: string
          telegram_message_id?: string | null
          timeframe?: string
        }
        Relationships: []
      }
      subscription_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          duration_days: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          duration_days: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          duration_days?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_at: string
          code_id: string
          device_id: string
          expires_at: string
          id: string
        }
        Insert: {
          activated_at?: string
          code_id: string
          device_id: string
          expires_at: string
          id?: string
        }
        Update: {
          activated_at?: string
          code_id?: string
          device_id?: string
          expires_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "subscription_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          asset: string
          created_at: string
          direction: string
          entry_time: string
          error_message: string | null
          execution_method: string | null
          expiry_time: string | null
          id: string
          pocket_trade_id: string | null
          profit: number | null
          result: string | null
          signal_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string
          direction: string
          entry_time?: string
          error_message?: string | null
          execution_method?: string | null
          expiry_time?: string | null
          id?: string
          pocket_trade_id?: string | null
          profit?: number | null
          result?: string | null
          signal_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          direction?: string
          entry_time?: string
          error_message?: string | null
          execution_method?: string | null
          expiry_time?: string | null
          id?: string
          pocket_trade_id?: string | null
          profit?: number | null
          result?: string | null
          signal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
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
      user_trade_results: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
          user_result: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
          user_result: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
          user_result?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trade_results_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "subscriber"
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
      app_role: ["admin", "subscriber"],
    },
  },
} as const
