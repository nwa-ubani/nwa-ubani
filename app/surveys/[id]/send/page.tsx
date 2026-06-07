'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Survey } from '@/types'

export default function SendSurveyPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipientsInput, setRecipientsInput] = useState('')
  const [sendViaMoEngage, setSendViaMoEngage] = useState(false)
  const [moEngageSegmentId, setMoEngageSegmentId] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; sent?: number } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`)
        if (!res.ok) throw new Error('Survey not found')
        const data = await res.json()
        setSurvey(data.survey)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [surveyId])

  async function loadPreview() {
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/email-preview/${surveyId}`)
      if (!res.ok) throw new Error('Failed to load preview')
      const html = await res.text()
      setPreviewHtml(html)
      setShowPreview(true)
    } catch {
      // ignore preview errors
    } finally {
      setLoadingPreview(false)
    }
  }

  function parseRecipients(): string[] {
    return recipientsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  }

  async function handleSend() {
    const recipients = parseRecipients()
    if (recipients.length === 0 && !sendViaMoEngage) {
      setError('Enter at least one valid email address')
      return
    }

    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          send_via_moengage: sendViaMoEngage,
          moengage_segment_id: moEngageSegmentId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setResult({
        success: true,
        message: data.message || `Survey sent to ${data.sent_count} recipient(s)`,
        sent: data.sent_count,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="px-4 py-4 border-b border-[#0f3460]">
          <div className="h-6 bg-[#16213e] rounded w-1/2 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-[#16213e] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-white mb-2">Survey Sent!</h2>
        <p className="text-gray-400 text-sm mb-8">{result.message}</p>
        <div className="flex flex-col gap-3 w-full">
          <Link
            href={`/surveys/${surveyId}`}
            className="block w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-center"
          >
            View Responses
          </Link>
          <Link
            href="/"
            className="block w-full py-4 bg-[#16213e] rounded-2xl text-white font-medium text-center border border-[#0f3460]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d1a]/95 backdrop-blur border-b border-[#0f3460] px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/surveys/${surveyId}`}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#16213e] border border-[#0f3460]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">Send Survey</h1>
            {survey && <p className="text-xs text-gray-400 truncate max-w-[240px]">{survey.title}</p>}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Survey info */}
        {survey && (
          <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#C41E3A]" />
              <span className="text-xs text-gray-400">Subject Line</span>
            </div>
            <p className="text-sm font-medium text-white">{survey.email_subject}</p>
            <p className="text-xs text-gray-500 mt-1">
              {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Direct Email Recipients */}
        <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#0f3460]">
            <h2 className="text-sm font-semibold text-white">Recipients</h2>
            <p className="text-xs text-gray-400 mt-0.5">Separate emails with commas or new lines</p>
          </div>
          <div className="p-4">
            <textarea
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              placeholder="alice@example.com, bob@example.com&#10;carol@example.com"
              rows={4}
              className="w-full bg-[#0d0d1a] border border-[#0f3460] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#C41E3A] resize-none transition-colors"
            />
            {recipientsInput && (
              <p className="text-xs text-gray-500 mt-1.5">
                {parseRecipients().length} valid email{parseRecipients().length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
        </div>

        {/* MoEngage Toggle */}
        <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">MoEngage Campaign</h2>
                <p className="text-xs text-gray-400 mt-0.5">Send via MoEngage transactional API</p>
              </div>
              <button
                onClick={() => setSendViaMoEngage(!sendViaMoEngage)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  sendViaMoEngage ? 'bg-[#C41E3A]' : 'bg-[#0f3460]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    sendViaMoEngage ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {sendViaMoEngage && (
              <div className="mt-3 pt-3 border-t border-[#0f3460]">
                <label className="block text-xs text-gray-400 mb-1.5">
                  Segment ID (optional)
                </label>
                <input
                  type="text"
                  value={moEngageSegmentId}
                  onChange={(e) => setMoEngageSegmentId(e.target.value)}
                  placeholder="MoEngage segment ID"
                  className="w-full bg-[#0d0d1a] border border-[#0f3460] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#C41E3A] transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Leave blank to send to all active contacts
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={loadPreview}
          disabled={loadingPreview}
          className="w-full py-3 bg-[#16213e] rounded-2xl border border-[#0f3460] text-sm font-medium text-gray-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {loadingPreview ? 'Loading Preview...' : 'Preview Email'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </main>

      {/* Send Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 bg-gradient-to-t from-[#0d0d1a] to-transparent">
        <button
          onClick={handleSend}
          disabled={sending || (parseRecipients().length === 0 && !sendViaMoEngage)}
          className="w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-[#C41E3A]/20 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          {sending ? 'Sending...' : `Send to ${parseRecipients().length || (sendViaMoEngage ? 'MoEngage' : 0)}`}
        </button>
      </div>

      {/* Email Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#16213e] border-b border-[#0f3460]">
            <h3 className="text-sm font-semibold text-white">Email Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 text-lg w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  )
}
