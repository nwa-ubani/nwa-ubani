'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { QuestionType, AnswerOption } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface LocalQuestion {
  id: string
  text: string
  type: QuestionType
  required: boolean
  options: AnswerOption[]
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'dropdown', label: 'Single Select', icon: '☑' },
  { value: 'text', label: 'Text Input', icon: '✏️' },
  { value: 'rating', label: 'Rating 1–5', icon: '⭐' },
]

export default function NewSurveyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [introText, setIntroText] = useState('')
  const [questions, setQuestions] = useState<LocalQuestion[]>([
    {
      id: uuidv4(),
      text: '',
      type: 'dropdown',
      required: true,
      options: [
        { id: uuidv4(), text: 'Option 1', value: 'option_1' },
        { id: uuidv4(), text: 'Option 2', value: 'option_2' },
      ],
    },
  ])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addQuestion() {
    if (questions.length >= 6) return
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        text: '',
        type: 'dropdown',
        required: false,
        options: [
          { id: uuidv4(), text: 'Option 1', value: 'option_1' },
          { id: uuidv4(), text: 'Option 2', value: 'option_2' },
        ],
      },
    ])
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) return
    setQuestions(questions.filter((q) => q.id !== id))
  }

  function updateQuestion(id: string, updates: Partial<LocalQuestion>) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  function addOption(questionId: string) {
    const q = questions.find((q) => q.id === questionId)
    if (!q) return
    const newIdx = q.options.length + 1
    const newOpt: AnswerOption = {
      id: uuidv4(),
      text: `Option ${newIdx}`,
      value: `option_${newIdx}`,
    }
    updateQuestion(questionId, { options: [...q.options, newOpt] })
  }

  function removeOption(questionId: string, optionId: string) {
    const q = questions.find((q) => q.id === questionId)
    if (!q || q.options.length <= 1) return
    updateQuestion(questionId, {
      options: q.options.filter((o) => o.id !== optionId),
    })
  }

  function updateOption(questionId: string, optionId: string, text: string) {
    const q = questions.find((q) => q.id === questionId)
    if (!q) return
    updateQuestion(questionId, {
      options: q.options.map((o) =>
        o.id === optionId
          ? { ...o, text, value: text.toLowerCase().replace(/[^a-z0-9]+/g, '_') }
          : o
      ),
    })
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Survey title is required'
    if (!emailSubject.trim()) newErrors.emailSubject = 'Email subject is required'
    questions.forEach((q, i) => {
      if (!q.text.trim()) newErrors[`q_${i}`] = 'Question text is required'
      if (q.type === 'dropdown' && q.options.length < 2) {
        newErrors[`q_opts_${i}`] = 'At least 2 options required'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        email_subject: emailSubject.trim(),
        intro_text: introText.trim(),
        questions: questions.map((q, i) => ({
          order_index: i,
          text: q.text.trim(),
          type: q.type,
          required: q.required,
          options: q.type === 'dropdown' ? q.options : [],
        })),
      }
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create survey')
      }
      const data = await res.json()
      router.push(`/surveys/${data.survey.id}`)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d1a]/95 backdrop-blur border-b border-[#0f3460] px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#16213e] border border-[#0f3460] active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">New Survey</h1>
            <p className="text-xs text-gray-400">Build your in-email survey</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Survey Info */}
        <Section title="Survey Details">
          <Field
            label="Survey Title"
            error={errors.title}
            required
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Satisfaction Q4"
              className="input-base"
            />
          </Field>
          <Field
            label="Email Subject Line"
            error={errors.emailSubject}
            required
          >
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="e.g. Quick 1-minute survey for you"
              className="input-base"
            />
          </Field>
          <Field label="Intro Message (optional)">
            <textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="e.g. We'd love to hear your thoughts..."
              rows={2}
              className="input-base resize-none"
            />
          </Field>
        </Section>

        {/* Questions */}
        <Section
          title="Questions"
          hint={`${questions.length} / 6`}
        >
          <div className="space-y-3">
            {questions.map((q, index) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={index}
                canRemove={questions.length > 1}
                error={errors[`q_${index}`]}
                optionsError={errors[`q_opts_${index}`]}
                onUpdate={(updates) => updateQuestion(q.id, updates)}
                onRemove={() => removeQuestion(q.id)}
                onAddOption={() => addOption(q.id)}
                onRemoveOption={(optId) => removeOption(q.id, optId)}
                onUpdateOption={(optId, text) => updateOption(q.id, optId, text)}
              />
            ))}
          </div>

          {questions.length < 6 && (
            <button
              onClick={addQuestion}
              className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed border-[#0f3460] text-gray-400 text-sm font-medium active:scale-[0.98] transition-transform hover:border-[#C41E3A] hover:text-[#C41E3A]"
            >
              + Add Question
            </button>
          )}
        </Section>

        {errors.submit && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-3 text-sm text-red-400">
            {errors.submit}
          </div>
        )}
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 bg-gradient-to-t from-[#0d0d1a] to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-[#C41E3A] rounded-2xl text-white font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-[#C41E3A]/20"
        >
          {saving ? 'Saving...' : 'Save Survey'}
        </button>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          background: #0d0d1a;
          border: 1px solid #0f3460;
          border-radius: 12px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #C41E3A;
        }
        .input-base::placeholder {
          color: #4b5563;
        }
      `}</style>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#16213e] rounded-2xl border border-[#0f3460] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0f3460]">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label}
        {required && <span className="text-[#C41E3A] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function QuestionCard({
  question,
  index,
  canRemove,
  error,
  optionsError,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: {
  question: LocalQuestion
  index: number
  canRemove: boolean
  error?: string
  optionsError?: string
  onUpdate: (updates: Partial<LocalQuestion>) => void
  onRemove: () => void
  onAddOption: () => void
  onRemoveOption: (optId: string) => void
  onUpdateOption: (optId: string, text: string) => void
}) {
  return (
    <div className="bg-[#0d0d1a] rounded-xl border border-[#0f3460] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#C41E3A]">Q{index + 1}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ required: !question.required })}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              question.required
                ? 'border-[#C41E3A] text-[#C41E3A] bg-[#C41E3A]/10'
                : 'border-[#0f3460] text-gray-500'
            }`}
          >
            Required
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-red-900/20 text-red-400 text-xs active:scale-95"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder={`Question ${index + 1}`}
        className="w-full bg-[#16213e] border border-[#0f3460] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#C41E3A] transition-colors"
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {/* Type selector */}
      <div className="flex gap-1.5 mt-2">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onUpdate({ type: t.value })}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              question.type === t.value
                ? 'bg-[#C41E3A] text-white'
                : 'bg-[#16213e] text-gray-400 border border-[#0f3460]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Options for dropdown */}
      {question.type === 'dropdown' && (
        <div className="mt-2 space-y-1.5">
          {question.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600 w-4 text-center">{i + 1}.</span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => onUpdateOption(opt.id, e.target.value)}
                className="flex-1 bg-[#16213e] border border-[#0f3460] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C41E3A] transition-colors"
              />
              {question.options.length > 1 && (
                <button
                  onClick={() => onRemoveOption(opt.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {optionsError && <p className="text-xs text-red-400">{optionsError}</p>}
          <button
            onClick={onAddOption}
            className="text-xs text-[#C41E3A] mt-1 px-1"
          >
            + Add option
          </button>
        </div>
      )}

      {question.type === 'text' && (
        <div className="mt-2 px-2 py-2 bg-[#16213e] rounded-xl border border-dashed border-[#0f3460]">
          <p className="text-xs text-gray-500 italic">Respondent will type a free-form answer</p>
        </div>
      )}

      {question.type === 'rating' && (
        <div className="mt-2 flex items-center justify-center gap-2 py-2 bg-[#16213e] rounded-xl border border-dashed border-[#0f3460]">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="w-7 h-7 rounded-full bg-[#0f3460] border border-[#C41E3A]/30 flex items-center justify-center text-xs text-gray-400"
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
