'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Survey, ResponseAnswer } from '@/types'

export default function WebSurveyPage() {
  const params = useParams()
  const surveyId = params.surveyId as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then(r => r.json())
      .then(d => setSurvey(d.survey))
      .catch(() => setError('Survey not found'))
      .finally(() => setLoading(false))
  }, [surveyId])

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!survey) return
    if (!email.trim()) { setError('Email is required'); return }

    const responseAnswers: ResponseAnswer[] = survey.questions.map(q => {
      const val = answers[q.id] || ''
      let text = val
      if (q.type === 'dropdown' && q.options) {
        const opt = q.options.find(o => o.value === val)
        if (opt) text = opt.text
      }
      return { question_id: q.id, question_text: q.text, answer_value: val, answer_text: text }
    })

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/responses/${surveyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondent_email: email, survey_id: surveyId, answers: responseAnswers }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">This survey may have been removed or the link is invalid.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">Thank you!</h2>
          <p className="text-gray-400 text-sm">Your response has been recorded.</p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-[480px] mx-auto">
        <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden">
          <div className="bg-gradient-to-r from-[#C41E3A]/20 to-transparent px-6 py-5 border-b border-[#0f3460]">
            <h1 className="text-lg font-bold text-[#C41E3A]">Friend, let&apos;s update your status;</h1>
            {survey.intro_text && (
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{survey.intro_text}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Your Email <span className="text-[#C41E3A]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0d0d1a] border border-[#0f3460] rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#C41E3A] transition-colors"
              />
            </div>

            {survey.questions.map((q, i) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-white mb-2">
                  {i + 1}. {q.text}
                  {q.required && <span className="text-[#C41E3A] ml-0.5">*</span>}
                </label>

                {q.type === 'dropdown' && q.options && (
                  <select
                    value={answers[q.id] || ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    required={q.required}
                    className="w-full bg-[#0d0d1a] border border-[#0f3460] rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#C41E3A] transition-colors appearance-none"
                  >
                    <option value="">Choose answer...</option>
                    {q.options.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.text}</option>
                    ))}
                  </select>
                )}

                {q.type === 'text' && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    required={q.required}
                    placeholder="Your answer..."
                    className="w-full bg-[#0d0d1a] border border-[#0f3460] rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#C41E3A] transition-colors"
                  />
                )}

                {q.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, String(n))}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                          answers[q.id] === String(n)
                            ? 'bg-[#C41E3A] text-white'
                            : 'bg-[#0d0d1a] border border-[#0f3460] text-gray-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {submitting ? 'Submitting...' : 'Submit Profile'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Note: Your browser may show a standard security prompt. Please click &apos;OK&apos; to finalize your submission.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
