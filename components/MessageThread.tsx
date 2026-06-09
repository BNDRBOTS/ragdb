'use client'

import { RefObject } from 'react'
import { MessageBubble } from '@/components/MessageBubble'
import type { ChatMessage } from '@/types'

interface MessageThreadProps {
  messages: ChatMessage[]
  streamingContent: string
  streamingThinking: string
  isStreaming: boolean
  bottomRef: RefObject<HTMLDivElement | null>
}

export function MessageThread({
  messages,
  streamingContent,
  streamingThinking,
  isStreaming,
  bottomRef,
}: MessageThreadProps) {
  const lastIsUser =
    isStreaming && (messages.length === 0 || messages[messages.length - 1].role === 'user')

  return (
    <div className="flex flex-col gap-0 px-4 py-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Ask anything. Your documents are ready.
          </p>
        </div>
      )}

      {messages.map((msg, index) => {
        const isLastAssistant =
          msg.role === 'assistant' && index === messages.length - 1 && isStreaming
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            liveContent={isLastAssistant ? streamingContent : undefined}
            liveThinking={isLastAssistant ? streamingThinking : undefined}
          />
        )
      })}

      {lastIsUser && (
        <MessageBubble
          key="ghost"
          message={{
            id: 'ghost',
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          }}
          liveContent={streamingContent}
          liveThinking={streamingThinking}
        />
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
