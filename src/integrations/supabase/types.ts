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
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_events: {
        Row: {
          actual_value: string | null
          country: string
          created_at: string | null
          currency: string
          event_time: string
          forecast_value: string | null
          id: string
          impact: string
          previous_value: string | null
          title: string
          title_ar: string
        }
        Insert: {
          actual_value?: string | null
          country: string
          created_at?: string | null
          currency: string
          event_time: string
          forecast_value?: string | null
          id?: string
          impact: string
          previous_value?: string | null
          title: string
          title_ar: string
        }
        Update: {
          actual_value?: string | null
          country?: string
          created_at?: string | null
          currency?: string
          event_time?: string
          forecast_value?: string | null
          id?: string
          impact?: string
          previous_value?: string | null
          title?: string
          title_ar?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          button_link: string
          button_text: string
          created_at: string
          display_order: number
          gradient_color: string
          id: string
          image_url: string | null
          is_active: boolean
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string
          button_text?: string
          created_at?: string
          display_order?: number
          gradient_color?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          created_at?: string
          display_order?: number
          gradient_color?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_schedules: {
        Row: {
          close_time: string
          created_at: string | null
          days_active: string[] | null
          id: string
          is_active: boolean | null
          market_name: string
          market_name_ar: string
          open_time: string
          timezone: string
        }
        Insert: {
          close_time: string
          created_at?: string | null
          days_active?: string[] | null
          id?: string
          is_active?: boolean | null
          market_name: string
          market_name_ar: string
          open_time: string
          timezone?: string
        }
        Update: {
          close_time?: string
          created_at?: string | null
          days_active?: string[] | null
          id?: string
          is_active?: boolean | null
          market_name?: string
          market_name_ar?: string
          open_time?: string
          timezone?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          category: string
          condition: string
          created_at: string
          id: string
          is_active: boolean
          symbol: string
          symbol_name_ar: string
          symbol_name_en: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol: string
          symbol_name_ar: string
          symbol_name_en: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol?: string
          symbol_name_ar?: string
          symbol_name_en?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_signals: {
        Row: {
          analysis: string | null
          asset: string
          closed_at: string | null
          confidence_level: string | null
          created_at: string | null
          created_by: string | null
          direction: string
          entry_price: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          result: string | null
          stop_loss: string | null
          target_price: string | null
          timeframe: string
        }
        Insert: {
          analysis?: string | null
          asset: string
          closed_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          direction: string
          entry_price?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          result?: string | null
          stop_loss?: string | null
          target_price?: string | null
          timeframe: string
        }
        Update: {
          analysis?: string | null
          asset?: string
          closed_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string
          entry_price?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          result?: string | null
          stop_loss?: string | null
          target_price?: string | null
          timeframe?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_code: string | null
          alert_before_minutes: number | null
          avatar_url: string | null
          created_at: string
          economic_alerts_enabled: boolean | null
          email: string | null
          email_notifications_enabled: boolean | null
          id: string
          image_analysis_enabled: boolean | null
          market_alerts_enabled: boolean | null
          nickname: string | null
          professional_signals_enabled: boolean | null
          subscription_expires_at: string | null
          supply_demand_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_code?: string | null
          alert_before_minutes?: number | null
          avatar_url?: string | null
          created_at?: string
          economic_alerts_enabled?: boolean | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          image_analysis_enabled?: boolean | null
          market_alerts_enabled?: boolean | null
          nickname?: string | null
          professional_signals_enabled?: boolean | null
          subscription_expires_at?: string | null
          supply_demand_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_code?: string | null
          alert_before_minutes?: number | null
          avatar_url?: string | null
          created_at?: string
          economic_alerts_enabled?: boolean | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          image_analysis_enabled?: boolean | null
          market_alerts_enabled?: boolean | null
          nickname?: string | null
          professional_signals_enabled?: boolean | null
          subscription_expires_at?: string | null
          supply_demand_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_chart_analyses: {
        Row: {
          analysis_text: string
          annotated_image_url: string
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          analysis_text: string
          annotated_image_url: string
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          analysis_text?: string
          annotated_image_url?: string
          created_at?: string
          id?: string
          symbol?: string
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
      trading_goal_progress: {
        Row: {
          achieved_amount: number | null
          completed_at: string | null
          created_at: string
          day_number: number
          goal_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_amount?: number | null
          completed_at?: string | null
          created_at?: string
          day_number: number
          goal_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_amount?: number | null
          completed_at?: string | null
          created_at?: string
          day_number?: number
          goal_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_goals: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          initial_capital: number
          is_active: boolean | null
          loss_compensation_rate: number | null
          market_type: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          initial_capital: number
          is_active?: boolean | null
          loss_compensation_rate?: number | null
          market_type: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          initial_capital?: number
          is_active?: boolean | null
          loss_compensation_rate?: number | null
          market_type?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_journal: {
        Row: {
          created_at: string
          daily_achieved: number | null
          daily_goal: number | null
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          lessons_learned: string | null
          notes: string | null
          profit_loss: number | null
          result: string | null
          symbol: string | null
          trade_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_achieved?: number | null
          daily_goal?: number | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          profit_loss?: number | null
          result?: string | null
          symbol?: string | null
          trade_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_achieved?: number | null
          daily_goal?: number | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          profit_loss?: number | null
          result?: string | null
          symbol?: string | null
          trade_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_economic_alerts: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notified_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notified_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notified_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_economic_alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "economic_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          category: string
          created_at: string
          id: string
          symbol: string
          symbol_name_ar: string
          symbol_name_en: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          symbol: string
          symbol_name_ar: string
          symbol_name_en: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          symbol?: string
          symbol_name_ar?: string
          symbol_name_en?: string
          user_id?: string
        }
        Relationships: []
      }
      user_market_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          market_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          market_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          market_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_market_preferences_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
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
      virtual_trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          opened_at: string
          order_type: string
          profit_loss: number | null
          quantity: number
          status: string
          stop_loss: number | null
          symbol: string
          symbol_name_ar: string
          take_profit: number | null
          trade_type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          opened_at?: string
          order_type: string
          profit_loss?: number | null
          quantity: number
          status?: string
          stop_loss?: number | null
          symbol: string
          symbol_name_ar: string
          take_profit?: number | null
          trade_type: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          opened_at?: string
          order_type?: string
          profit_loss?: number | null
          quantity?: number
          status?: string
          stop_loss?: number | null
          symbol?: string
          symbol_name_ar?: string
          take_profit?: number | null
          trade_type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_trades_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "virtual_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          initial_balance: number
          losing_trades: number
          total_profit_loss: number
          total_trades: number
          updated_at: string
          user_id: string
          winning_trades: number
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          initial_balance?: number
          losing_trades?: number
          total_profit_loss?: number
          total_trades?: number
          updated_at?: string
          user_id: string
          winning_trades?: number
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          initial_balance?: number
          losing_trades?: number
          total_profit_loss?: number
          total_trades?: number
          updated_at?: string
          user_id?: string
          winning_trades?: number
        }
        Relationships: []
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
