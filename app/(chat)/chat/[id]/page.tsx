'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import { useChat } from '@/hooks/useChat'
import { MessageThread } from '@/components/MessageThread'
import { InputBar } from '@/components/InputBar'
import { Spinner } from '@/components/Spinner'
import type { ChatSession, ChatMessage } from '@/types'

export default function ChatSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<ChatSession | null>(null)
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) {
      router.replace('/chat')
      return
    }

    async function bootstrap() {
      setIsBootstrapping(true)
      const supabase = getBrowserClient()

      const { data: sess, error: sessError } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at')
        .eq('id', sessionId)
        .single()

      if (sessError || !sess) {
        setBootstrapError('Conversation not found.')
        setIsBootstrapping(false)
        return
      }

      setSession(sess as ChatSession)

      const { data: msgs, error: msgsError } = await supabase
        .from('chat_messages')
        .select('id, role, content, thinking_content, source_chunks, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (msgsError) {
        setBootstrapError(msgsError.message)
        setIsBootstrapping(false)
        return
      }

      setInitialMessages((msgs ?? []) as ChatMessage[])
      setIsBootstrapping(false)
    }

    bootstrap()
  }, [sessionId, router])

  const { messages, streamingContent, streamingThinking, isStreaming, error, sendMessage } =
    useChat({ sessionId, initialMessages })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = useCallback(
    (content: string) => { sendMessage(content) },
    [sendMessage]
  )

  if (isBootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-6 text-sm text-red-700 dark:text-red-300 max-w-sm text-center">
          {bootstrapError}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-950">
      <header className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <h1 className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-xs">
          {session?.title ?? 'Chat'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <MessageThread
          messages={messages}
          streamingContent={streamingContent}
          streamingThinking={streamingThinking}
          isStreaming={isStreaming}
          bottomRef={bottomRef}
        />
      </main>

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 text-center" role="alert">
          {error}
        </div>
      )}

      <footer className="border-t border-slate-200 dark:border-slate-800 px-4 py-4">
        <InputBar
          onSend={handleSend}
          isDisabled={isStreaming}
          placeholder="Ask anything about your documents…"
        />
      </footer>
    </div>
  )
}
