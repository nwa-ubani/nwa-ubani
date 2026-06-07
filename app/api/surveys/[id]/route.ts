import { NextResponse } from 'next/server'
import { memStore } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const survey = memStore.getSurvey(params.id)
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ survey })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const survey = memStore.getSurvey(params.id)
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const updates = await request.json()
    // Simple update: only allow updating title, email_subject, intro_text
    const { title, email_subject, intro_text } = updates
    const updatedSurvey = {
      ...survey,
      ...(title !== undefined && { title }),
      ...(email_subject !== undefined && { email_subject }),
      ...(intro_text !== undefined && { intro_text }),
      updated_at: new Date().toISOString(),
    }
    // Re-store the updated survey via direct map manipulation
    const store = (global as { __survey_store?: { surveys: Map<string, typeof survey> } }).__survey_store
    if (store) store.surveys.set(params.id, updatedSurvey)
    return NextResponse.json({ survey: updatedSurvey })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const deleted = memStore.deleteSurvey(params.id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
