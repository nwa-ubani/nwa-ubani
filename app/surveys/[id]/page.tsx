'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Survey, SurveyResponse } from '@/types'

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview')

  useEffect(() => {
    fetchData()
  }, [surveyId])

  async function fetchData() {
    try {
      setLoading(true)
      const [surveyRes, responsesRes] = await Promise.all([
        fetch(`/api/surveys/${surveyId}`),
        fetch(`/api/responses/${surveyId}`),
      ])
      if (!surveyRes.ok) throw new Error('Survey not found')
      const surveyData = await surveyRes.json()
      setSurvey(surveyData.survey)

      if (responsesRes.ok) {
        const responsesData = await responsesRes.json()
        setResponses(responsesData.responses || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-4 border-b border-[#0f3460]">
          <div className="h-6 bg-[#16213e] rounded w-1/2 animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#16213e] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error || 'Survey not found'}</p>
        <Link href="/" className="text-[#C41E3A] underline text-sm">← Back to surveys</Link>
      </div>
    )
  }

  const responseRate = survey.sent_count
    ? Math.round((survey.response_count / survey.sent_count) * 100)
    : 0

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d1a]/95 backdrop-blur border-b border-[#0f3460] px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#16213e] border border-[#0f3460]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">{survey.title}</h1>
            <p className="text-xs text-gray-400 truncate">{survey.email_subject}</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-red-900/20 border border-red-900/40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard label="Sent" value={survey.sent_count} />
          <StatCard label="Responses" value={survey.response_count} />
          <StatCard label="Rate" value={`${responseRate}%`} highlight />
        </div>

        {/* Tabs */}
        <div className="flex bg-[#16213e] rounded-2xl p-1 mb-4 border border-[#0f3460]">
          {(['overview', 'responses'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-[#C41E3A] text-white'
                  : 'text-gray-400'
              }`}
            >
              {tab}
              {tab === 'responses' && responses.length > 0 && (
                <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {responses.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {survey.intro_text && (
              <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] p-4">
                <h3 className="text-xs font-medium text-gray-400 mb-1">Intro Text</h3>
                <p className="text-sm text-white">{survey.intro_text}</p>
              </div>
            )}

            <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#0f3460]">
                <h3 className="text-sm font-semibold text-white">
                  Questions ({survey.questions.length})
                </h3>
              </div>
              <div className="divide-y divide-[#0f3460]">
                {survey.questions.map((q, i) => (
                  <div key={q.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-[#C41E3A] mt-0.5">Q{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-white">{q.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize bg-[#0d0d1a] px-2 py-0.5 rounded-full border border-[#0f3460]">
                            {q.type === 'dropdown' ? 'single select' : q.type}
                          </span>
                          {q.required && (
                            <span className="text-xs text-[#C41E3A]">required</span>
                          )}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.options.map((opt) => (
                              <span
                                key={opt.id}
                                className="text-xs bg-[#0d0d1a] text-gray-400 px-2 py-0.5 rounded border border-[#0f3460]"
                              >
                                {opt.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div>
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-gray-400 text-sm">No responses yet</p>
                <p className="text-gray-500 text-xs mt-1">Send this survey to start collecting data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((resp) => (
                  <div
                    key={resp.id}
                    className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#0f3460] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{resp.respondent_email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(resp.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="divide-y divide-[#0f3460]">
                      {resp.answers.map((ans) => (
                        <div key={ans.question_id} className="px-4 py-2.5">
                          <p className="text-xs text-gray-400">{ans.question_text}</p>
                          <p className="text-sm text-white mt-0.5">
                            {ans.answer_text || ans.answer_value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Send Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 bg-gradient-to-t from-[#0d0d1a] to-transparent">
        <Link
          href={`/surveys/${surveyId}/send`}
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-base shadow-lg shadow-[#C41E3A]/20 active:scale-[0.98] transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Send Survey
        </Link>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-[480px] mx-auto bg-[#16213e] rounded-t-3xl p-6 border-t border-[#0f3460]">
            <h3 className="text-lg font-bold text-white mb-2">Delete Survey?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete &quot;{survey.title}&quot; and all its responses.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-[#0d0d1a] border border-[#0f3460] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] p-3 text-center">
      <div className={`text-2xl font-bold ${highlight ? 'text-[#C41E3A]' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}
