'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Survey } from '@/types'

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSurveys()
  }, [])

  async function fetchSurveys() {
    try {
      setLoading(true)
      const res = await fetch('/api/surveys')
      if (!res.ok) throw new Error('Failed to load surveys')
      const data = await res.json()
      setSurveys(data.surveys || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function getResponseRate(survey: Survey): string {
    if (!survey.sent_count) return '—'
    const rate = Math.round((survey.response_count / survey.sent_count) * 100)
    return `${rate}%`
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d1a]/95 backdrop-blur border-b border-[#0f3460] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Surveys</h1>
            <p className="text-xs text-gray-400 mt-0.5">In-email AMP surveys</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-[#16213e] px-2 py-1 rounded-full border border-[#0f3460]">
              {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#16213e] rounded-2xl p-4 border border-[#0f3460] animate-pulse"
              >
                <div className="h-4 bg-[#0f3460] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#0f3460] rounded w-1/2" />
                <div className="flex gap-4 mt-4">
                  <div className="h-8 bg-[#0f3460] rounded w-16" />
                  <div className="h-8 bg-[#0f3460] rounded w-16" />
                  <div className="h-8 bg-[#0f3460] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchSurveys}
              className="mt-4 px-4 py-2 bg-[#C41E3A] rounded-xl text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-white mb-2">No surveys yet</h2>
            <p className="text-gray-400 text-sm mb-6">
              Create your first in-email survey and start collecting responses.
            </p>
            <Link
              href="/surveys/new"
              className="inline-flex items-center gap-2 bg-[#C41E3A] text-white px-6 py-3 rounded-2xl font-semibold text-sm"
            >
              <span className="text-lg">+</span> Create Survey
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => (
              <Link
                key={survey.id}
                href={`/surveys/${survey.id}`}
                className="block bg-[#16213e] rounded-2xl p-4 border border-[#0f3460] active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight truncate">
                      {survey.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {survey.email_subject}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[#C41E3A]" />
                </div>

                <div className="flex items-center gap-0 mt-3 -mx-1">
                  <StatBadge
                    label="Sent"
                    value={survey.sent_count.toString()}
                  />
                  <StatBadge
                    label="Responses"
                    value={survey.response_count.toString()}
                  />
                  <StatBadge
                    label="Rate"
                    value={getResponseRate(survey)}
                    highlight={
                      survey.sent_count > 0 &&
                      survey.response_count / survey.sent_count > 0.3
                    }
                  />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(survey.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-20 max-w-[480px]" style={{ right: 'calc(50% - 216px)' }}>
        <Link
          href="/surveys/new"
          className="flex items-center justify-center w-14 h-14 bg-[#C41E3A] rounded-full shadow-lg shadow-[#C41E3A]/30 active:scale-95 transition-transform"
          aria-label="Create new survey"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function StatBadge({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex-1 px-1">
      <div className="bg-[#0d0d1a] rounded-xl p-2 text-center">
        <div className={`text-base font-bold ${highlight ? 'text-[#C41E3A]' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
