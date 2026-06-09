'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useChat } from '@/hooks/useChat'
import { MessageThread } from '@/components/MessageThread'
import { InputBar } from '@/components/InputBar'
import type { ChatSession, ChatMessage as ChatMessageType } from '@/types'

export default function ChatPage() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [initialMessages, setInitialMessages] = useState<ChatMessageType[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function bootstrap() {
      setIsBootstrapping(true)
      setBootstrapError(null)
      const supabase = getBrowserClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setBootstrapError('Not authenticated')
        setIsBootstrapping(false)
        return
      }

      let activeSession: ChatSession | null = null

      const { data: existing, error: sessionFetchError } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessionFetchError) {
        setBootstrapError(sessionFetchError.message)
        setIsBootstrapping(false)
        return
      }

      if (existing) {
        activeSession = existing as ChatSession
      } else {
        const { data: created, error: createError } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, title: 'New Chat' })
          .select('id, title, created_at, updated_at')
          .single()

        if (createError || !created) {
          setBootstrapError('Failed to create chat session')
          setIsBootstrapping(false)
          return
        }
        activeSession = created as ChatSession
      }

      setSession(activeSession)

      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('id, role, content, thinking_content, source_chunks, created_at')
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: true })

      if (msgError) {
        setBootstrapError(msgError.message)
        setIsBootstrapping(false)
        return
      }

      setInitialMessages((messages ?? []) as ChatMessageType[])
      setIsBootstrapping(false)
    }

    bootstrap()
  }, [])

  const {
    messages,
    streamingContent,
    streamingThinking,
    isStreaming,
    error: chatError,
    sendMessage,
  } = useChat({
    sessionId: session?.id ?? '',
    initialMessages,
  })

  const hasTitledSession = useRef(false)
  useEffect(() => {
    if (hasTitledSession.current || !session) return
    const firstUserMsg = messages.find(m => m.role === 'user')
    if (!firstUserMsg) return

    hasTitledSession.current = true
    const newTitle = firstUserMsg.content.slice(0, 60)
    const supabase = getBrowserClient()
    supabase
      .from('chat_sessions')
      .update({ title: newTitle })
      .eq('id', session.id)
      .then(() => {})
  }, [messages, session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, streamingThinking])

  const handleSend = useCallback(
    (content: string) => {
      if (!session) return
      sendMessage(content)
    },
    [session, sendMessage]
  )

  if (isBootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 px-4">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-6 text-center text-sm text-red-700 dark:text-red-300 max-w-sm">
          {bootstrapError}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-950">
      <header className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-xs">
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

      {chatError && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 text-center" role="alert">
          {chatError}
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
