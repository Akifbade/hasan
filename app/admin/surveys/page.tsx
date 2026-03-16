import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'

export default async function SurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('survey_requests')
    .select('*, survey_assignments(*, profiles(full_name, phone))')
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.search) {
    query = query.or(
      `customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%,tracking_code.ilike.%${params.search}%`
    )
  }

  const { data: surveys } = await query

  const STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'quoted', 'paid']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Survey Requests</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form method="GET" className="flex gap-2 flex-1 min-w-64">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search by name, email, tracking code..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            Search
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/surveys"
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${!params.status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:border-blue-300'}`}
          >
            All
          </Link>
          {STATUSES.map(s => (
            <Link
              key={s}
              href={`/admin/surveys?status=${s}`}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${params.status === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:border-blue-300'}`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Tracking</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Surveyor</th>
                <th className="px-6 py-3">Preferred Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {surveys?.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{s.customer_name}</div>
                      <div className="text-xs text-gray-500">{s.customer_email}</div>
                      {s.customer_phone && <div className="text-xs text-gray-400">{s.customer_phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-blue-600">{s.tracking_code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{s.pickup_city}, {s.pickup_country}</div>
                    <div className="text-gray-400">→ {s.destination_city ? `${s.destination_city}, ` : ''}{s.destination_country || '?'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {s.survey_assignments?.[0]?.profiles?.full_name ? (
                      <span className="text-gray-700">{s.survey_assignments[0].profiles.full_name}</span>
                    ) : (
                      <span className="text-orange-500 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {s.preferred_date ? formatDate(s.preferred_date) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!surveys || surveys.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No surveys found
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
