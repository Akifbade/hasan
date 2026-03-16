import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map(c => c.name)
  const supabaseCookies = cookieNames.filter(n => n.includes('sb-') || n.includes('supabase'))

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  let profile = null
  let profileError = null

  if (user) {
    try {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = data
      profileError = error?.message ?? null
    } catch (e: any) {
      profileError = e?.message ?? 'unknown error'
    }
  }

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50),
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30),
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30),
    cookiesReceived: cookieNames,
    supabaseCookies,
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message ?? null,
    profile: profile ? { id: (profile as any).id, role: (profile as any).role } : null,
    profileError,
  })
}
