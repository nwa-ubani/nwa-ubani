import { NextRequest, NextResponse } from 'next/server'
import { memStore } from '@/lib/store'
import { generateAmpEmail } from '@/lib/amp-email'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const survey = memStore.getSurvey(params.id)
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'
  const html = generateAmpEmail(survey, baseUrl)

  return NextResponse.json({ html, surveyId: params.id })
}
