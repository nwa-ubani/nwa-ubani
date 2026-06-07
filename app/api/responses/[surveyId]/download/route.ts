import { NextRequest, NextResponse } from 'next/server'
import { getResponsesAsBuffer } from '@/lib/excel-store'
import { memStore } from '@/lib/store'

export async function GET(req: NextRequest, { params }: { params: { surveyId: string } }) {
  const survey = memStore.getSurvey(params.surveyId)
  const buffer = getResponsesAsBuffer(params.surveyId)

  if (!buffer) {
    return NextResponse.json({ error: 'No responses yet' }, { status: 404 })
  }

  const filename = survey
    ? `${survey.title.replace(/[^a-z0-9]/gi, '_')}_responses.xlsx`
    : `survey_${params.surveyId}_responses.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
