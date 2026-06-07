import { NextResponse } from 'next/server'
import { memStore } from '@/lib/store'
import { syncSurveyResponse } from '@/lib/moengage'
import type { ResponseAnswer } from '@/types'

// AMP for Email requires CORS from mail client origins
const AMP_ALLOWED_ORIGINS = [
  'https://mail.google.com',
  'https://mail.yahoo.com',
  'https://outlook.live.com',
  'https://outlook.office.com',
  'https://outlook.office365.com',
]

function corsHeaders(origin: string | null) {
  const allowed =
    origin && AMP_ALLOWED_ORIGINS.includes(origin) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, AMP-Same-Origin',
    'Access-Control-Expose-Headers': 'AMP-Access-Control-Allow-Source-Origin',
    'AMP-Access-Control-Allow-Source-Origin':
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function GET(
  request: Request,
  { params }: { params: { surveyId: string } }
) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)
  const responses = memStore.getResponses(params.surveyId)
  return NextResponse.json({ responses }, { headers })
}

export async function POST(
  request: Request,
  { params }: { params: { surveyId: string } }
) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)

  const survey = memStore.getSurvey(params.surveyId)
  if (!survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404, headers })
  }

  let respondentEmail = ''
  const answers: ResponseAnswer[] = []

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json()
    respondentEmail = body.respondent_email || ''
    // Expect body.answers as array of ResponseAnswer
    if (Array.isArray(body.answers)) {
      answers.push(...body.answers)
    }
  } else {
    // AMP forms submit as application/x-www-form-urlencoded
    const formData = await request.formData()
    respondentEmail = (formData.get('respondent_email') as string) || ''

    // Map each q_{questionId} field back to question text + answer
    const formEntries = Array.from(formData.entries())
    for (const [key, value] of formEntries) {
      if (!key.startsWith('q_')) continue
      const questionId = key.replace('q_', '')
      const question = survey.questions.find(q => q.id === questionId)
      if (!question) continue

      const answerValue = String(value)
      let answerText = answerValue

      // For dropdown, resolve the display text
      if (question.type === 'dropdown' && question.options) {
        const opt = question.options.find(o => o.value === answerValue)
        if (opt) answerText = opt.text
      }

      answers.push({
        question_id: questionId,
        question_text: question.text,
        answer_value: answerValue,
        answer_text: answerText,
      })
    }
  }

  if (!respondentEmail) {
    return NextResponse.json({ error: 'respondent_email is required' }, { status: 400, headers })
  }

  const response = memStore.addResponse(params.surveyId, {
    survey_id: params.surveyId,
    respondent_email: respondentEmail,
    answers,
  })

  if (!response) {
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500, headers })
  }

  // Sync to MoEngage asynchronously — don't block the email response
  syncSurveyResponse(respondentEmail, survey.title, survey.id, answers).catch(err =>
    console.error('[MoEngage sync error]', err)
  )

  return NextResponse.json(
    { success: true, response_id: response.id },
    { status: 200, headers }
  )
}
