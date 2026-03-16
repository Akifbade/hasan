import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import AddSurveyorForm from './AddSurveyorForm'

export default async function SurveyorsPage() {
  const supabase = createAdminClient()

  const { data: surveyors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'surveyor')
    .order('created_at', { ascending: false })

  const { data: assignmentCounts } = await supabase
    .from('survey_assignments')
    .select('surveyor_id, status')

  const countMap: Record<string, { total: number; active: number }> = {}
  for (const a of assignmentCounts || []) {
    if (!countMap[a.surveyor_id]) countMap[a.surveyor_id] = { total: 0, active: 0 }
    countMap[a.surveyor_id].total++
    if (a.status === 'in_progress' || a.status === 'assigned') {
      countMap[a.surveyor_id].active++
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveyors</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your survey team</p>
        </div>
        <AddSurveyorForm />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{surveyors?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Surveyors</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {surveyors?.filter(s => s.is_available).length || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Available Now</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">
            {Object.values(countMap).reduce((sum, c) => sum + c.active, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Active Assignments</div>
        </div>
      </div>

      {/* Surveyors Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Surveyor</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Assignments</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {surveyors?.map((s: any) => {
                const counts = countMap[s.id] || { total: 0, active: 0 }
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {s.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{s.full_name}</div>
                          <div className="text-xs text-gray-400 font-mono">{s.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {s.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${s.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {s.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{counts.active}</span>
                        <span className="text-gray-400"> active</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="text-gray-500">{counts.total} total</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <ToggleAvailabilityButton id={s.id} available={s.is_available} />
                    </td>
                  </tr>
                )
              })}
              {(!surveyors || surveyors.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No surveyors yet. Add your first team member above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Inline client component for availability toggle
function ToggleAvailabilityButton({ id, available }: { id: string; available: boolean }) {
  return (
    <form action={async () => {
      'use server'
      const { createAdminClient } = await import('@/lib/supabase/server')
      const admin = createAdminClient()
      await admin.from('profiles').update({ is_available: !available }).eq('id', id)
    }}>
      <button
        type="submit"
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
          ${available
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
      >
        Mark {available ? 'Unavailable' : 'Available'}
      </button>
    </form>
  )
}
