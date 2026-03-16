import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  // Fetch stats
  const [
    { count: total },
    { count: pending },
    { count: inProgress },
    { count: completed },
    { data: recentSurveys },
  ] = await Promise.all([
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }),
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('survey_requests')
      .select('*, survey_assignments(*, profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const stats = [
    { label: 'Total Requests', value: total || 0, color: 'bg-blue-50 text-blue-600', icon: '📋' },
    { label: 'Pending', value: pending || 0, color: 'bg-yellow-50 text-yellow-600', icon: '⏳' },
    { label: 'In Progress', value: inProgress || 0, color: 'bg-purple-50 text-purple-600', icon: '🔄' },
    { label: 'Completed', value: completed || 0, color: 'bg-green-50 text-green-600', icon: '✅' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all survey activities</p>
        </div>
        <Link
          href="/admin/surveys"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          View All Surveys
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Surveys */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Survey Requests</h2>
          <Link href="/admin/surveys" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Tracking</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Surveyor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSurveys?.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{s.customer_name}</div>
                      <div className="text-xs text-gray-500">{s.customer_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-blue-600">{s.tracking_code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {s.pickup_country} → {s.destination_country || '?'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {s.survey_assignments?.[0]?.profiles?.full_name || (
                      <span className="text-orange-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(s.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!recentSurveys || recentSurveys.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No survey requests yet
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
