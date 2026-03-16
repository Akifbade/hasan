import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function AnalyticsPage() {
  const supabase = await createAdminClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  const [
    { count: totalSurveys },
    { count: thisMonthSurveys },
    { count: lastMonthSurveys },
    { data: allSurveys },
    { data: surveyors },
    { data: surveys },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }),
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
    supabase.from('survey_requests').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
    supabase.from('survey_requests').select('destination_country, status, created_at').gte('created_at', sixMonthsAgo),
    supabase.from('profiles').select('id, full_name').eq('role', 'surveyor'),
    supabase.from('surveys').select('total_volume_m3, container_type, completed_at').gte('completed_at', sixMonthsAgo),
    supabase.from('invoices').select('amount, currency, payment_status, created_at').gte('created_at', sixMonthsAgo),
  ])

  // Monthly breakdown (last 6 months)
  const monthLabels = []
  const monthData: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en', { month: 'short', year: '2-digit' })
    monthLabels.push({ key, label })
    monthData[key] = 0
  }
  for (const s of allSurveys || []) {
    const key = s.created_at.slice(0, 7)
    if (monthData[key] !== undefined) monthData[key]++
  }
  const maxMonth = Math.max(...Object.values(monthData), 1)

  // Top destinations
  const destMap: Record<string, number> = {}
  for (const s of allSurveys || []) {
    const d = s.destination_country || 'Unknown'
    destMap[d] = (destMap[d] || 0) + 1
  }
  const topDestinations = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Container type split
  const containerMap: Record<string, number> = { lcl: 0, '20ft': 0, '40ft': 0 }
  for (const s of surveys || []) {
    if (s.container_type && containerMap[s.container_type] !== undefined) {
      containerMap[s.container_type]++
    }
  }

  // Revenue (paid invoices)
  const totalRevenue = (invoices || [])
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const pendingRevenue = (invoices || [])
    .filter(i => i.payment_status === 'pending')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  // Surveyor performance
  const { data: assignments } = await supabase
    .from('survey_assignments')
    .select('surveyor_id, status')
    .eq('status', 'completed' as string)

  const surveyorMap: Record<string, number> = {}
  for (const a of assignments || []) {
    surveyorMap[a.surveyor_id] = (surveyorMap[a.surveyor_id] || 0) + 1
  }

  const surveyorPerf = (surveyors || [])
    .map(s => ({ name: s.full_name, count: surveyorMap[s.id] || 0 }))
    .sort((a, b) => b.count - a.count)
  const maxPerf = Math.max(...surveyorPerf.map(s => s.count), 1)

  const growthPct = lastMonthSurveys
    ? Math.round(((thisMonthSurveys || 0) - lastMonthSurveys) / lastMonthSurveys * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Performance overview — last 6 months</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{totalSurveys || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Surveys</div>
          <div className={`text-xs mt-2 font-medium ${growthPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct}% vs last month
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{thisMonthSurveys || 0}</div>
          <div className="text-sm text-gray-500 mt-1">This Month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Revenue Collected</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{formatCurrency(pendingRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Pending Payments</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Monthly Survey Requests</h2>
          <div className="flex items-end gap-3 h-40">
            {monthLabels.map(({ key, label }) => {
              const val = monthData[key] || 0
              const height = Math.round((val / maxMonth) * 100)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{val > 0 ? val : ''}</span>
                  <div className="w-full flex items-end h-28">
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Top Destination Countries</h2>
          {topDestinations.length > 0 ? (
            <div className="space-y-3">
              {topDestinations.map(([country, count]) => {
                const total = (allSurveys?.length || 1)
                const pct = Math.round(count / total * 100)
                return (
                  <div key={country}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{country}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>

        {/* Surveyor Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Surveyor Performance</h2>
          {surveyorPerf.length > 0 ? (
            <div className="space-y-3">
              {surveyorPerf.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-gray-500">{s.count} surveys</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.round(s.count / maxPerf * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No completed surveys yet</p>
          )}
        </div>

        {/* Container Type Split */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Container Type Usage</h2>
          {(surveys?.length || 0) > 0 ? (
            <div className="space-y-4">
              {[
                { key: 'lcl', label: 'LCL Groupage', color: 'bg-cyan-500' },
                { key: '20ft', label: '20ft Container', color: 'bg-blue-500' },
                { key: '40ft', label: '40ft Container', color: 'bg-indigo-500' },
              ].map(({ key, label, color }) => {
                const val = containerMap[key] || 0
                const total = surveys?.length || 1
                const pct = Math.round(val / total * 100)
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{label}</span>
                      <span className="text-gray-500">{val} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No completed surveys yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
