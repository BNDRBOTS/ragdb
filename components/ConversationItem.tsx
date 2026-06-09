'use client'

import Link from 'next/link'
import type { ChatSession } from '@/types'

interface ConversationItemProps {
  conversation: ChatSession
  isActive: boolean
}

export function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
      title={conversation.title}
    >
      <svg
        className="h-3.5 w-3.5 flex-shrink-0 opacity-60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
      <span className="truncate">{conversation.title}</span>
    </Link>
  )
}
