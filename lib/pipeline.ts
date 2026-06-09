import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { retrieveChunks, type RetrievedChunk } from '@/lib/retriever'

export interface PipelineResult {
  chunks: RetrievedChunk[]
  systemPrompt: string
}

function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''
  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} | doc:${c.document_id} chunk:${c.chunk_index}]\n${c.content}`
    )
    .join('\n\n---\n\n')
}

export async function runPipeline(
  supabase: SupabaseClient<Database>,
  query: string
): Promise<PipelineResult> {
  const chunks = await retrieveChunks(supabase, query)
  const context = formatContext(chunks)

  const systemPrompt = context
    ? `You are a helpful assistant. Use the following document excerpts to answer the user's question accurately. Cite [Source N] when referencing a specific excerpt. If the excerpts do not contain the answer, say so plainly.\n\n${context}`
    : `You are a helpful assistant. The user has no indexed documents relevant to this question, so answer from general knowledge and say when you are unsure.`

  return { chunks, systemPrompt }
}
