export interface DocumentMeta {
  id: string
  title: string
  file_size: number
  mime_type: string
  status: 'processing' | 'ready' | 'error'
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking_content?: string | null
  source_chunks?: Array<{
    chunk_id: string
    document_id: string
    snippet: string
  }> | null
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface StreamEvent {
  type: 'thinking' | 'content' | 'done' | 'error'
  chunk?: string
  message?: string
}
