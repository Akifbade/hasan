import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

export default async function SurveyorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('survey_assignments')
    .select('*, survey_requests(*)')
    .eq('surveyor_id', user!.id)
    .not('status', 'eq', 'cancelled')
    .order('scheduled_date', { ascending: true })

  const today = assignments?.filter((a: any) => a.status !== 'completed') || []
  const completed = assignments?.filter((a: any) => a.status === 'completed') || []

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-sm text-gray-500">{today.length} active job{today.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Active assignments */}
      <div className="space-y-3">
        {today.map((assignment: any) => {
          const survey = assignment.survey_requests
          return (
            <Link
              key={assignment.id}
              href={`/surveyor/survey/${survey.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{survey.customer_name}</div>
                  <div className="text-xs text-blue-600 font-mono mt-0.5">#{survey.tracking_code}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[assignment.status]}`}>
                  {STATUS_LABELS[assignment.status]}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span>📍</span>
                  <span className="flex-1">{survey.pickup_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌍</span>
                  <span>{survey.pickup_country} → {survey.destination_country || '?'}</span>
                </div>
                {assignment.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(assignment.scheduled_date)}</span>
                  </div>
                )}
                {survey.customer_phone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a
                      href={`tel:${survey.customer_phone}`}
                      onClick={e => e.stopPropagation()}
                      className="text-blue-600 hover:underline"
                    >
                      {survey.customer_phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 capitalize">{survey.property_type || 'Property'}</span>
                <span className="text-blue-600 text-sm font-medium">
                  {assignment.status === 'assigned' ? 'Start Survey →' : 'Continue →'}
                </span>
              </div>
            </Link>
          )
        })}

        {today.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <p>No active assignments</p>
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Completed ({completed.length})</h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map((assignment: any) => {
              const survey = assignment.survey_requests
              return (
                <Link
                  key={assignment.id}
                  href={`/surveyor/survey/${survey.id}`}
                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 text-sm shadow-sm border border-gray-100"
                >
                  <div>
                    <span className="font-medium text-gray-700">{survey.customer_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{formatDate(assignment.completed_at)}</span>
                  </div>
                  <span className="text-green-600 font-medium text-xs">✓ Done</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
