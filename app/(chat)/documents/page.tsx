'use client'

import { useDocuments } from '@/hooks/useDocuments'
import { UploadZone } from '@/components/UploadZone'
import { DocumentList } from '@/components/DocumentList'

export default function DocumentsPage() {
  const {
    documents,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
  } = useDocuments()

  const readyCount = documents.filter(d => d.status === 'ready').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Documents
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {isLoading
                ? 'Loading…'
                : `${readyCount} of ${documents.length} document${documents.length !== 1 ? 's' : ''} ready`}
            </p>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <section aria-labelledby="upload-heading">
          <h2
            id="upload-heading"
            className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Upload a document
          </h2>
          <UploadZone
            onUpload={uploadDocument}
            isUploading={isUploading}
          />
        </section>

        <section aria-labelledby="library-heading">
          <h2
            id="library-heading"
            className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Your library
          </h2>
          <DocumentList
            documents={documents}
            onDelete={deleteDocument}
            isLoading={isLoading}
          />
        </section>
      </div>
    </div>
  )
}
