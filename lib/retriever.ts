import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { embedText } from '@/lib/embed'

export interface RetrievedChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  similarity: number
}

export interface RetrieverOptions {
  topK?: number
  matchThreshold?: number
}

// Retrieval runs through the caller's user-scoped Supabase client so that
// RLS — and the match_chunks auth.uid() guard — enforce per-user isolation
// at the database. No user id is passed from application code, so none can
// be forged. The service-role client must never be used here.
export async function retrieveChunks(
  supabase: SupabaseClient<Database>,
  query: string,
  options: RetrieverOptions = {}
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? 8
  const matchThreshold = options.matchThreshold ?? 0.3

  const embedding = await embedText(query)

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: topK,
  })

  if (error) throw new Error(`Retrieval failed: ${error.message}`)
  return (data ?? []) as RetrievedChunk[]
}
