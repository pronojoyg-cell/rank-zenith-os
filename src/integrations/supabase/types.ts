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
      daily_tasks: {
        Row: {
          created_at: string
          done: number
          id: string
          target: number
          task_date: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: number
          id?: string
          target?: number
          task_date?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: number
          id?: string
          target?: number
          task_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          created_at: string
          distractions: number
          duration_sec: number
          id: string
          label: string | null
          started_at: string
          subject: Database["public"]["Enums"]["subject_t"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          distractions?: number
          duration_sec?: number
          id?: string
          label?: string | null
          started_at?: string
          subject?: Database["public"]["Enums"]["subject_t"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          distractions?: number
          duration_sec?: number
          id?: string
          label?: string | null
          started_at?: string
          subject?: Database["public"]["Enums"]["subject_t"] | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          chapter: string | null
          created_at: string
          id: string
          mark_cost: number
          notes: string | null
          question: string
          resolved: boolean
          subject: Database["public"]["Enums"]["subject_t"]
          type: Database["public"]["Enums"]["mistake_t"]
          user_id: string
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          id?: string
          mark_cost?: number
          notes?: string | null
          question: string
          resolved?: boolean
          subject: Database["public"]["Enums"]["subject_t"]
          type?: Database["public"]["Enums"]["mistake_t"]
          user_id: string
        }
        Update: {
          chapter?: string | null
          created_at?: string
          id?: string
          mark_cost?: number
          notes?: string | null
          question?: string
          resolved?: boolean
          subject?: Database["public"]["Enums"]["subject_t"]
          type?: Database["public"]["Enums"]["mistake_t"]
          user_id?: string
        }
        Relationships: []
      }
      mocks: {
        Row: {
          chemistry: number | null
          concept_loss: number | null
          created_at: string
          id: string
          marks: number
          maths: number | null
          max_marks: number
          name: string
          notes: string | null
          physics: number | null
          rank_projection: number | null
          silly_loss: number | null
          taken_on: string
          time_loss: number | null
          user_id: string
        }
        Insert: {
          chemistry?: number | null
          concept_loss?: number | null
          created_at?: string
          id?: string
          marks?: number
          maths?: number | null
          max_marks?: number
          name: string
          notes?: string | null
          physics?: number | null
          rank_projection?: number | null
          silly_loss?: number | null
          taken_on?: string
          time_loss?: number | null
          user_id: string
        }
        Update: {
          chemistry?: number | null
          concept_loss?: number | null
          created_at?: string
          id?: string
          marks?: number
          maths?: number | null
          max_marks?: number
          name?: string
          notes?: string | null
          physics?: number | null
          rank_projection?: number | null
          silly_loss?: number | null
          taken_on?: string
          time_loss?: number | null
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          attempted: number
          chapter: string | null
          correct: number
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_t"]
          duration_min: number
          id: string
          notes: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          user_id: string
        }
        Insert: {
          attempted?: number
          chapter?: string | null
          correct?: number
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_t"]
          duration_min?: number
          id?: string
          notes?: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          user_id: string
        }
        Update: {
          attempted?: number
          chapter?: string | null
          correct?: number
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_t"]
          duration_min?: number
          id?: string
          notes?: string | null
          subject?: Database["public"]["Enums"]["subject_t"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          exam_date: string | null
          id: string
          target_air: number | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          exam_date?: string | null
          id: string
          target_air?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          exam_date?: string | null
          id?: string
          target_air?: number | null
        }
        Relationships: []
      }
      revisions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          last_revised_at: string
          next_review_at: string
          stage: Database["public"]["Enums"]["rev_stage_t"]
          subject: Database["public"]["Enums"]["subject_t"]
          topic: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          last_revised_at?: string
          next_review_at?: string
          stage?: Database["public"]["Enums"]["rev_stage_t"]
          subject: Database["public"]["Enums"]["subject_t"]
          topic: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          last_revised_at?: string
          next_review_at?: string
          stage?: Database["public"]["Enums"]["rev_stage_t"]
          subject?: Database["public"]["Enums"]["subject_t"]
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_revision: {
        Args: { _confidence: number; _id: string }
        Returns: {
          confidence: number
          created_at: string
          id: string
          last_revised_at: string
          next_review_at: string
          stage: Database["public"]["Enums"]["rev_stage_t"]
          subject: Database["public"]["Enums"]["subject_t"]
          topic: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      difficulty_t: "easy" | "medium" | "hard" | "advanced"
      mistake_t: "silly" | "concept" | "calculation" | "time" | "misread"
      rev_stage_t: "D1" | "D3" | "D7" | "D14" | "D30" | "mastered"
      subject_t: "Physics" | "Chemistry" | "Maths"
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
      difficulty_t: ["easy", "medium", "hard", "advanced"],
      mistake_t: ["silly", "concept", "calculation", "time", "misread"],
      rev_stage_t: ["D1", "D3", "D7", "D14", "D30", "mastered"],
      subject_t: ["Physics", "Chemistry", "Maths"],
    },
  },
} as const
