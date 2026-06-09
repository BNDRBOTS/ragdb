'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import type { ChatSession } from '@/types'

interface UseConversationsReturn {
  conversations: ChatSession[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  deleteConversation: (id: string) => Promise<void>
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = getBrowserClient()

    const { data, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setConversations((data ?? []) as ChatSession[])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const deleteConversation = useCallback(async (id: string) => {
    const supabase = getBrowserClient()
    const { error: delError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)

    if (delError) {
      setError(delError.message)
      return
    }

    setConversations(prev => prev.filter(c => c.id !== id))
  }, [])

  return { conversations, isLoading, error, refresh: fetchConversations, deleteConversation }
}
