'use server'

import { cookies } from 'next/headers'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | { success: true; role: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Step 1: Authenticate directly with Supabase REST API
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify({ email, password }),
  })

  const authData = await authRes.json()

  if (!authRes.ok || !authData.access_token) {
    return { error: authData.error_description || authData.msg || 'Invalid credentials' }
  }

  // Step 2: Get user role from profiles table
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}&select=role`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  })
  const profiles = await profileRes.json()
  const role = profiles?.[0]?.role ?? 'admin'

  // Step 3: Set session cookie exactly as @supabase/ssr expects
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  const sessionData = {
    access_token: authData.access_token,
    token_type: authData.token_type,
    expires_in: authData.expires_in,
    expires_at: authData.expires_at,
    refresh_token: authData.refresh_token,
    user: authData.user,
  }

  // @supabase/ssr format: "base64-" + base64url(JSON.stringify(session))
  const jsonStr = JSON.stringify(sessionData)
  const base64url = Buffer.from(jsonStr).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const cookieValue = `base64-${base64url}`

  const cookieStore = await cookies()
  cookieStore.set(cookieName, cookieValue, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 400 * 24 * 60 * 60,
    secure: true,
  })

  return { success: true, role }
}
