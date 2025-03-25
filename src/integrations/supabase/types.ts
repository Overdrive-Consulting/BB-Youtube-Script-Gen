export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts_settings: {
        Row: {
          channel_id: string | null
          channel_url: string | null
          created_at: string | null
          id: string
          status: string | null
          target_audiences: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          channel_url?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          target_audiences?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          channel_url?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          target_audiences?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audience_profile_settings: {
        Row: {
          age_group: string | null
          audience_profile_name: string | null
          created_at: string | null
          gender: string | null
          geographic_region: string | null
          id: string
          interests: string | null
          primary_motivation: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          audience_profile_name?: string | null
          created_at?: string | null
          gender?: string | null
          geographic_region?: string | null
          id?: string
          interests?: string | null
          primary_motivation?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          audience_profile_name?: string | null
          created_at?: string | null
          gender?: string | null
          geographic_region?: string | null
          id?: string
          interests?: string | null
          primary_motivation?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      channel_history: {
        Row: {
          channel_avatar_url: string | null
          channel_banner_url: string | null
          channel_description: string | null
          channel_id: string | null
          channel_location: string | null
          channel_name: string | null
          channel_total_videos: number | null
          channel_total_views: number | null
          growth_12mo: string | null
          growth_3mo: string | null
          growth_6mo: string | null
          id: string
          is_age_restricted: boolean | null
          is_channel_verified: boolean | null
          other_metrics: string | null
          scraped_at: string | null
          subscribers: number | null
        }
        Insert: {
          channel_avatar_url?: string | null
          channel_banner_url?: string | null
          channel_description?: string | null
          channel_id?: string | null
          channel_location?: string | null
          channel_name?: string | null
          channel_total_videos?: number | null
          channel_total_views?: number | null
          growth_12mo?: string | null
          growth_3mo?: string | null
          growth_6mo?: string | null
          id: string
          is_age_restricted?: boolean | null
          is_channel_verified?: boolean | null
          other_metrics?: string | null
          scraped_at?: string | null
          subscribers?: number | null
        }
        Update: {
          channel_avatar_url?: string | null
          channel_banner_url?: string | null
          channel_description?: string | null
          channel_id?: string | null
          channel_location?: string | null
          channel_name?: string | null
          channel_total_videos?: number | null
          channel_total_views?: number | null
          growth_12mo?: string | null
          growth_3mo?: string | null
          growth_6mo?: string | null
          id?: string
          is_age_restricted?: boolean | null
          is_channel_verified?: boolean | null
          other_metrics?: string | null
          scraped_at?: string | null
          subscribers?: number | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_avatar_url: string | null
          channel_banner_url: string | null
          channel_description: string | null
          channel_history: string | null
          channel_history_updated: string | null
          channel_id: string | null
          channel_location: string | null
          channel_name: string | null
          channel_total_videos: number | null
          channel_total_views: number | null
          channel_url: string | null
          date_added: string | null
          date_joined: string | null
          growth_12mo: string | null
          growth_3mo: string | null
          growth_6mo: number | null
          is_age_restricted: boolean | null
          is_channel_verified: boolean | null
          is_tracked: string | null
          last_scraped_date: string | null
          last_updated_at: string | null
          subscribers: number | null
          video_history: string | null
          videos: string | null
        }
        Insert: {
          channel_avatar_url?: string | null
          channel_banner_url?: string | null
          channel_description?: string | null
          channel_history?: string | null
          channel_history_updated?: string | null
          channel_id?: string | null
          channel_location?: string | null
          channel_name?: string | null
          channel_total_videos?: number | null
          channel_total_views?: number | null
          channel_url?: string | null
          date_added?: string | null
          date_joined?: string | null
          growth_12mo?: string | null
          growth_3mo?: string | null
          growth_6mo?: number | null
          is_age_restricted?: boolean | null
          is_channel_verified?: boolean | null
          is_tracked?: string | null
          last_scraped_date?: string | null
          last_updated_at?: string | null
          subscribers?: number | null
          video_history?: string | null
          videos?: string | null
        }
        Update: {
          channel_avatar_url?: string | null
          channel_banner_url?: string | null
          channel_description?: string | null
          channel_history?: string | null
          channel_history_updated?: string | null
          channel_id?: string | null
          channel_location?: string | null
          channel_name?: string | null
          channel_total_videos?: number | null
          channel_total_views?: number | null
          channel_url?: string | null
          date_added?: string | null
          date_joined?: string | null
          growth_12mo?: string | null
          growth_3mo?: string | null
          growth_6mo?: number | null
          is_age_restricted?: boolean | null
          is_channel_verified?: boolean | null
          is_tracked?: string | null
          last_scraped_date?: string | null
          last_updated_at?: string | null
          subscribers?: number | null
          video_history?: string | null
          videos?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      prompt_settings: {
        Row: {
          created_at: string | null
          id: string
          Name: string | null
          Prompt: string | null
          Status: string | null
          "System Message": string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          Name?: string | null
          Prompt?: string | null
          Status?: string | null
          "System Message"?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          Name?: string | null
          Prompt?: string | null
          Status?: string | null
          "System Message"?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_generator_input: {
        Row: {
          created_at: string | null
          id: string
          is_tracked: boolean | null
          reference_for: string | null
          updated_at: string | null
          url_type: string | null
          video_channel_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_tracked?: boolean | null
          reference_for?: string | null
          updated_at?: string | null
          url_type?: string | null
          video_channel_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_tracked?: boolean | null
          reference_for?: string | null
          updated_at?: string | null
          url_type?: string | null
          video_channel_url?: string | null
        }
        Relationships: []
      }
      video_generator_script_pipeline: {
        Row: {
          account: string | null
          created_at: string | null
          description: string | null
          generate_content: string | null
          generated_script_link: string | null
          generated_thumbnail_prompt: string | null
          generated_title: string | null
          id: string
          notes: string | null
          publish_date: string | null
          status: string | null
          target_audiences: string | null
          target_duration: string | null
          title: string | null
          user_id: string | null
          video_type: string | null
        }
        Insert: {
          account?: string | null
          created_at?: string | null
          description?: string | null
          generate_content?: string | null
          generated_script_link?: string | null
          generated_thumbnail_prompt?: string | null
          generated_title?: string | null
          id: string
          notes?: string | null
          publish_date?: string | null
          status?: string | null
          target_audiences?: string | null
          target_duration?: string | null
          title?: string | null
          user_id?: string | null
          video_type?: string | null
        }
        Update: {
          account?: string | null
          created_at?: string | null
          description?: string | null
          generate_content?: string | null
          generated_script_link?: string | null
          generated_thumbnail_prompt?: string | null
          generated_title?: string | null
          id?: string
          notes?: string | null
          publish_date?: string | null
          status?: string | null
          target_audiences?: string | null
          target_duration?: string | null
          title?: string | null
          user_id?: string | null
          video_type?: string | null
        }
        Relationships: []
      }
      video_history: {
        Row: {
          channel_id: string | null
          comments_count: number | null
          date_published: string | null
          duration: string | null
          id: string
          impressions: number | null
          likes_count: number | null
          scraped_at: string | null
          video_id: string | null
          views_count: number | null
          virality_score: string | null
        }
        Insert: {
          channel_id?: string | null
          comments_count?: number | null
          date_published?: string | null
          duration?: string | null
          id: string
          impressions?: number | null
          likes_count?: number | null
          scraped_at?: string | null
          video_id?: string | null
          views_count?: number | null
          virality_score?: string | null
        }
        Update: {
          channel_id?: string | null
          comments_count?: number | null
          date_published?: string | null
          duration?: string | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          scraped_at?: string | null
          video_id?: string | null
          views_count?: number | null
          virality_score?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          channel_id: string | null
          comments_count: number | null
          date_added: string | null
          date_published: string | null
          duration: string | null
          id: string
          impressions: number | null
          is_tracked: string | null
          last_scraped_at: string | null
          last_updated_at: string | null
          likes_count: number | null
          thumbnail_url: string | null
          transcript_url: string | null
          video_history: string | null
          video_id: string | null
          video_title: string | null
          video_url: string | null
          views_count: number | null
          virality_score: string | null
        }
        Insert: {
          channel_id?: string | null
          comments_count?: number | null
          date_added?: string | null
          date_published?: string | null
          duration?: string | null
          id?: string
          impressions?: number | null
          is_tracked?: string | null
          last_scraped_at?: string | null
          last_updated_at?: string | null
          likes_count?: number | null
          thumbnail_url?: string | null
          transcript_url?: string | null
          video_history?: string | null
          video_id?: string | null
          video_title?: string | null
          video_url?: string | null
          views_count?: number | null
          virality_score?: string | null
        }
        Update: {
          channel_id?: string | null
          comments_count?: number | null
          date_added?: string | null
          date_published?: string | null
          duration?: string | null
          id?: string
          impressions?: number | null
          is_tracked?: string | null
          last_scraped_at?: string | null
          last_updated_at?: string | null
          likes_count?: number | null
          thumbnail_url?: string | null
          transcript_url?: string | null
          video_history?: string | null
          video_id?: string | null
          video_title?: string | null
          video_url?: string | null
          views_count?: number | null
          virality_score?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
