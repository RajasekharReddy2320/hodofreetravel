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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          arrival_date: string | null
          arrival_time: string | null
          booking_details: Json | null
          booking_reference: string
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          class_type: string | null
          created_at: string
          departure_date: string
          departure_time: string
          from_location: string
          id: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_id: string | null
          payment_status: string
          price_inr: number
          qr_code: string | null
          seat_number: string | null
          service_name: string
          service_number: string
          status: string
          to_location: string
          trip_group_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_date?: string | null
          arrival_time?: string | null
          booking_details?: Json | null
          booking_reference: string
          booking_type: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          class_type?: string | null
          created_at?: string
          departure_date: string
          departure_time: string
          from_location: string
          id?: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_id?: string | null
          payment_status?: string
          price_inr: number
          qr_code?: string | null
          seat_number?: string | null
          service_name: string
          service_number: string
          status?: string
          to_location: string
          trip_group_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_date?: string | null
          arrival_time?: string | null
          booking_details?: Json | null
          booking_reference?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          class_type?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string
          from_location?: string
          id?: string
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          payment_id?: string | null
          payment_status?: string
          price_inr?: number
          qr_code?: string | null
          seat_number?: string | null
          service_name?: string
          service_number?: string
          status?: string
          to_location?: string
          trip_group_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bucket_list: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "travel_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          album_id: string | null
          caption: string | null
          created_at: string
          file_path: string
          id: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          itinerary: Json | null
          likes_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          itinerary?: Json | null
          likes_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          itinerary?: Json | null
          likes_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          budget_range: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string | null
          gender: string | null
          home_location: string | null
          id: string
          interests: string[] | null
          is_public: boolean | null
          languages_spoken: string[] | null
          onboarding_completed: boolean | null
          phone: string | null
          state: string | null
          travel_preferences: string[] | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          budget_range?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          home_location?: string | null
          id: string
          interests?: string[] | null
          is_public?: boolean | null
          languages_spoken?: string[] | null
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          travel_preferences?: string[] | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          budget_range?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          home_location?: string | null
          id?: string
          interests?: string[] | null
          is_public?: boolean | null
          languages_spoken?: string[] | null
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          travel_preferences?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          rating: number
          review_text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          rating: number
          review_text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          rating?: number
          review_text?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ticket_verifications: {
        Row: {
          booking_id: string
          id: string
          verification_location: string | null
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          verification_location?: string | null
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          verification_location?: string | null
          verified_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_verifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "travel_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_groups: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          from_location: string
          id: string
          max_members: number | null
          title: string
          to_location: string
          travel_date: string
          travel_mode: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          from_location: string
          id?: string
          max_members?: number | null
          title: string
          to_location: string
          travel_date: string
          travel_mode: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          from_location?: string
          id?: string
          max_members?: number | null
          title?: string
          to_location?: string
          travel_date?: string
          travel_mode?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_likes: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_likes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_segments: {
        Row: {
          arrival_time: string
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          class_type: string | null
          created_at: string | null
          departure_date: string
          departure_time: string
          from_location: string
          id: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_status: string
          price_inr: number
          seat_number: string | null
          segment_order: number
          service_name: string
          service_number: string
          status: string
          to_location: string
          trip_group_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arrival_time: string
          booking_type: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          class_type?: string | null
          created_at?: string | null
          departure_date: string
          departure_time: string
          from_location: string
          id?: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          payment_status?: string
          price_inr: number
          seat_number?: string | null
          segment_order: number
          service_name: string
          service_number: string
          status?: string
          to_location: string
          trip_group_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arrival_time?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          class_type?: string | null
          created_at?: string | null
          departure_date?: string
          departure_time?: string
          from_location?: string
          id?: string
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          payment_status?: string
          price_inr?: number
          seat_number?: string | null
          segment_order?: number
          service_name?: string
          service_number?: string
          status?: string
          to_location?: string
          trip_group_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trip_shares: {
        Row: {
          access_level: string
          created_at: string
          id: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id: string | null
          status: string
          trip_group_id: string
          updated_at: string
        }
        Insert: {
          access_level: string
          created_at?: string
          id?: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id?: string | null
          status?: string
          trip_group_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          id?: string
          owner_id?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
          status?: string
          trip_group_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget_inr: number | null
          created_at: string
          destination: string
          end_date: string
          group_size: number | null
          id: string
          image_url: string | null
          interests: string[] | null
          is_public: boolean | null
          itinerary: Json | null
          likes_count: number | null
          notes: string | null
          planner_mode: string | null
          start_date: string
          title: string
          trip_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_inr?: number | null
          created_at?: string
          destination: string
          end_date: string
          group_size?: number | null
          id?: string
          image_url?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          itinerary?: Json | null
          likes_count?: number | null
          notes?: string | null
          planner_mode?: string | null
          start_date: string
          title: string
          trip_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_inr?: number | null
          created_at?: string
          destination?: string
          end_date?: string
          group_size?: number | null
          id?: string
          image_url?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          itinerary?: Json | null
          likes_count?: number | null
          notes?: string | null
          planner_mode?: string | null
          start_date?: string
          title?: string
          trip_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          id: string
          recipient_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          id?: string
          recipient_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          id?: string
          recipient_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          budget_range: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          home_location: string | null
          id: string | null
          interests: string[] | null
          is_public: boolean | null
          languages_spoken: string[] | null
          state: string | null
          travel_preferences: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          budget_range?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          home_location?: string | null
          id?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          languages_spoken?: string[] | null
          state?: string | null
          travel_preferences?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          budget_range?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          home_location?: string | null
          id?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          languages_spoken?: string[] | null
          state?: string | null
          travel_preferences?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_users_connected: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      get_connection_status: {
        Args: { user1_id: string; user2_id: string }
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
      app_role: "admin" | "moderator" | "user" | "developer"
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
      app_role: ["admin", "moderator", "user", "developer"],
    },
  },
} as const
