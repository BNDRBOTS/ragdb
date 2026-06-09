'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage } from '@/types'

interface UseChatOptions {
  sessionId: string
  initialMessages?: ChatMessage[]
}

interface UseChatReturn {
  messages: ChatMessage[]
  streamingContent: string
  streamingThinking: string
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
}

type StreamPayload = {
  chunk?: string
  message?: string
  sources?: ChatMessage['source_chunks']
}

export function useChat({ sessionId, initialMessages = [] }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThinking, setStreamingThinking] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userContent: string) => {
    if (isStreaming) return
    setError(null)
    setStreamingContent('')
    setStreamingThinking('')
    setIsStreaming(true)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userContent }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Stream request failed')
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventType = ''
      let dataBuf = ''
      let accContent = ''
      let accThinking = ''

      // Dispatch one fully-received SSE event. The event terminator is a blank
      // line, so this is driven by the blank-line branch in the loop below —
      // never by the contents of the data payload. That distinction is what
      // keeps the terminal `done` event (which carries only source metadata)
      // from being discarded before the assistant turn is committed to state.
      const commit = () => {
        if (!eventType) {
          dataBuf = ''
          return
        }

        let parsed: StreamPayload = {}
        if (dataBuf) {
          try {
            parsed = JSON.parse(dataBuf) as StreamPayload
          } catch {
            eventType = ''
            dataBuf = ''
            return
          }
        }

        if (eventType === 'thinking') {
          if (parsed.chunk) {
            accThinking += parsed.chunk
            setStreamingThinking(accThinking)
          }
        } else if (eventType === 'content') {
          if (parsed.chunk) {
            accContent += parsed.chunk
            setStreamingContent(accContent)
          }
        } else if (eventType === 'done') {
          const sources = Array.isArray(parsed.sources) ? parsed.sources : []
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: accContent,
            thinking_content: accThinking || null,
            source_chunks: sources.length ? sources : null,
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent('')
          setStreamingThinking('')
        } else if (eventType === 'error') {
          eventType = ''
          dataBuf = ''
          throw new Error(typeof parsed.message === 'string' ? parsed.message : 'Streaming error')
        }

        eventType = ''
        dataBuf = ''
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trimEnd()

          if (trimmed === '') {
            commit()
            continue
          }
          if (trimmed.startsWith('event:')) {
            eventType = trimmed.slice(6).trim()
            continue
          }
          if (trimmed.startsWith('data:')) {
            dataBuf = trimmed.slice(5).trim()
            continue
          }
        }
      }

      // Flush a trailing event that arrived without a closing blank line.
      commit()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Unknown streaming error')
      }
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, sessionId])

  return {
    messages,
    streamingContent,
    streamingThinking,
    isStreaming,
    error,
    sendMessage,
  }
}
