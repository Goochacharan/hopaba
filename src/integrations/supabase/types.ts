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
      admin_users: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      business_reviews: {
        Row: {
          business_id: string
          created_at: string
          criteria_ratings: Json | null
          id: string
          is_hidden_gem: boolean | null
          is_must_visit: boolean | null
          rating: number
          reviewer_name: string
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          criteria_ratings?: Json | null
          id?: string
          is_hidden_gem?: boolean | null
          is_must_visit?: boolean | null
          rating: number
          reviewer_name: string
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          criteria_ratings?: Json | null
          id?: string
          is_hidden_gem?: boolean | null
          is_must_visit?: boolean | null
          rating?: number
          reviewer_name?: string
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_notes: {
        Row: {
          content: Json
          created_at: string
          id: string
          images: string[] | null
          location_id: string
          social_links: Json | null
          thumbs_up: number | null
          thumbs_up_users: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          images?: string[] | null
          location_id: string
          social_links?: Json | null
          thumbs_up?: number | null
          thumbs_up_users?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          images?: string[] | null
          location_id?: string
          social_links?: Json | null
          thumbs_up?: number | null
          thumbs_up_users?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          provider_id: string
          request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          provider_id: string
          request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          provider_id?: string
          request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approval_status: string
          attendees: number | null
          created_at: string
          date: string
          description: string
          id: string
          image: string
          location: string
          price_per_person: number | null
          time: string
          title: string
          user_id: string | null
        }
        Insert: {
          approval_status?: string
          attendees?: number | null
          created_at?: string
          date: string
          description: string
          id?: string
          image: string
          location: string
          price_per_person?: number | null
          time: string
          title: string
          user_id?: string | null
        }
        Update: {
          approval_status?: string
          attendees?: number | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          image?: string
          location?: string
          price_per_person?: number | null
          time?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      location_reviews: {
        Row: {
          created_at: string
          criteria_ratings: Json | null
          id: string
          is_hidden_gem: boolean | null
          is_must_visit: boolean | null
          location_id: string
          rating: number
          reviewer_name: string
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria_ratings?: Json | null
          id?: string
          is_hidden_gem?: boolean | null
          is_must_visit?: boolean | null
          location_id: string
          rating: number
          reviewer_name: string
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria_ratings?: Json | null
          id?: string
          is_hidden_gem?: boolean | null
          is_must_visit?: boolean | null
          location_id?: string
          rating?: number
          reviewer_name?: string
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          approval_status: string
          area: string
          bill_images: string[] | null
          category: string
          city: string
          condition: string
          created_at: string
          damage_images: string[] | null
          description: string
          id: string
          images: string[] | null
          inspection_certificates: string[] | null
          is_negotiable: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          map_link: string | null
          model_year: string | null
          ownership_number: string | null
          postal_code: string
          price: number
          seller_id: string | null
          seller_instagram: string | null
          seller_listing_limit: number | null
          seller_name: string
          seller_phone: string | null
          seller_rating: number | null
          seller_role: string
          seller_whatsapp: string | null
          shop_images: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          area: string
          bill_images?: string[] | null
          category: string
          city: string
          condition: string
          created_at?: string
          damage_images?: string[] | null
          description: string
          id?: string
          images?: string[] | null
          inspection_certificates?: string[] | null
          is_negotiable?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          map_link?: string | null
          model_year?: string | null
          ownership_number?: string | null
          postal_code: string
          price: number
          seller_id?: string | null
          seller_instagram?: string | null
          seller_listing_limit?: number | null
          seller_name: string
          seller_phone?: string | null
          seller_rating?: number | null
          seller_role?: string
          seller_whatsapp?: string | null
          shop_images?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          area?: string
          bill_images?: string[] | null
          category?: string
          city?: string
          condition?: string
          created_at?: string
          damage_images?: string[] | null
          description?: string
          id?: string
          images?: string[] | null
          inspection_certificates?: string[] | null
          is_negotiable?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_link?: string | null
          model_year?: string | null
          ownership_number?: string | null
          postal_code?: string
          price?: number
          seller_id?: string | null
          seller_instagram?: string | null
          seller_listing_limit?: number | null
          seller_name?: string
          seller_phone?: string | null
          seller_rating?: number | null
          seller_role?: string
          seller_whatsapp?: string | null
          shop_images?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string
          created_at: string
          delivery_available: boolean | null
          id: string
          negotiable_price: number | null
          pricing_type: string | null
          quotation_images: string[] | null
          quotation_price: number | null
          read: boolean
          sender_id: string
          sender_type: string
          wholesale_price: number | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id: string
          created_at?: string
          delivery_available?: boolean | null
          id?: string
          negotiable_price?: number | null
          pricing_type?: string | null
          quotation_images?: string[] | null
          quotation_price?: number | null
          read?: boolean
          sender_id: string
          sender_type: string
          wholesale_price?: number | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string
          delivery_available?: boolean | null
          id?: string
          negotiable_price?: number | null
          pricing_type?: string | null
          quotation_images?: string[] | null
          quotation_price?: number | null
          read?: boolean
          sender_id?: string
          sender_type?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      note_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          note_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "community_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          address: string
          category: string
          city: string | null
          created_at: string
          description: string
          distance: string | null
          hours: string | null
          id: string
          image: string
          images: string[] | null
          instagram: string | null
          name: string
          open_now: boolean | null
          phone: string | null
          price: string | null
          price_level: string | null
          rating: number | null
          review_count: number | null
          tags: string[] | null
          website: string | null
        }
        Insert: {
          address: string
          category: string
          city?: string | null
          created_at?: string
          description: string
          distance?: string | null
          hours?: string | null
          id?: string
          image: string
          images?: string[] | null
          instagram?: string | null
          name: string
          open_now?: boolean | null
          phone?: string | null
          price?: string | null
          price_level?: string | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          city?: string | null
          created_at?: string
          description?: string
          distance?: string | null
          hours?: string | null
          id?: string
          image?: string
          images?: string[] | null
          instagram?: string | null
          name?: string
          open_now?: boolean | null
          phone?: string | null
          price?: string | null
          price_level?: string | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      review_criteria: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_listing_limits: {
        Row: {
          created_at: string
          id: string
          max_listings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_listings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_listings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_id: string | null
          reviewer_name: string
          seller_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          rating: number
          reviewer_id?: string | null
          reviewer_name: string
          seller_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string | null
          reviewer_name?: string
          seller_id?: string
        }
        Relationships: []
      }
      sellers: {
        Row: {
          created_at: string | null
          id: string
          listing_limit: number | null
          seller_id: string | null
          seller_instagram: string | null
          seller_name: string
          seller_phone: string | null
          seller_rating: number | null
          seller_whatsapp: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_limit?: number | null
          seller_id?: string | null
          seller_instagram?: string | null
          seller_name: string
          seller_phone?: string | null
          seller_rating?: number | null
          seller_whatsapp?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_limit?: number | null
          seller_id?: string | null
          seller_instagram?: string | null
          seller_name?: string
          seller_phone?: string | null
          seller_rating?: number | null
          seller_whatsapp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          address: string
          approval_status: string | null
          area: string
          availability: string | null
          availability_days: string[] | null
          availability_end_time: string | null
          availability_start_time: string | null
          category: string
          city: string
          contact_email: string | null
          contact_phone: string
          created_at: string
          description: string
          experience: string | null
          hours: string | null
          id: string
          images: string[] | null
          instagram: string | null
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          map_link: string | null
          name: string
          postal_code: string
          price_range_max: number | null
          price_range_min: number | null
          price_unit: string | null
          subcategory: string[] | null
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string
        }
        Insert: {
          address?: string
          approval_status?: string | null
          area: string
          availability?: string | null
          availability_days?: string[] | null
          availability_end_time?: string | null
          availability_start_time?: string | null
          category: string
          city: string
          contact_email?: string | null
          contact_phone: string
          created_at?: string
          description: string
          experience?: string | null
          hours?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          map_link?: string | null
          name: string
          postal_code: string
          price_range_max?: number | null
          price_range_min?: number | null
          price_unit?: string | null
          subcategory?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp: string
        }
        Update: {
          address?: string
          approval_status?: string | null
          area?: string
          availability?: string | null
          availability_days?: string[] | null
          availability_end_time?: string | null
          availability_start_time?: string | null
          category?: string
          city?: string
          contact_email?: string | null
          contact_phone?: string
          created_at?: string
          description?: string
          experience?: string | null
          hours?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          map_link?: string | null
          name?: string
          postal_code?: string
          price_range_max?: number | null
          price_range_min?: number | null
          price_unit?: string | null
          subcategory?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          area: string
          budget: number | null
          category: string
          city: string
          contact_phone: string
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          description: string
          id: string
          images: string[] | null
          postal_code: string
          status: string
          subcategory: string | null
          title: string
          user_id: string
        }
        Insert: {
          area: string
          budget?: number | null
          category: string
          city: string
          contact_phone: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          description: string
          id?: string
          images?: string[] | null
          postal_code: string
          status?: string
          subcategory?: string | null
          title: string
          user_id: string
        }
        Update: {
          area?: string
          budget?: number | null
          category?: string
          city?: string
          contact_phone?: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string
          id?: string
          images?: string[] | null
          postal_code?: string
          status?: string
          subcategory?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      high_limit_sellers: {
        Row: {
          current_listing_count: number | null
          max_listings: number | null
          seller_names: string[] | null
          seller_phones: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_service_request_cascade: {
        Args: { request_id_param: string; user_id_param: string }
        Returns: undefined
      }
      get_high_limit_sellers: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          max_listings: number
          updated_at: string
          seller_names: string[]
          seller_phones: string[]
          current_listing_count: number
        }[]
      }
      get_matching_providers_for_request: {
        Args: { request_id: string }
        Returns: {
          provider_id: string
          provider_name: string
          provider_category: string
          provider_subcategory: string
          user_id: string
        }[]
      }
      get_unread_message_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_unread_message_count_for_user_requests: {
        Args: { user_uuid: string }
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_enhanced_listings: {
        Args: { search_query: string }
        Returns: {
          id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          model_year: string
          location: string
          map_link: string
          seller_name: string
          seller_id: string
          seller_phone: string
          seller_whatsapp: string
          seller_instagram: string
          seller_rating: number
          review_count: number
          images: string[]
          created_at: string
          approval_status: string
          is_negotiable: boolean
          search_rank: number
        }[]
      }
      search_enhanced_providers: {
        Args: { search_query: string }
        Returns: {
          id: string
          name: string
          category: string
          description: string
          address: string
          area: string
          city: string
          contact_phone: string
          contact_email: string
          website: string
          instagram: string
          map_link: string
          price_range_min: number
          price_range_max: number
          price_unit: string
          availability: string
          availability_days: string[]
          availability_start_time: string
          availability_end_time: string
          tags: string[]
          images: string[]
          hours: string
          languages: string[]
          experience: string
          created_at: string
          approval_status: string
          search_rank: number
        }[]
      }
      search_recommendations: {
        Args: { search_query: string; category_filter?: string }
        Returns: {
          id: string
          name: string
          image: string
          images: string[]
          category: string
          description: string
          address: string
          rating: number
          price: string
          price_level: string
          phone: string
          website: string
          open_now: boolean
          hours: string
          distance: string
          tags: string[]
          city: string
          instagram: string
          review_count: number
          similarity: number
        }[]
      }
      search_suggestions: {
        Args: { search_term: string }
        Returns: {
          suggestion: string
          category: string
          source: string
        }[]
      }
      update_seller_listing_limit: {
        Args: {
          admin_user_id: string
          target_seller_phone: string
          new_limit: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
