import { NextResponse } from 'next/server'
import { memStore } from '@/lib/store'
import type { CreateSurveyPayload } from '@/types'

export async function GET() {
  const surveys = memStore.listSurveys()
  return NextResponse.json({ surveys })
}

export async function POST(request: Request) {
  try {
    const body: CreateSurveyPayload = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.email_subject?.trim()) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 })
    }
    if (!body.questions?.length) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    const survey = memStore.createSurvey(body)
    return NextResponse.json({ survey }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
