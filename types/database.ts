export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_path: string
          file_size: number
          mime_type: string
          status: 'processing' | 'ready' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_path: string
          file_size?: number
          mime_type?: string
          status?: 'processing' | 'ready' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          status?: 'processing' | 'ready' | 'error'
          updated_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          user_id: string
          chunk_index: number
          content: string
          token_count: number
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          chunk_index: number
          content: string
          token_count?: number
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          embedding?: number[] | null
          token_count?: number
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          thinking_content: string | null
          source_chunks: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          thinking_content?: string | null
          source_chunks?: Json | null
          created_at?: string
        }
        Update: {
          content?: string
          thinking_content?: string | null
          source_chunks?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: Array<{
          id: string
          document_id: string
          chunk_index: number
          content: string
          similarity: number
        }>
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
