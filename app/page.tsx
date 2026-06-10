import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import type { Database } from '@/types/database'

/* ------------------------------------------------------------------ */
/*  Fonts — loaded here, scoped to this page via CSS variables.       */
/*  The app shell (chat, documents, auth) keeps Inter untouched.      */
/* ------------------------------------------------------------------ */
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--ld-font-display',
  display: 'swap',
})
const body = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--ld-font-body',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--ld-font-mono',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'RAG Chat — Grounded answers from your documents',
  description:
    'Upload PDFs, Word docs, spreadsheets, or plain text. Every message runs a live similarity search across your library — every answer arrives with its sources attached and its reasoning in the open.',
}

/* ------------------------------------------------------------------ */
/*  True engine constants. Every value below is read from the         */
/*  codebase, not invented: upload/route.ts, retriever.ts,            */
/*  stream/route.ts, 003_match_chunks.sql, embed.ts.                  */
/* ------------------------------------------------------------------ */
const TELEMETRY: Array<{ label: string; value: string }> = [
  { label: 'Embedding dim', value: '1,536' },
  { label: 'Chunk window', value: '512 tok · 64 overlap' },
  { label: 'Retrieval', value: 'top-8 · 0.30 floor' },
  { label: 'Index', value: 'HNSW · ef_search 100' },
  { label: 'Context', value: '20-turn memory' },
  { label: 'Upload ceiling', value: '50 MB / file' },
]

const PIPELINE: Array<{ n: string; title: string; copy: string }> = [
  {
    n: '01',
    title: 'Parse',
    copy: 'PDF, DOCX, XLSX, TXT, and Markdown — each through a parser built for the format. Raw text in, nothing lossy.',
  },
  {
    n: '02',
    title: 'Chunk',
    copy: 'Sentence-boundary windows: 512 tokens with a 64-token overlap, so context never falls between two pieces.',
  },
  {
    n: '03',
    title: 'Embed',
    copy: 'Batched through text-embedding-3-small into 1,536-dimension vectors — one call per batch, never per chunk.',
  },
  {
    n: '04',
    title: 'Index',
    copy: 'Written to Postgres under a pgvector HNSW index, cosine distance. Searchable the moment the document flips to ready.',
  },
]

const CAPABILITIES: Array<{
  tag: string
  title: string
  copy: string
  offset: string
}> = [
  {
    tag: 'RETRIEVAL',
    title: 'Grounded before generated',
    copy: 'Every message is embedded and scanned across your library on a cosine HNSW index before the model writes a word. The top passages ride along as numbered sources the answer has to point at.',
    offset: 'lg:col-start-1 lg:col-end-8',
  },
  {
    tag: 'REASONING',
    title: 'The thinking is part of the answer',
    copy: 'deepseek-reasoner streams its full reasoning trace beside each reply. Expand it, audit it, or ignore it — either way it is stored with the message, not discarded after the fact.',
    offset: 'lg:col-start-6 lg:col-end-13',
  },
  {
    tag: 'ISOLATION',
    title: 'Nothing to spoof',
    copy: 'Row-level security scopes every read to your own token, and the similarity-search function accepts no user ID at all. Isolation is structural — there is no parameter to forge.',
    offset: 'lg:col-start-3 lg:col-end-10',
  },
]

export default async function RootPage() {
  /* ----------------------------------------------------------------
     Auth gate. Middleware has already refreshed the session for "/"
     (the matcher covers it), so this read is warm. Server components
     cannot write cookies — setAll is a deliberate no-op; the
     middleware owns token refresh.
  ---------------------------------------------------------------- */
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* no-op: RSCs cannot set cookies; middleware refreshes sessions */
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // A signed-in pilot goes straight to the cockpit. No landing flash.
  if (user) redirect('/chat')

  const year = new Date().getFullYear()

  return (
    <div
      className={`landing ${display.variable} ${body.variable} ${mono.variable} relative min-h-screen overflow-x-clip antialiased`}
    >
      {/* ---------------- Atmosphere: glow / grid / grain ---------------- */}
      <div aria-hidden="true" className="ld-glow" />
      <div aria-hidden="true" className="ld-grid" />
      <div aria-hidden="true" className="ld-noise" />

      {/* --------------------------- Nav --------------------------- */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--ld-line)] bg-[color:var(--ld-void)]/75 backdrop-blur-xl">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            href="/"
            className="ld-focus flex min-h-[2.75rem] items-center gap-2.5 transition-transform duration-200 hover:-translate-y-px"
            aria-label="RAG Chat home"
          >
            <BrandMark />
            <span className="f-display text-[1.05rem] font-semibold tracking-[-0.01em] text-[color:var(--ld-text)]">
              RAG Chat
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="#capabilities">Capabilities</NavLink>
            <NavLink href="#pipeline">Pipeline</NavLink>
            <NavLink href="#security">Security</NavLink>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/auth/login"
              className="ld-focus flex min-h-[2.75rem] items-center rounded-xl px-4 text-[0.875rem] font-medium text-[color:var(--ld-muted)] transition-all duration-200 hover:-translate-y-px hover:text-[color:var(--ld-text)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="ld-focus ld-cta flex min-h-[2.75rem] items-center rounded-xl px-5 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* --------------------------- Hero --------------------------- */}
        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 lg:pb-28 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-10">
            {/* Left 40% — the statement */}
            <div className="relative z-10">
              <p className="rise f-mono inline-flex items-center gap-2 rounded-full border border-[color:var(--ld-line)] bg-[color:var(--ld-glass)] px-3.5 py-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[color:var(--ld-faint)]">
                <span className="ld-pulse h-1.5 w-1.5 rounded-full bg-[color:var(--ld-ice)]" />
                pgvector · HNSW · deepseek-reasoner
              </p>

              <h1 className="rise d-1 f-display mt-7 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-[color:var(--ld-text)] sm:text-[3.4rem] lg:text-[3.55rem] xl:text-[4.1rem]">
                Chat with your documents.
                <span className="ld-ink block">Audit every answer.</span>
              </h1>

              <p className="rise d-2 mt-6 max-w-xl text-[1.0625rem] leading-[1.65] text-[color:var(--ld-muted)]">
                Upload PDFs, Word docs, spreadsheets, or plain text. Every
                message runs a live similarity search across your library — and
                every reply arrives with its sources attached and its reasoning
                in the open.
              </p>

              <div className="rise d-3 mt-9 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/auth/signup"
                  className="ld-focus ld-cta flex min-h-[3rem] items-center rounded-xl px-7 text-[0.9375rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  Get started
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </Link>
                <Link
                  href="/auth/login"
                  className="ld-focus flex min-h-[3rem] items-center rounded-xl border border-[color:var(--ld-line-strong)] bg-[color:var(--ld-glass)] px-7 text-[0.9375rem] font-semibold text-[color:var(--ld-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ld-ice)]/40 hover:bg-[color:var(--ld-glass-hi)]"
                >
                  Sign in
                </Link>
              </div>

              <p className="rise d-4 f-mono mt-5 text-[0.6875rem] uppercase tracking-[0.14em] text-[color:var(--ld-faint)]">
                Magic-link sign-in · no password to manage
              </p>
            </div>

            {/* Right 60% — the cockpit, breaking the container edge.
                The whole frame is a single live control: it launches signup. */}
            <div className="relative lg:-mr-8 xl:-mr-16">
              {/* Rotated telemetry rail on the seam — real constants */}
              <div
                aria-hidden="true"
                className="f-mono absolute -left-9 top-1/2 hidden -translate-y-1/2 items-center gap-3 text-[0.625rem] uppercase tracking-[0.22em] text-[color:var(--ld-faint)] lg:flex"
                style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}
              >
                <span className="h-10 w-px bg-[color:var(--ld-line-strong)]" />
                cosine floor 0.30 — top-k 8 — ef_search 100
                <span className="h-10 w-px bg-[color:var(--ld-line-strong)]" />
              </div>

              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2rem] bg-[color:var(--ld-ice)]/10 blur-3xl"
              />

              <Link
                href="/auth/signup"
                aria-label="Create an account and start chatting with your documents"
                className="ld-focus rise d-3 group relative block rounded-2xl border border-[color:var(--ld-line-strong)] bg-[color:var(--ld-deep)]/90 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--ld-ice)]/40 hover:shadow-[0_24px_64px_-16px_rgba(56,128,240,0.35)]"
              >
                {/* Window chrome */}
                <div className="flex items-center gap-2 border-b border-[color:var(--ld-line)] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/80" />
                  <span className="f-mono ml-3 truncate text-[0.6875rem] tracking-[0.04em] text-[color:var(--ld-faint)]">
                    rag-chat — vendor-msa.pdf · ready
                  </span>
                </div>

                {/* Thread — a faithful miniature of the real chat UI */}
                <div className="space-y-4 px-4 py-5 sm:px-6">
                  {/* User turn */}
                  <div className="flex flex-row-reverse gap-2.5">
                    <span className="flex h-6 w-6 flex-shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-[0.625rem] font-bold text-white">
                      U
                    </span>
                    <span className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-3.5 py-2 text-[0.8125rem] leading-relaxed text-white">
                      What does the indemnification clause actually cover?
                    </span>
                  </div>

                  {/* Assistant turn */}
                  <div className="flex gap-2.5">
                    <span className="flex h-6 w-6 flex-shrink-0 select-none items-center justify-center rounded-full bg-slate-600 text-[0.625rem] font-bold text-white">
                      AI
                    </span>
                    <div className="max-w-[85%] space-y-1.5">
                      {/* Thinking panel — the amber strip from the real app */}
                      <div className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/50 px-3 py-2 text-[0.75rem] font-medium text-amber-300">
                        <svg
                          className="h-3 w-3 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        View reasoning
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                      </div>

                      <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-slate-100">
                        Provider indemnifies you against third-party claims
                        arising from the platform itself, capped at fees paid
                        over the prior 12 months{' '}
                        <span className="text-[color:var(--ld-ice)]">
                          [Source 1]
                        </span>
                        . It does not extend to modifications made without
                        written approval{' '}
                        <span className="text-[color:var(--ld-ice)]">
                          [Source 2]
                        </span>
                        .
                      </div>

                      {/* Sources disclosure — expanded so the payoff is visible */}
                      <div className="text-[0.6875rem] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <svg
                            className="h-2.5 w-2.5 rotate-90"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          2 sources
                        </span>
                        <ul className="mt-1 space-y-1 border-l-2 border-slate-700 pl-3">
                          <li className="truncate">
                            [1] …shall defend and indemnify Customer against
                            third-party claims alleging…
                          </li>
                          <li className="truncate">
                            [2] …obligations shall not apply to modifications
                            made without Provider's prior…
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Input bar — part of the same single control */}
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3.5 py-2.5">
                    <span className="flex-1 truncate text-[0.8125rem] text-slate-500">
                      Ask anything about your documents…
                    </span>
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Hover affordance — reveals the frame is a control */}
                <span className="f-mono pointer-events-none absolute bottom-3 right-4 text-[0.625rem] uppercase tracking-[0.18em] text-[color:var(--ld-ice)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:translate-x-2">
                  create yours →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------- Telemetry rail (signature) -------------------
            Every value is a live engine constant read from the codebase. */}
        <section
          aria-label="System configuration — live engine constants"
          className="border-y border-[color:var(--ld-line)] bg-[color:var(--ld-deep)]/40"
        >
          <dl className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {TELEMETRY.map((t, i) => (
              <div
                key={t.label}
                data-reveal
                style={{ transitionDelay: `${i * 70}ms` }}
                className={`group px-5 py-6 transition-colors duration-300 hover:bg-[color:var(--ld-glass)] sm:px-6 ${
                  i > 0 ? 'border-l border-[color:var(--ld-line)]' : ''
                } ${i % 2 === 0 ? '' : ''}`}
              >
                <dt className="f-mono text-[0.625rem] uppercase tracking-[0.18em] text-[color:var(--ld-faint)]">
                  {t.label}
                </dt>
                <dd className="f-mono mt-2 text-[0.875rem] text-[color:var(--ld-text)] transition-transform duration-300 group-hover:translate-x-0.5">
                  {t.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ------------------------ Capabilities ------------------------
            An offset ledger, not a card grid: each guarantee sits on its
            own asymmetric row. */}
        <section
          id="capabilities"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-24 sm:px-8 lg:pt-32"
        >
          <div data-reveal className="max-w-2xl">
            <p className="f-mono text-[0.6875rem] uppercase tracking-[0.2em] text-[color:var(--ld-ice)]">
              Capabilities
            </p>
            <h2 className="f-display mt-4 text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[color:var(--ld-text)] sm:text-[2.4rem]">
              Built to be checked, not believed.
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.65] text-[color:var(--ld-muted)]">
              Three guarantees, enforced by the system — not by trust.
            </p>
          </div>

          <div className="mt-14 space-y-2">
            {CAPABILITIES.map((c) => (
              <div
                key={c.tag}
                data-reveal
                className="grid grid-cols-1 lg:grid-cols-12"
              >
                <article
                  className={`group border-t border-[color:var(--ld-line)] py-9 transition-all duration-300 hover:translate-x-1 hover:border-[color:var(--ld-ice)]/40 ${c.offset}`}
                >
                  <p className="f-mono text-[0.625rem] uppercase tracking-[0.22em] text-[color:var(--ld-ice)]">
                    [{c.tag}]
                  </p>
                  <h3 className="f-display mt-3 text-[1.35rem] font-semibold tracking-[-0.015em] text-[color:var(--ld-text)]">
                    {c.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-[0.9375rem] leading-[1.65] text-[color:var(--ld-muted)]">
                    {c.copy}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------- Pipeline --------------------------
            A genuinely ordered process — numbering carries information. */}
        <section
          id="pipeline"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-24 sm:px-8 lg:pt-28"
        >
          <div
            data-reveal
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div className="max-w-xl">
              <p className="f-mono text-[0.6875rem] uppercase tracking-[0.2em] text-[color:var(--ld-ice)]">
                Ingestion
              </p>
              <h2 className="f-display mt-4 text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[color:var(--ld-text)] sm:text-[2.4rem]">
                From file to searchable in one pass.
              </h2>
            </div>
            <p className="f-mono pb-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[color:var(--ld-faint)]">
              status: processing → ready
            </p>
          </div>

          <ol className="relative mt-12 grid gap-3 lg:grid-cols-4 lg:gap-4">
            {/* Connector hairline behind the stages */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-7 hidden h-px bg-[color:var(--ld-line)] lg:block"
            />
            {PIPELINE.map((s, i) => (
              <li
                key={s.n}
                data-reveal
                style={{ transitionDelay: `${i * 90}ms` }}
                className="group relative rounded-2xl border border-[color:var(--ld-line)] bg-[color:var(--ld-glass)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--ld-ice)]/40 hover:bg-[color:var(--ld-glass-hi)]"
              >
                <span className="f-mono inline-flex items-center gap-2 text-[0.6875rem] tracking-[0.16em] text-[color:var(--ld-ice)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ld-ice)] transition-transform duration-300 group-hover:scale-150" />
                  {s.n}
                </span>
                <h3 className="f-display mt-4 text-[1.15rem] font-semibold tracking-[-0.01em] text-[color:var(--ld-text)]">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-[1.6] text-[color:var(--ld-muted)]">
                  {s.copy}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* -------------------------- Security -------------------------- */}
        <section
          id="security"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-8 pt-24 sm:px-8 lg:pt-28"
        >
          <div className="grid gap-10 rounded-2xl border border-[color:var(--ld-line)] bg-[color:var(--ld-deep)]/50 p-7 sm:p-10 lg:grid-cols-[2fr_3fr] lg:gap-12">
            <div data-reveal>
              <p className="f-mono text-[0.6875rem] uppercase tracking-[0.2em] text-[color:var(--ld-ice)]">
                Isolation
              </p>
              <h2 className="f-display mt-4 text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.025em] text-[color:var(--ld-text)] sm:text-[2.2rem]">
                The boundary is structural.
              </h2>
              <p className="mt-5 text-[0.9375rem] leading-[1.7] text-[color:var(--ld-muted)]">
                Reads run under your own token with row-level security on every
                table. Writes go through a service role only after your
                identity is confirmed. And the similarity-search function
                carries an{' '}
                <code className="f-mono rounded bg-[color:var(--ld-glass-hi)] px-1.5 py-0.5 text-[0.8125rem] text-[color:var(--ld-ice)]">
                  auth.uid()
                </code>{' '}
                guard inside its own body — so per-user isolation holds even if
                a policy were ever dropped.
              </p>
            </div>

            {/* The real security boundary, rendered as it exists in the code */}
            <div data-reveal className="overflow-x-auto">
              <table className="w-full min-w-[26rem] border-collapse text-left">
                <caption className="sr-only">
                  How reads and writes are isolated per user
                </caption>
                <thead>
                  <tr className="f-mono text-[0.625rem] uppercase tracking-[0.18em] text-[color:var(--ld-faint)]">
                    <th scope="col" className="border-b border-[color:var(--ld-line-strong)] pb-3 pr-4 font-medium">
                      Operation
                    </th>
                    <th scope="col" className="border-b border-[color:var(--ld-line-strong)] pb-3 pr-4 font-medium">
                      Client
                    </th>
                    <th scope="col" className="border-b border-[color:var(--ld-line-strong)] pb-3 font-medium">
                      Guarantee
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[0.875rem] leading-[1.55]">
                  <tr className="transition-colors duration-200 hover:bg-[color:var(--ld-glass)]">
                    <td className="border-b border-[color:var(--ld-line)] py-4 pr-4 align-top text-[color:var(--ld-text)]">
                      Reads — messages, sessions, documents, vector search
                    </td>
                    <td className="f-mono border-b border-[color:var(--ld-line)] py-4 pr-4 align-top text-[0.75rem] text-[color:var(--ld-ice)]">
                      your JWT
                    </td>
                    <td className="border-b border-[color:var(--ld-line)] py-4 align-top text-[color:var(--ld-muted)]">
                      RLS enforced on every row the query touches
                    </td>
                  </tr>
                  <tr className="transition-colors duration-200 hover:bg-[color:var(--ld-glass)]">
                    <td className="py-4 pr-4 align-top text-[color:var(--ld-text)]">
                      Writes — messages, chunks, document status
                    </td>
                    <td className="f-mono py-4 pr-4 align-top text-[0.75rem] text-[color:var(--ld-ice)]">
                      service role
                    </td>
                    <td className="py-4 align-top text-[color:var(--ld-muted)]">
                      Runs only after auth is confirmed; never used for reads
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ----------------------------- CTA ----------------------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 lg:pt-20">
          <div
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-[color:var(--ld-line-strong)] bg-[color:var(--ld-deep)]/60 px-7 py-12 sm:px-12 lg:px-16 lg:py-16"
          >
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[color:var(--ld-ice)]/15 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ld-ice)]/60 to-transparent"
            />
            <div className="relative max-w-2xl">
              <h2 className="f-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--ld-text)] sm:text-[2.6rem]">
                Bring your documents.
              </h2>
              <p className="mt-4 text-[1rem] leading-[1.65] text-[color:var(--ld-muted)]">
                Up to 50 MB a file. Searchable the moment parsing finishes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/auth/signup"
                  className="ld-focus ld-cta flex min-h-[3rem] items-center rounded-xl px-7 text-[0.9375rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  Create your account
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </Link>
                <Link
                  href="/auth/login"
                  className="ld-focus flex min-h-[3rem] items-center rounded-xl border border-[color:var(--ld-line-strong)] bg-[color:var(--ld-glass)] px-7 text-[0.9375rem] font-semibold text-[color:var(--ld-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ld-ice)]/40 hover:bg-[color:var(--ld-glass-hi)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------------- Compressed footer ---------------------- */}
      <footer className="border-t border-[color:var(--ld-line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="f-display text-[0.9375rem] font-semibold text-[color:var(--ld-text)]">
              RAG Chat
            </span>
          </div>
          <p className="f-mono order-last w-full text-[0.625rem] uppercase tracking-[0.16em] text-[color:var(--ld-faint)] sm:order-none sm:w-auto">
            Next.js 15 · Supabase pgvector · deepseek-reasoner ·
            text-embedding-3-small
          </p>
          <div className="flex items-center gap-5 text-[0.8125rem]">
            <Link
              href="/auth/login"
              className="ld-focus text-[color:var(--ld-muted)] transition-all duration-200 hover:-translate-y-px hover:text-[color:var(--ld-text)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="ld-focus text-[color:var(--ld-muted)] transition-all duration-200 hover:-translate-y-px hover:text-[color:var(--ld-text)]"
            >
              Create account
            </Link>
            <span className="text-[color:var(--ld-faint)]">© {year} RAG Chat</span>
          </div>
        </div>
      </footer>

      {/* Scroll reveals: vanilla IntersectionObserver, progressive
          enhancement. Without JS, everything is simply visible.
          Reduced-motion users get no movement (handled in CSS). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var d=document;d.documentElement.classList.add('ld-js');var els=d.querySelectorAll('[data-reveal]');if(!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('is-in')});return}var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('is-in');io.unobserve(x.target)}})},{threshold:0.12,rootMargin:'0px 0px -8% 0px'});els.forEach(function(e){io.observe(e)})}catch(e){}})();`,
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Brand mark — document lines + cursor, matches app/icon.svg.       */
/* ------------------------------------------------------------------ */
function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-6 w-6 flex-shrink-0"
    >
      <defs>
        <linearGradient id="ldmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7CB8FF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0A0C12" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="13"
        fill="none"
        stroke="#26304A"
        strokeWidth="2"
      />
      <rect x="16" y="19" width="32" height="5" rx="2.5" fill="url(#ldmark)" />
      <rect
        x="16"
        y="29"
        width="32"
        height="5"
        rx="2.5"
        fill="url(#ldmark)"
        opacity="0.7"
      />
      <rect
        x="16"
        y="39"
        width="18"
        height="5"
        rx="2.5"
        fill="url(#ldmark)"
        opacity="0.5"
      />
      <circle cx="43" cy="41.5" r="3.2" fill="#7CB8FF" />
    </svg>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="ld-focus flex min-h-[2.75rem] items-center rounded-lg px-3.5 text-[0.875rem] font-medium text-[color:var(--ld-muted)] transition-all duration-200 hover:-translate-y-px hover:text-[color:var(--ld-text)]"
    >
      {children}
    </a>
  )
}
