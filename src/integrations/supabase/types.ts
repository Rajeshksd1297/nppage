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
      admin_contact_form_settings: {
        Row: {
          allow_attachments: boolean | null
          auto_moderation: boolean | null
          blocked_domains: Json | null
          created_at: string
          enable_honeypot: boolean | null
          id: string
          max_attachment_size_mb: number | null
          max_message_length: number | null
          max_submissions_per_hour: number | null
          required_fields: Json | null
          retention_days: number | null
          updated_at: string
        }
        Insert: {
          allow_attachments?: boolean | null
          auto_moderation?: boolean | null
          blocked_domains?: Json | null
          created_at?: string
          enable_honeypot?: boolean | null
          id?: string
          max_attachment_size_mb?: number | null
          max_message_length?: number | null
          max_submissions_per_hour?: number | null
          required_fields?: Json | null
          retention_days?: number | null
          updated_at?: string
        }
        Update: {
          allow_attachments?: boolean | null
          auto_moderation?: boolean | null
          blocked_domains?: Json | null
          created_at?: string
          enable_honeypot?: boolean | null
          id?: string
          max_attachment_size_mb?: number | null
          max_message_length?: number | null
          max_submissions_per_hour?: number | null
          required_fields?: Json | null
          retention_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          award_date: string | null
          award_image_url: string | null
          category: string | null
          certificate_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          organization: string | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          award_date?: string | null
          award_image_url?: string | null
          category?: string | null
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          organization?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          award_date?: string | null
          award_image_url?: string | null
          category?: string | null
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          organization?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      awards_settings: {
        Row: {
          allow_user_submissions: boolean | null
          allowed_image_types: string[] | null
          auto_generate_certificates: boolean | null
          categories: string[] | null
          created_at: string
          enable_public_display: boolean | null
          id: string
          max_awards_per_user: number | null
          max_description_length: number | null
          max_image_size_mb: number | null
          max_title_length: number | null
          require_approval: boolean | null
          require_verification: boolean | null
          sort_by_date: boolean | null
          updated_at: string
        }
        Insert: {
          allow_user_submissions?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_certificates?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_public_display?: boolean | null
          id?: string
          max_awards_per_user?: number | null
          max_description_length?: number | null
          max_image_size_mb?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          require_verification?: boolean | null
          sort_by_date?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_user_submissions?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_certificates?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_public_display?: boolean | null
          id?: string
          max_awards_per_user?: number | null
          max_description_length?: number | null
          max_image_size_mb?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          require_verification?: boolean | null
          sort_by_date?: boolean | null
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "billing_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured: boolean | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          allow_html: boolean
          allowed_image_size_mb: number
          allowed_image_types: string[]
          auto_generate_slug: boolean
          categories: Json
          created_at: string
          default_status: string
          id: string
          max_content_length: number
          max_excerpt_length: number
          max_title_length: number
          require_approval: boolean
          updated_at: string
        }
        Insert: {
          allow_html?: boolean
          allowed_image_size_mb?: number
          allowed_image_types?: string[]
          auto_generate_slug?: boolean
          categories?: Json
          created_at?: string
          default_status?: string
          id?: string
          max_content_length?: number
          max_excerpt_length?: number
          max_title_length?: number
          require_approval?: boolean
          updated_at?: string
        }
        Update: {
          allow_html?: boolean
          allowed_image_size_mb?: number
          allowed_image_types?: string[]
          auto_generate_slug?: boolean
          categories?: Json
          created_at?: string
          default_status?: string
          id?: string
          max_content_length?: number
          max_excerpt_length?: number
          max_title_length?: number
          require_approval?: boolean
          updated_at?: string
        }
        Relationships: []
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
      contact_replies: {
        Row: {
          contact_submission_id: string
          created_at: string
          id: string
          is_internal: boolean | null
          replied_by: string
          reply_message: string
          updated_at: string
        }
        Insert: {
          contact_submission_id: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          replied_by: string
          reply_message: string
          updated_at?: string
        }
        Update: {
          contact_submission_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          replied_by?: string
          reply_message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_replies_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          contacted_user_id: string | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string
          priority: string | null
          replied_at: string | null
          resolved_at: string | null
          source: string | null
          status: string
          subject: string | null
          submitted_by: string | null
          updated_at: string
          user_agent: string | null
          user_ip: unknown | null
        }
        Insert: {
          assigned_to?: string | null
          contacted_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name: string
          priority?: string | null
          replied_at?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string
          subject?: string | null
          submitted_by?: string | null
          updated_at?: string
          user_agent?: string | null
          user_ip?: unknown | null
        }
        Update: {
          assigned_to?: string | null
          contacted_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          replied_at?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string
          subject?: string | null
          submitted_by?: string | null
          updated_at?: string
          user_agent?: string | null
          user_ip?: unknown | null
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
      event_settings: {
        Row: {
          allow_user_events: boolean | null
          allowed_image_types: string[] | null
          categories: string[] | null
          created_at: string
          default_event_duration: number | null
          id: string
          max_attendees_default: number | null
          max_content_length: number | null
          max_image_size: number | null
          max_title_length: number | null
          require_approval: boolean | null
          updated_at: string
        }
        Insert: {
          allow_user_events?: boolean | null
          allowed_image_types?: string[] | null
          categories?: string[] | null
          created_at?: string
          default_event_duration?: number | null
          id?: string
          max_attendees_default?: number | null
          max_content_length?: number | null
          max_image_size?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_user_events?: boolean | null
          allowed_image_types?: string[] | null
          categories?: string[] | null
          created_at?: string
          default_event_duration?: number | null
          id?: string
          max_attendees_default?: number | null
          max_content_length?: number | null
          max_image_size?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string | null
          featured_image_url: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          max_attendees: number | null
          meeting_link: string | null
          registration_required: boolean | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string | null
          featured_image_url?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          registration_required?: boolean | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string | null
          featured_image_url?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          registration_required?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faq_settings: {
        Row: {
          allow_images: boolean | null
          allow_user_submissions: boolean | null
          allowed_image_types: string[] | null
          auto_publish: boolean | null
          categories: string[] | null
          created_at: string
          enable_public_display: boolean | null
          id: string
          max_answer_length: number | null
          max_faqs_per_user: number | null
          max_image_size_mb: number | null
          max_question_length: number | null
          require_approval: boolean | null
          require_category: boolean | null
          sort_by_order: boolean | null
          updated_at: string
        }
        Insert: {
          allow_images?: boolean | null
          allow_user_submissions?: boolean | null
          allowed_image_types?: string[] | null
          auto_publish?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_public_display?: boolean | null
          id?: string
          max_answer_length?: number | null
          max_faqs_per_user?: number | null
          max_image_size_mb?: number | null
          max_question_length?: number | null
          require_approval?: boolean | null
          require_category?: boolean | null
          sort_by_order?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_images?: boolean | null
          allow_user_submissions?: boolean | null
          allowed_image_types?: string[] | null
          auto_publish?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_public_display?: boolean | null
          id?: string
          max_answer_length?: number | null
          max_faqs_per_user?: number | null
          max_image_size_mb?: number | null
          max_question_length?: number | null
          require_approval?: boolean | null
          require_category?: boolean | null
          sort_by_order?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_settings: {
        Row: {
          allow_user_uploads: boolean | null
          allowed_image_types: string[] | null
          auto_generate_thumbnails: boolean | null
          categories: string[] | null
          created_at: string
          enable_watermark: boolean | null
          id: string
          image_compression_quality: number | null
          max_description_length: number | null
          max_image_size_mb: number | null
          max_images_per_user: number | null
          max_title_length: number | null
          require_approval: boolean | null
          updated_at: string
        }
        Insert: {
          allow_user_uploads?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_thumbnails?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_watermark?: boolean | null
          id?: string
          image_compression_quality?: number | null
          max_description_length?: number | null
          max_image_size_mb?: number | null
          max_images_per_user?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_user_uploads?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_thumbnails?: boolean | null
          categories?: string[] | null
          created_at?: string
          enable_watermark?: boolean | null
          id?: string
          image_compression_quality?: number | null
          max_description_length?: number | null
          max_image_size_mb?: number | null
          max_images_per_user?: number | null
          max_title_length?: number | null
          require_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      helpdesk_settings: {
        Row: {
          auto_assign_tickets: boolean
          business_hours: Json
          categories: Json
          created_at: string
          default_priority: string
          email_notifications: boolean
          id: string
          sla_response_hours: number
          ticket_number_prefix: string
          ticket_statuses: Json
          updated_at: string
        }
        Insert: {
          auto_assign_tickets?: boolean
          business_hours?: Json
          categories?: Json
          created_at?: string
          default_priority?: string
          email_notifications?: boolean
          id?: string
          sla_response_hours?: number
          ticket_number_prefix?: string
          ticket_statuses?: Json
          updated_at?: string
        }
        Update: {
          auto_assign_tickets?: boolean
          business_hours?: Json
          categories?: Json
          created_at?: string
          default_priority?: string
          email_notifications?: boolean
          id?: string
          sla_response_hours?: number
          ticket_number_prefix?: string
          ticket_statuses?: Json
          updated_at?: string
        }
        Relationships: []
      }
      hero_blocks: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          preview_image_url: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          preview_image_url?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          preview_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_page_sections: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          order_index: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          order_index?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          order_index?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_audit_log: {
        Row: {
          affected_email: string
          id: string
          ip_address: unknown | null
          operation: string
          performed_at: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          affected_email: string
          id?: string
          ip_address?: unknown | null
          operation: string
          performed_at?: string
          table_name?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          affected_email?: string
          id?: string
          ip_address?: unknown | null
          operation?: string
          performed_at?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_settings: {
        Row: {
          allow_html_content: boolean | null
          allow_images: boolean | null
          allow_user_newsletters: boolean | null
          allowed_image_types: string[] | null
          auto_generate_thumbnails: boolean | null
          auto_schedule_enabled: boolean | null
          categories: string[] | null
          created_at: string
          default_send_time: string | null
          default_template: string | null
          enable_a_b_testing: boolean | null
          enable_tracking: boolean | null
          enable_unsubscribe_link: boolean | null
          from_email: string | null
          from_name: string | null
          id: string
          image_compression_quality: number | null
          max_content_length: number | null
          max_image_size_mb: number | null
          max_newsletters_per_user: number | null
          max_recipients_per_campaign: number | null
          max_subject_length: number | null
          reply_to_email: string | null
          require_category: boolean | null
          require_content_approval: boolean | null
          require_email_verification: boolean | null
          send_rate_limit_per_hour: number | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          allow_html_content?: boolean | null
          allow_images?: boolean | null
          allow_user_newsletters?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_thumbnails?: boolean | null
          auto_schedule_enabled?: boolean | null
          categories?: string[] | null
          created_at?: string
          default_send_time?: string | null
          default_template?: string | null
          enable_a_b_testing?: boolean | null
          enable_tracking?: boolean | null
          enable_unsubscribe_link?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          image_compression_quality?: number | null
          max_content_length?: number | null
          max_image_size_mb?: number | null
          max_newsletters_per_user?: number | null
          max_recipients_per_campaign?: number | null
          max_subject_length?: number | null
          reply_to_email?: string | null
          require_category?: boolean | null
          require_content_approval?: boolean | null
          require_email_verification?: boolean | null
          send_rate_limit_per_hour?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          allow_html_content?: boolean | null
          allow_images?: boolean | null
          allow_user_newsletters?: boolean | null
          allowed_image_types?: string[] | null
          auto_generate_thumbnails?: boolean | null
          auto_schedule_enabled?: boolean | null
          categories?: string[] | null
          created_at?: string
          default_send_time?: string | null
          default_template?: string | null
          enable_a_b_testing?: boolean | null
          enable_tracking?: boolean | null
          enable_unsubscribe_link?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          image_compression_quality?: number | null
          max_content_length?: number | null
          max_image_size_mb?: number | null
          max_newsletters_per_user?: number | null
          max_recipients_per_campaign?: number | null
          max_subject_length?: number | null
          reply_to_email?: string | null
          require_category?: boolean | null
          require_content_approval?: boolean | null
          require_email_verification?: boolean | null
          send_rate_limit_per_hour?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          status: string | null
          subscribed_at: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string | null
          subscribed_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string | null
          subscribed_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
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
          {
            foreignKeyName: "onix_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          active_theme_customization_id: string | null
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          custom_domain_id: string | null
          email: string | null
          full_name: string | null
          id: string
          mobile_number: string | null
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
          active_theme_customization_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          custom_domain_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          mobile_number?: string | null
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
          active_theme_customization_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          custom_domain_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile_number?: string | null
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
            foreignKeyName: "profiles_active_theme_customization_id_fkey"
            columns: ["active_theme_customization_id"]
            isOneToOne: false
            referencedRelation: "user_theme_customizations"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "publisher_authors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "social_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          advanced_analytics: boolean
          available_themes: Json | null
          awards: boolean | null
          blog: boolean | null
          contact_form: boolean
          created_at: string
          custom_domain: boolean
          events: boolean | null
          faq: boolean | null
          features: Json
          gallery: boolean | null
          id: string
          max_books: number | null
          max_publications: number | null
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
          available_themes?: Json | null
          awards?: boolean | null
          blog?: boolean | null
          contact_form?: boolean
          created_at?: string
          custom_domain?: boolean
          events?: boolean | null
          faq?: boolean | null
          features?: Json
          gallery?: boolean | null
          id?: string
          max_books?: number | null
          max_publications?: number | null
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
          available_themes?: Json | null
          awards?: boolean | null
          blog?: boolean | null
          contact_form?: boolean
          created_at?: string
          custom_domain?: boolean
          events?: boolean | null
          faq?: boolean | null
          features?: Json
          gallery?: boolean | null
          id?: string
          max_books?: number | null
          max_publications?: number | null
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
      theme_usage_analytics: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          theme_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          theme_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          theme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_usage_analytics_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
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
      ticket_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          ticket_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          ticket_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          ticket_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          ticket_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_contact_form_settings: {
        Row: {
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          auto_reply_subject: string | null
          collect_company: boolean | null
          collect_phone: boolean | null
          created_at: string
          custom_fields: Json | null
          enabled: boolean | null
          form_description: string | null
          form_title: string | null
          id: string
          max_message_length: number | null
          notification_email: string | null
          require_subject: boolean | null
          spam_protection: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          auto_reply_subject?: string | null
          collect_company?: boolean | null
          collect_phone?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          enabled?: boolean | null
          form_description?: string | null
          form_title?: string | null
          id?: string
          max_message_length?: number | null
          notification_email?: string | null
          require_subject?: boolean | null
          spam_protection?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          auto_reply_subject?: string | null
          collect_company?: boolean | null
          collect_phone?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          enabled?: boolean | null
          form_description?: string | null
          form_title?: string | null
          id?: string
          max_message_length?: number | null
          notification_email?: string | null
          require_subject?: boolean | null
          spam_protection?: boolean | null
          updated_at?: string
          user_id?: string
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
      user_theme_customizations: {
        Row: {
          created_at: string
          custom_config: Json
          id: string
          is_active: boolean
          theme_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_config?: Json
          id?: string
          is_active?: boolean
          theme_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_config?: Json
          id?: string
          is_active?: boolean
          theme_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_customizations_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          active_theme_customization_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_domain_id: string | null
          full_name: string | null
          id: string | null
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
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          active_theme_customization_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_domain_id?: string | null
          full_name?: string | null
          id?: string | null
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
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          active_theme_customization_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_domain_id?: string | null
          full_name?: string | null
          id?: string | null
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
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_theme_customization_id_fkey"
            columns: ["active_theme_customization_id"]
            isOneToOne: false
            referencedRelation: "user_theme_customizations"
            referencedColumns: ["id"]
          },
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
    }
    Functions: {
      apply_user_theme: {
        Args: { p_custom_config?: Json; p_theme_id: string }
        Returns: string
      }
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
      is_slug_available: {
        Args: { slug_text: string; user_id?: string }
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
