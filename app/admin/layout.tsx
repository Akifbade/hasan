import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  // Use admin client to bypass RLS for profile read (avoids policy infinite recursion)
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Admin layout profile error:', profileError?.message, 'userId:', user.id)
    redirect('/login')
  }

  // Surveyors should go to their own portal
  if (profile.role === 'surveyor') {
    redirect('/surveyor')
  }

  if (!['admin', 'super_admin'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
