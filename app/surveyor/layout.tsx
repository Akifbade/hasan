import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SurveyorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/surveyor')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'surveyor') redirect('/unauthorized')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">QGO Surveyor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{profile.full_name}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
