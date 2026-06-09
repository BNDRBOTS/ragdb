'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code:    'The sign-in link is missing a required parameter. Please request a new link.',
  exchange_failed: 'The sign-in link has expired or has already been used. Please request a new link.',
}

function ErrorContent() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'unknown'
  const message = ERROR_MESSAGES[reason] ?? 'An unexpected authentication error occurred.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-6">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
            Authentication failed
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  )
}
