import { NextResponse } from 'next/server'
import { memStore } from '@/lib/store'
import { generateAmpEmail } from '@/lib/amp-email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(
  _req: Request,
  { params }: { params: { surveyId: string } }
) {
  const survey = memStore.getSurvey(params.surveyId)
  if (!survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  // Generate the AMP email with a placeholder email for preview
  const html = generateAmpEmail(survey, APP_URL, 'preview@example.com')

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
