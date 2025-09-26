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
      articles: {
        Row: {
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          processed_at: string | null
          publisher_id: string | null
          status: string
          stripe_transaction_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          publisher_id?: string | null
          status?: string
          stripe_transaction_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          publisher_id?: string | null
          status?: string
          stripe_transaction_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          genres: string[] | null
          id: string
          isbn: string | null
          language: string | null
          page_count: number | null
          publication_date: string | null
          publisher: string | null
          purchase_links: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string | null
          status: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          publication_date?: string | null
          publisher?: string | null
          purchase_links?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          publication_date?: string | null
          publisher?: string | null
          purchase_links?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          created_at: string
          dns_configured: boolean
          domain: string
          id: string
          ssl_enabled: boolean
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          dns_configured?: boolean
          domain: string
          id?: string
          ssl_enabled?: boolean
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          dns_configured?: boolean
          domain?: string
          id?: string
          ssl_enabled?: boolean
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      onix_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_records: number | null
          file_url: string | null
          filename: string
          id: string
          job_type: string
          processed_records: number | null
          publisher_id: string | null
          result_data: Json | null
          started_at: string | null
          status: string
          successful_records: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          file_url?: string | null
          filename: string
          id?: string
          job_type: string
          processed_records?: number | null
          publisher_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          file_url?: string | null
          filename?: string
          id?: string
          job_type?: string
          processed_records?: number | null
          publisher_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onix_jobs_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onix_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analytics: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          page_id: string | null
          page_type: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_id?: string | null
          page_type: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_id?: string | null
          page_type?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          custom_domain_id: string | null
          email: string | null
          full_name: string | null
          id: string
          public_profile: boolean | null
          publisher_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string | null
          social_links: Json | null
          specializations: string[] | null
          subscription_plan_id: string | null
          theme_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          custom_domain_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          public_profile?: boolean | null
          publisher_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          subscription_plan_id?: string | null
          theme_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          custom_domain_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          public_profile?: boolean | null
          publisher_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          subscription_plan_id?: string | null
          theme_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_custom_domain_id_fkey"
            columns: ["custom_domain_id"]
            isOneToOne: false
            referencedRelation: "custom_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      publisher_authors: {
        Row: {
          id: string
          joined_at: string
          publisher_id: string
          revenue_share_percentage: number | null
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          publisher_id: string
          revenue_share_percentage?: number | null
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          publisher_id?: string
          revenue_share_percentage?: number | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publisher_authors_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publisher_authors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      publishers: {
        Row: {
          billing_address: Json | null
          brand_colors: Json | null
          contact_email: string
          created_at: string
          custom_css: string | null
          id: string
          logo_url: string | null
          name: string
          revenue_share_percentage: number | null
          status: string
          subdomain: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          billing_address?: Json | null
          brand_colors?: Json | null
          contact_email: string
          created_at?: string
          custom_css?: string | null
          id?: string
          logo_url?: string | null
          name: string
          revenue_share_percentage?: number | null
          status?: string
          subdomain: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          billing_address?: Json | null
          brand_colors?: Json | null
          contact_email?: string
          created_at?: string
          custom_css?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          revenue_share_percentage?: number | null
          status?: string
          subdomain?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      search_console_data: {
        Row: {
          clicks: number
          created_at: string
          ctr: number
          date: string
          id: string
          impressions: number
          page: string
          position: number
          query: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          ctr?: number
          date: string
          id?: string
          impressions?: number
          page: string
          position?: number
          query: string
        }
        Update: {
          clicks?: number
          created_at?: string
          ctr?: number
          date?: string
          id?: string
          impressions?: number
          page?: string
          position?: number
          query?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          created_at: string
          default_og_image: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_search_console_id: string | null
          id: string
          robots_txt: string | null
          site_description: string
          site_keywords: string | null
          site_title: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_og_image?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_id?: string | null
          id?: string
          robots_txt?: string | null
          site_description?: string
          site_keywords?: string | null
          site_title?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_og_image?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_id?: string | null
          id?: string
          robots_txt?: string | null
          site_description?: string
          site_keywords?: string | null
          site_title?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string
          auto_post_enabled: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          platform: string
          platform_user_id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          auto_post_enabled?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          platform: string
          platform_user_id: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          auto_post_enabled?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          platform_user_id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          article_id: string | null
          book_id: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          post_content: string
          posted_at: string | null
          scheduled_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          book_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          post_content: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          book_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          post_content?: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          advanced_analytics: boolean
          contact_form: boolean
          created_at: string
          custom_domain: boolean
          features: Json
          id: string
          max_books: number | null
          max_publications: number | null
          media_kit: boolean
          name: string
          newsletter_integration: boolean
          no_watermark: boolean
          premium_themes: boolean
          price_monthly: number | null
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          advanced_analytics?: boolean
          contact_form?: boolean
          created_at?: string
          custom_domain?: boolean
          features?: Json
          id?: string
          max_books?: number | null
          max_publications?: number | null
          media_kit?: boolean
          name: string
          newsletter_integration?: boolean
          no_watermark?: boolean
          premium_themes?: boolean
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          advanced_analytics?: boolean
          contact_form?: boolean
          created_at?: string
          custom_domain?: boolean
          features?: Json
          id?: string
          max_books?: number | null
          max_publications?: number | null
          media_kit?: boolean
          name?: string
          newsletter_integration?: boolean
          no_watermark?: boolean
          premium_themes?: boolean
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          premium: boolean
          preview_image_url: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          premium?: boolean
          preview_image_url?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          premium?: boolean
          preview_image_url?: string | null
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
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
