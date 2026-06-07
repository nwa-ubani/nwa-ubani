import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isMoEngageConfigured } from '@/lib/moengage'
import { isEmailConfigured } from '@/lib/email-sender'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    services: {
      supabase: isSupabaseConfigured() ? 'configured' : 'not configured (using in-memory store)',
      moengage: isMoEngageConfigured() ? 'configured' : 'not configured (responses not synced)',
      email: isEmailConfigured() ? 'configured' : 'not configured (cannot send)',
    },
  })
}
