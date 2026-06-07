import { NextResponse } from 'next/server'
import { isMoEngageConfigured } from '@/lib/moengage'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    services: {
      moengage: isMoEngageConfigured() ? 'configured' : 'not configured (responses not synced to MoEngage)',
      storage: 'excel (responses saved to data/*.xlsx)',
    },
  })
}
