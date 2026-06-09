'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import type { DocumentMeta } from '@/types'

interface UseDocumentsReturn {
  documents: DocumentMeta[]
  isLoading: boolean
  isUploading: boolean
  error: string | null
  uploadDocument: (file: File, title?: string) => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = getBrowserClient()

    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, file_size, mime_type, status, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setDocuments((data ?? []) as DocumentMeta[])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const uploadDocument = useCallback(async (file: File, title?: string) => {
    setIsUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Upload failed')
      }

      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [fetchDocuments])

  const deleteDocument = useCallback(async (documentId: string) => {
    setError(null)

    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Delete failed')
      }

      setDocuments(prev => prev.filter(d => d.id !== documentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      await fetchDocuments()
    }
  }, [fetchDocuments])

  return {
    documents,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    refresh: fetchDocuments,
  }
}
