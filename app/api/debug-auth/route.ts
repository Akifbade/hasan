import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map(c => c.name)
  const supabaseCookies = cookieNames.filter(n => n.includes('sb-') || n.includes('supabase'))

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50),
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30),
    cookiesReceived: cookieNames,
    supabaseCookies,
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  })
}
