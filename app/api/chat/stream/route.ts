import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { runPipeline } from '@/lib/pipeline'
import { streamDeepSeekChat } from '@/lib/deepseek/client'
import { getServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const RequestSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(32000),
})

// How many prior turns to replay into the model. Bounds token cost while
// keeping the conversation coherent across turns.
const HISTORY_LIMIT = 20

type Turn = { role: 'user' | 'assistant'; content: string }

// Build a message list that deepseek-reasoner accepts: starts with the system
// prompt, then strictly alternating user/assistant turns, always ending on the
// current user message. Consecutive same-role turns (e.g. a turn whose
// assistant reply failed to persist) are merged so the API never 400s.
function buildMessages(
  system: string,
  prior: Turn[],
  currentUser: string
): ChatCompletionMessageParam[] {
  const merged: Turn[] = []
  for (const turn of prior) {
    const last = merged[merged.length - 1]
    if (last && last.role === turn.role) {
      last.content += '\n\n' + turn.content
    } else {
      merged.push({ ...turn })
    }
  }

  const last = merged[merged.length - 1]
  if (last && last.role === 'user') {
    last.content += '\n\n' + currentUser
  } else {
    merged.push({ role: 'user', content: currentUser })
  }

  while (merged.length > 0 && merged[0].role !== 'user') merged.shift()

  return [{ role: 'system', content: system }, ...merged]
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

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

  // RLS confirms the session belongs to this user.
  const { data: session, error: sessionError } = await userClient
    .from('chat_sessions')
    .select('id')
    .eq('id', body.session_id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Prior turns (strictly before this message — fetched before we insert it).
  const { data: historyRows } = await userClient
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('session_id', body.session_id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)

  const priorTurns: Turn[] = (historyRows ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Persist the user's turn via the service client (no cookie writes once a
  // response has started streaming).
  const serviceClient = getServiceClient()
  const { error: userMsgError } = await serviceClient
    .from('chat_messages')
    .insert({
      session_id: body.session_id,
      user_id: user.id,
      role: 'user',
      content: body.message,
    })

  if (userMsgError) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  // Retrieval runs as the user (RLS-enforced) and resolves the context.
  const { chunks, systemPrompt } = await runPipeline(userClient, body.message)
  const messages = buildMessages(systemPrompt, priorTurns, body.message)

  const sources =
    chunks.length > 0
      ? chunks.map((c) => ({
          chunk_id: c.id,
          document_id: c.document_id,
          snippet: c.content.slice(0, 200),
        }))
      : []

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (s: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(s))
        } catch {
          closed = true
        }
      }
      const close = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      await streamDeepSeekChat(messages, {
        onThinkingChunk(chunk) {
          send(`event: thinking\ndata: ${JSON.stringify({ chunk })}\n\n`)
        },
        onContentChunk(chunk) {
          send(`event: content\ndata: ${JSON.stringify({ chunk })}\n\n`)
        },
        async onDone(fullContent, fullThinking) {
          try {
            await serviceClient.from('chat_messages').insert({
              session_id: body.session_id,
              user_id: user.id,
              role: 'assistant',
              content: fullContent,
              thinking_content: fullThinking || null,
              source_chunks: sources.length > 0 ? sources : null,
            })
          } catch (e) {
            console.error('[chat/stream] failed to persist assistant message:', e)
          }
          send(`event: done\ndata: ${JSON.stringify({ sources })}\n\n`)
          close()
        },
        onError(error) {
          send(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`)
          close()
        },
      })
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
