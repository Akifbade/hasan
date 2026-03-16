import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // Use getSession (reads from cookie, no network call) for faster layout rendering
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login?redirect=/admin')

  // Use admin client to bypass RLS for profile read (avoids policy infinite recursion)
  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
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
