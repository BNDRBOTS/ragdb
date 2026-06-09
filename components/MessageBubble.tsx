'use client'

import { ThinkingPanel } from '@/components/ThinkingPanel'
import type { ChatMessage } from '@/types'

interface MessageBubbleProps {
  message: ChatMessage
  liveContent?: string
  liveThinking?: string
}

export function MessageBubble({ message, liveContent, liveThinking }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isStreaming = liveContent !== undefined || liveThinking !== undefined

  const displayContent = liveContent ?? message.content
  const displayThinking = liveThinking ?? message.thinking_content ?? ''

  const sources = message.source_chunks as
    | Array<{ chunk_id: string; document_id: string; snippet: string }>
    | null
    | undefined

  return (
    <div className={`flex gap-3 py-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white select-none ${
          isUser ? 'bg-blue-600' : 'bg-slate-700 dark:bg-slate-600'
        }`}
        aria-hidden="true"
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`flex max-w-[78%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {isAssistant && displayThinking && (
          <ThinkingPanel content={displayThinking} isStreaming={isStreaming} />
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm'
          }`}
        >
          {displayContent || (isStreaming ? (
            <span className="inline-flex items-center gap-1" aria-label="Generating response">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          ) : '\u00A0')}
        </div>

        {isAssistant && sources && sources.length > 0 && (
          <details className="text-xs text-slate-500 dark:text-slate-400 w-full">
            <summary className="cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300 list-none flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {sources.length} source{sources.length !== 1 ? 's' : ''}
            </summary>
            <ul className="mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {sources.map((src, i) => (
                <li key={src.chunk_id} className="line-clamp-2 text-slate-500 dark:text-slate-400">
                  [{i + 1}] {src.snippet}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
