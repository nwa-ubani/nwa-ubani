'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Survey } from '@/types'

export default function SendSurveyPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [htmlTemplate, setHtmlTemplate] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const responseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/responses/${surveyId}`
      : `/api/responses/${surveyId}`

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

  async function loadTemplate() {
    setLoadingTemplate(true)
    setError(null)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/send`)
      if (!res.ok) throw new Error('Failed to generate template')
      const data = await res.json()
      setHtmlTemplate(data.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  async function handleCopy() {
    if (!htmlTemplate) return
    try {
      await navigator.clipboard.writeText(htmlTemplate)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Copy failed - please select and copy manually')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="px-4 py-4 border-b border-[#0f3460]">
          <div className="h-6 bg-[#16213e] rounded w-1/2 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[#16213e] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-8">
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
            <h1 className="text-base font-bold text-white">MoEngage Template</h1>
            {survey && (
              <p className="text-xs text-gray-400 truncate max-w-[240px]">{survey.title}</p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Instructions banner */}
        <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#C41E3A]" />
            <span className="text-sm font-semibold text-white">How to use in MoEngage</span>
          </div>
          <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside leading-relaxed">
            <li>Go to <span className="text-white font-medium">MoEngage &rarr; Campaigns &rarr; Email &rarr; New Campaign</span></li>
            <li>Choose <span className="text-white font-medium">Custom HTML</span> as the template type</li>
            <li>Paste the HTML template below into the editor</li>
            <li>The <code className="bg-[#0d0d1a] px-1 py-0.5 rounded text-[#C41E3A]">{'{{$email}}'}</code> merge tag is already embedded — MoEngage replaces it with each recipient&apos;s email automatically</li>
            <li>Send your campaign as normal</li>
          </ol>
        </div>

        {/* Response capture URL */}
        <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] p-4">
          <p className="text-xs text-gray-400 mb-1">Response capture endpoint</p>
          <p className="text-xs font-mono text-[#C41E3A] break-all">{responseUrl}</p>
          <p className="text-xs text-gray-500 mt-1.5">
            Responses from the AMP form POST here and are saved to your Excel file.
          </p>
        </div>

        {/* Generate template button */}
        {!htmlTemplate && (
          <button
            onClick={loadTemplate}
            disabled={loadingTemplate}
            className="w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-[#C41E3A]/20 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            {loadingTemplate ? 'Generating...' : 'Generate HTML Template'}
          </button>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* HTML template block */}
        {htmlTemplate && (
          <div className="space-y-3">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-600 shadow-green-600/20 text-white'
                  : 'bg-[#C41E3A] shadow-[#C41E3A]/20 text-white'
              }`}
            >
              {copied ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy HTML
                </>
              )}
            </button>

            {/* Code block */}
            <div className="bg-[#0d0d1a] rounded-2xl border border-[#0f3460] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#0f3460]">
                <span className="text-xs font-mono text-gray-400">AMP Email HTML</span>
                <span className="text-xs text-gray-500">{htmlTemplate.length.toLocaleString()} chars</span>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto overflow-y-auto max-h-[400px] whitespace-pre leading-relaxed">
                {htmlTemplate}
              </pre>
            </div>

            <button
              onClick={loadTemplate}
              disabled={loadingTemplate}
              className="w-full py-3 bg-[#16213e] rounded-2xl border border-[#0f3460] text-sm font-medium text-gray-300 active:scale-[0.98] transition-transform"
            >
              {loadingTemplate ? 'Regenerating...' : 'Regenerate Template'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
