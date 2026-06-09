'use client'

import { useCallback, useRef, useState } from 'react'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

interface UploadZoneProps {
  onUpload: (file: File, title?: string) => void
  isUploading: boolean
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      setValidationError(null)
      if (!ALLOWED_MIME.has(file.type)) {
        setValidationError(`Unsupported type: ${file.type}. Allowed: PDF, TXT, MD, DOCX, XLSX`)
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setValidationError('File exceeds 50 MB limit')
        return
      }
      onUpload(file)
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload document"
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.xlsx"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
            e.target.value = ''
          }}
          disabled={isUploading}
          className="sr-only"
          aria-hidden="true"
        />
        <svg className="mx-auto mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.076 11.095H6.75z" />
        </svg>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isUploading ? 'Uploading…' : 'Drop a file or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF, TXT, MD, DOCX, XLSX · Max 50 MB</p>
      </div>
      {validationError && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">{validationError}</p>
      )}
    </div>
  )
}
