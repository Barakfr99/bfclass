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
      assignment_sentences: {
        Row: {
          analyzed_word: string
          assignment_id: string | null
          correct_binyan: string | null
          correct_guf: string | null
          correct_shoresh: string
          correct_zman: string
          created_at: string | null
          full_sentence: string
          id: string
          is_practice: boolean | null
          question_data: Json | null
          sentence_number: number
          word_position: number
        }
        Insert: {
          analyzed_word: string
          assignment_id?: string | null
          correct_binyan?: string | null
          correct_guf?: string | null
          correct_shoresh: string
          correct_zman: string
          created_at?: string | null
          full_sentence: string
          id?: string
          is_practice?: boolean | null
          question_data?: Json | null
          sentence_number: number
          word_position: number
        }
        Update: {
          analyzed_word?: string
          assignment_id?: string | null
          correct_binyan?: string | null
          correct_guf?: string | null
          correct_shoresh?: string
          correct_zman?: string
          created_at?: string | null
          full_sentence?: string
          id?: string
          is_practice?: boolean | null
          question_data?: Json | null
          sentence_number?: number
          word_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_sentences_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string
          created_at: string | null
          description: string | null
          due_date: string | null
          grade_level: string | null
          id: string
          instructions_text: string
          is_hidden: boolean | null
          is_published: boolean | null
          title: string
          total_sentences: number
        }
        Insert: {
          assignment_type: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grade_level?: string | null
          id?: string
          instructions_text: string
          is_hidden?: boolean | null
          is_published?: boolean | null
          title: string
          total_sentences: number
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grade_level?: string | null
          id?: string
          instructions_text?: string
          is_hidden?: boolean | null
          is_published?: boolean | null
          title?: string
          total_sentences?: number
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answer_data: Json | null
          binyan_correct: boolean | null
          created_at: string | null
          guf_correct: boolean | null
          id: string
          is_correct: boolean | null
          partial_scores: Json | null
          points_earned: number | null
          question_type: string | null
          sentence_id: string | null
          shoresh_correct: boolean | null
          student_binyan: string | null
          student_guf: string | null
          student_shoresh: string | null
          student_zman: string | null
          submission_id: string | null
          updated_at: string | null
          zman_correct: boolean | null
        }
        Insert: {
          answer_data?: Json | null
          binyan_correct?: boolean | null
          created_at?: string | null
          guf_correct?: boolean | null
          id?: string
          is_correct?: boolean | null
          partial_scores?: Json | null
          points_earned?: number | null
          question_type?: string | null
          sentence_id?: string | null
          shoresh_correct?: boolean | null
          student_binyan?: string | null
          student_guf?: string | null
          student_shoresh?: string | null
          student_zman?: string | null
          submission_id?: string | null
          updated_at?: string | null
          zman_correct?: boolean | null
        }
        Update: {
          answer_data?: Json | null
          binyan_correct?: boolean | null
          created_at?: string | null
          guf_correct?: boolean | null
          id?: string
          is_correct?: boolean | null
          partial_scores?: Json | null
          points_earned?: number | null
          question_type?: string | null
          sentence_id?: string | null
          shoresh_correct?: boolean | null
          student_binyan?: string | null
          student_guf?: string | null
          student_shoresh?: string | null
          student_zman?: string | null
          submission_id?: string | null
          updated_at?: string | null
          zman_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "assignment_sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          created_at: string | null
          id: string
          note_text: string | null
          student_id: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_text?: string | null
          student_id: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_text?: string | null
          student_id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          grade_level: string | null
          id: string
          is_teacher: boolean | null
          student_id: string
          student_name: string
        }
        Insert: {
          created_at?: string | null
          grade_level?: string | null
          id?: string
          is_teacher?: boolean | null
          student_id: string
          student_name: string
        }
        Update: {
          created_at?: string | null
          grade_level?: string | null
          id?: string
          is_teacher?: boolean | null
          student_id?: string
          student_name?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string
          last_submitted_at: string | null
          reviewed_at: string | null
          status: string
          student_id: string | null
          submission_count: number | null
          submitted_at: string | null
          teacher_feedback: string | null
          total_score: number | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          last_submitted_at?: string | null
          reviewed_at?: string | null
          status?: string
          student_id?: string | null
          submission_count?: number | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          total_score?: number | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          last_submitted_at?: string | null
          reviewed_at?: string | null
          status?: string
          student_id?: string | null
          submission_count?: number | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
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
    Enums: {},
  },
} as const
