import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'
import { parseDocument } from '@/lib/parsers'
import { chunkText } from '@/lib/chunker'
import { embedBatch } from '@/lib/embed'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const userClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 422 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const title = (formData.get('title') as string | null) || file.name
  const fileExt = file.name.split('.').pop() ?? 'bin'
  const fileUuid = crypto.randomUUID()
  const storagePath = `${user.id}/${fileUuid}.${fileExt}`

  const serviceClient = getServiceClient()

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const { error: storageError } = await serviceClient.storage
    .from('rag-documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    return NextResponse.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 })
  }

  const { data: document, error: docInsertError } = await serviceClient
    .from('documents')
    .insert({
      user_id: user.id,
      title,
      file_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: 'processing',
    })
    .select()
    .single()

  if (docInsertError || !document) {
    await serviceClient.storage.from('rag-documents').remove([storagePath])
    return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
  }

  try {
    const rawText = await parseDocument(fileBuffer, file.type)
    const chunks = chunkText(rawText, { maxTokens: 512, overlapTokens: 64 })

    if (chunks.length === 0) {
      throw new Error('Document produced zero chunks after parsing')
    }

    const BATCH_SIZE = 256
    const allEmbeddings: number[][] = []
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const slice = chunks.slice(i, i + BATCH_SIZE)
      const embeddings = await embedBatch(slice.map(c => c.content))
      allEmbeddings.push(...embeddings)
    }

    const chunkRows = chunks.map((chunk, i) => ({
      document_id: document.id,
      user_id: user.id,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: allEmbeddings[i],
    }))

    const { error: chunkInsertError } = await serviceClient
      .from('document_chunks')
      .insert(chunkRows)

    if (chunkInsertError) {
      throw new Error(`Chunk insert failed: ${chunkInsertError.message}`)
    }

    await serviceClient
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', document.id)

    return NextResponse.json({
      document_id: document.id,
      title: document.title,
      chunk_count: chunks.length,
      status: 'ready',
    })
  } catch (processingError) {
    await serviceClient
      .from('documents')
      .update({ status: 'error' })
      .eq('id', document.id)

    return NextResponse.json(
      { error: processingError instanceof Error ? processingError.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
