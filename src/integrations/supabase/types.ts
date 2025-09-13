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
      ai_configurations: {
        Row: {
          api_key_encrypted: string | null
          config_json: Json | null
          created_at: string | null
          id: string
          provider_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          config_json?: Json | null
          created_at?: string | null
          id?: string
          provider_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          config_json?: Json | null
          created_at?: string | null
          id?: string
          provider_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      article_tags: {
        Row: {
          article_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category: string
          columnist_avatar: string | null
          columnist_bio: string | null
          columnist_id: string | null
          columnist_name: string | null
          columnist_specialty: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          excerpt: string
          featured: boolean | null
          featured_image: string | null
          id: string
          is_column_copy: boolean | null
          original_article_id: string | null
          source_domain: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["article_status"] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          columnist_avatar?: string | null
          columnist_bio?: string | null
          columnist_id?: string | null
          columnist_name?: string | null
          columnist_specialty?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          excerpt: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          is_column_copy?: boolean | null
          original_article_id?: string | null
          source_domain?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          columnist_avatar?: string | null
          columnist_bio?: string | null
          columnist_id?: string | null
          columnist_name?: string | null
          columnist_specialty?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          excerpt?: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          is_column_copy?: boolean | null
          original_article_id?: string | null
          source_domain?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_original_article_id_fkey"
            columns: ["original_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_normalized: {
        Row: {
          author_id: string
          body_richtext: string
          category_id: string
          comments_count: number | null
          cover_image_url: string | null
          cover_media_id: string | null
          created_at: string | null
          excerpt: string
          featured: boolean | null
          id: string
          meta_jsonb: Json | null
          published_at: string | null
          scheduled_for: string | null
          seo_jsonb: Json | null
          slug: string
          status: Database["public"]["Enums"]["article_status"] | null
          subtitle: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id: string
          body_richtext: string
          category_id: string
          comments_count?: number | null
          cover_image_url?: string | null
          cover_media_id?: string | null
          created_at?: string | null
          excerpt: string
          featured?: boolean | null
          id?: string
          meta_jsonb?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_jsonb?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"] | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string
          body_richtext?: string
          category_id?: string
          comments_count?: number | null
          cover_image_url?: string | null
          cover_media_id?: string | null
          created_at?: string | null
          excerpt?: string
          featured?: boolean | null
          id?: string
          meta_jsonb?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_jsonb?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"] | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_normalized_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_normalized_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_normalized_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          context: Json | null
          created_at: string | null
          entity: string
          entity_id: string
          event: string
          id: string
          level: Database["public"]["Enums"]["audit_level"] | null
          payload_jsonb: Json | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          entity: string
          entity_id: string
          event: string
          id?: string
          level?: Database["public"]["Enums"]["audit_level"] | null
          payload_jsonb?: Json | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: string
          event?: string
          id?: string
          level?: Database["public"]["Enums"]["audit_level"] | null
          payload_jsonb?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          social_jsonb: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          social_jsonb?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          social_jsonb?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_type: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          image_url: string
          is_pilot: boolean
          sort_order: number
          start_date: string | null
          status: string
          target_category: string | null
          target_columnist_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          is_pilot?: boolean
          sort_order?: number
          start_date?: string | null
          status?: string
          target_category?: string | null
          target_columnist_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_pilot?: boolean
          sort_order?: number
          start_date?: string | null
          status?: string
          target_category?: string | null
          target_columnist_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_settings: {
        Row: {
          allow_replies: boolean | null
          auto_approve: boolean | null
          auto_approve_keywords: string[] | null
          auto_reject_keywords: string[] | null
          blocked_emails: string[] | null
          created_at: string | null
          id: string
          max_content_length: number | null
          moderation_enabled: boolean | null
          require_email: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_replies?: boolean | null
          auto_approve?: boolean | null
          auto_approve_keywords?: string[] | null
          auto_reject_keywords?: string[] | null
          blocked_emails?: string[] | null
          created_at?: string | null
          id?: string
          max_content_length?: number | null
          moderation_enabled?: boolean | null
          require_email?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_replies?: boolean | null
          auto_approve?: boolean | null
          auto_approve_keywords?: string[] | null
          auto_reject_keywords?: string[] | null
          blocked_emails?: string[] | null
          created_at?: string | null
          id?: string
          max_content_length?: number | null
          moderation_enabled?: boolean | null
          require_email?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          email: string
          id: string
          ip_address: unknown | null
          name: string
          parent_id: string | null
          status: Database["public"]["Enums"]["comment_status"] | null
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          name: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          name?: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          address: string
          city: string
          created_at: string
          email1: string
          email2: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          phone1: string
          phone2: string | null
          saturday_hours: string
          state: string
          sunday_hours: string
          twitter_url: string | null
          updated_at: string
          weekdays_hours: string
          youtube_url: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email1: string
          email2?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          phone1: string
          phone2?: string | null
          saturday_hours: string
          state: string
          sunday_hours: string
          twitter_url?: string | null
          updated_at?: string
          weekdays_hours: string
          youtube_url?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email1?: string
          email2?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          phone1?: string
          phone2?: string | null
          saturday_hours?: string
          state?: string
          sunday_hours?: string
          twitter_url?: string | null
          updated_at?: string
          weekdays_hours?: string
          youtube_url?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      favorite_sites: {
        Row: {
          created_at: string
          description: string | null
          favicon_url: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      legal_content: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      local_storage_backup: {
        Row: {
          id: string
          migrated_at: string | null
          storage_key: string
          storage_value: Json
          user_id: string | null
        }
        Insert: {
          id?: string
          migrated_at?: string | null
          storage_key: string
          storage_value: Json
          user_id?: string | null
        }
        Update: {
          id?: string
          migrated_at?: string | null
          storage_key?: string
          storage_value?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          bucket_name: string
          checksum: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          height: number | null
          id: string
          meta_jsonb: Json | null
          mime_type: string
          original_name: string | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          bucket_name?: string
          checksum?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          height?: number | null
          id?: string
          meta_jsonb?: Json | null
          mime_type: string
          original_name?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          bucket_name?: string
          checksum?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          height?: number | null
          id?: string
          meta_jsonb?: Json | null
          mime_type?: string
          original_name?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          click_count: number | null
          content: string
          created_at: string | null
          html_content: string
          id: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          subject: string
          tags: string[] | null
          title: string
        }
        Insert: {
          click_count?: number | null
          content: string
          created_at?: string | null
          html_content: string
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject: string
          tags?: string[] | null
          title: string
        }
        Update: {
          click_count?: number | null
          content?: string
          created_at?: string | null
          html_content?: string
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          name: string | null
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at: string | null
          tags: string[] | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at?: string | null
          tags?: string[] | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at?: string | null
          tags?: string[] | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      newsletter_templates: {
        Row: {
          content: string
          created_at: string | null
          html_content: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          html_content: string
          id?: string
          name: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          html_content?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allowed_categories: string[] | null
          avatar: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          specialty: string | null
          temp_password: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          allowed_categories?: string[] | null
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          temp_password?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          allowed_categories?: string[] | null
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          temp_password?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      radio_programs: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          host: string
          id: string
          is_active: boolean
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          host: string
          id?: string
          is_active?: boolean
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          host?: string
          id?: string
          is_active?: boolean
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_publish_scheduled_articles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_article_views: {
        Args: { article_id: string }
        Returns: undefined
      }
      is_active_columnist: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_active_columnist_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_user_password: {
        Args: { new_password: string; user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      article_status: "draft" | "published"
      audit_level: "info" | "warn" | "error"
      banner_type: "image" | "html" | "embed"
      campaign_status: "draft" | "scheduled" | "sent"
      comment_status: "pending" | "approved" | "rejected"
      subscriber_status: "active" | "unsubscribed" | "bounced"
      user_role: "admin" | "colunista"
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
      article_status: ["draft", "published"],
      audit_level: ["info", "warn", "error"],
      banner_type: ["image", "html", "embed"],
      campaign_status: ["draft", "scheduled", "sent"],
      comment_status: ["pending", "approved", "rejected"],
      subscriber_status: ["active", "unsubscribed", "bounced"],
      user_role: ["admin", "colunista"],
    },
  },
} as const
