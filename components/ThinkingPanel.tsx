'use client'

import { useState } from 'react'

interface ThinkingPanelProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingPanel({ content, isStreaming = false }: ThinkingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  return (
    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors"
        aria-expanded={isExpanded}
      >
        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        <span>
          {isStreaming ? 'Thinking…' : 'View reasoning'}
        </span>

        {isStreaming && (
          <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap font-mono leading-relaxed">
          {content}
        </div>
      )}
    </div>
  )
}
