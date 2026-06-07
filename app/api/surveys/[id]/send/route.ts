import { NextResponse } from 'next/server'
import { memStore } from '@/lib/store'
import { generateAmpEmail, generateFallbackHtml } from '@/lib/amp-email'
import { sendSurveyEmail, isEmailConfigured } from '@/lib/email-sender'
import type { SendSurveyPayload } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const survey = memStore.getSurvey(params.id)
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  const body: SendSurveyPayload = await request.json()
  const recipients = body.recipients?.filter(e => e.trim()) ?? []

  if (!recipients.length) {
    return NextResponse.json({ error: 'At least one recipient required' }, { status: 400 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error: 'Email not configured',
        detail: 'Set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file',
      },
      { status: 503 }
    )
  }

  const results: Array<{ email: string; status: 'sent' | 'failed'; error?: string }> = []

  for (const email of recipients) {
    try {
      const ampHtml = generateAmpEmail(survey, APP_URL, email)
      const fallbackHtml = generateFallbackHtml(survey, APP_URL)

      await sendSurveyEmail({
        to: email,
        subject: survey.email_subject,
        ampHtml,
        fallbackHtml,
        plainText: `${survey.title}\n\n${survey.intro_text}\n\nOpen survey: ${APP_URL}/s/${survey.id}`,
      })

      results.push({ email, status: 'sent' })
    } catch (err) {
      results.push({ email, status: 'failed', error: String(err) })
    }
  }

  const sentCount = results.filter(r => r.status === 'sent').length
  memStore.incrementSentCount(params.id, sentCount)

  return NextResponse.json({
    results,
    sent_count: sentCount,
    failed_count: recipients.length - sentCount,
    message: `Survey sent to ${sentCount} recipient(s)`,
  })
}
