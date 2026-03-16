import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatVolume, CONTAINER_VOLUMES } from '@/lib/utils'
import AssignSurveyorForm from '@/components/admin/AssignSurveyorForm'
import ContainerSelectForm from '@/components/admin/ContainerSelectForm'
import SurveyLiveMap from '@/components/map/SurveyLiveMap'

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: survey } = await supabase
    .from('survey_requests')
    .select(`
      *,
      survey_assignments(*, profiles(full_name, phone)),
      rooms(*, items(*))
    `)
    .eq('id', id)
    .single()

  if (!survey) notFound()

  const { data: surveyors } = await supabase
    .from('profiles')
    .select('id, full_name, phone, is_available')
    .eq('role', 'surveyor')
    .eq('is_available', true)

  const { data: finalSurvey } = await supabase
    .from('surveys')
    .select('*')
    .eq('survey_request_id', id)
    .single()

  // Calculate total volume
  const totalVolume = (survey.rooms || []).reduce((total: number, room: any) => {
    return total + (room.items || []).reduce((roomTotal: number, item: any) => {
      const vol = (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
      return roomTotal + vol
    }, 0)
  }, 0)

  const assignment = survey.survey_assignments?.[0] as any

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/surveys" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{survey.customer_name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[survey.status]}`}>
              {STATUS_LABELS[survey.status]}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            #{survey.tracking_code} · Requested {formatDate(survey.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {finalSurvey?.pdf_url && (
            <a
              href={finalSurvey.pdf_url}
              target="_blank"
              className="bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              📄 Download PDF
            </a>
          )}
          <Link
            href={`/admin/surveys/${id}/pdf`}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Generate PDF
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{survey.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{survey.customer_email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{survey.customer_phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">WhatsApp</p>
                <p className="font-medium">{survey.customer_whatsapp || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">From</p>
                <p className="font-medium">{survey.pickup_address}</p>
                <p className="text-gray-400 text-xs">{survey.pickup_city}, {survey.pickup_country}</p>
              </div>
              <div>
                <p className="text-gray-500">To</p>
                <p className="font-medium">{survey.destination_city || '-'}</p>
                <p className="text-gray-400 text-xs">{survey.destination_country || '-'}</p>
              </div>
              {survey.preferred_date && (
                <div>
                  <p className="text-gray-500">Preferred Date</p>
                  <p className="font-medium">{formatDate(survey.preferred_date)}</p>
                </div>
              )}
              {survey.property_type && (
                <div>
                  <p className="text-gray-500">Property Type</p>
                  <p className="font-medium capitalize">{survey.property_type}</p>
                </div>
              )}
            </div>
            {survey.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Notes</p>
                <p className="text-sm">{survey.notes}</p>
              </div>
            )}
          </div>

          {/* Rooms & Items */}
          {survey.rooms && survey.rooms.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Inventory</h3>
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  Total: {formatVolume(totalVolume)}
                </div>
              </div>
              <div className="space-y-4">
                {survey.rooms.map((room: any) => {
                  const roomVolume = (room.items || []).reduce((t: number, item: any) => {
                    return t + (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
                  }, 0)
                  return (
                    <div key={room.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{room.name}</span>
                        <span className="text-xs text-gray-500">{formatVolume(roomVolume)}</span>
                      </div>
                      {room.items && room.items.length > 0 && (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-500">
                              <th className="text-left px-4 py-2">Item</th>
                              <th className="px-4 py-2">Qty</th>
                              <th className="px-4 py-2">Dimensions (cm)</th>
                              <th className="px-4 py-2">Volume</th>
                              <th className="px-4 py-2">Condition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {room.items.map((item: any) => {
                              const vol = (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
                              return (
                                <tr key={item.id} className="border-b border-gray-50">
                                  <td className="px-4 py-2 font-medium">{item.name}</td>
                                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                                  <td className="px-4 py-2 text-center text-gray-500">
                                    {item.length_cm}×{item.width_cm}×{item.height_cm}
                                  </td>
                                  <td className="px-4 py-2 text-center">{formatVolume(vol)}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className={`capitalize text-xs font-medium ${
                                      item.condition === 'good' ? 'text-green-600' :
                                      item.condition === 'fragile' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>{item.condition}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live Map */}
          {assignment && survey.status === 'in_progress' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Live Surveyor Location</h3>
              <SurveyLiveMap surveyorId={assignment.surveyor_id} surveyRequestId={id} />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Assign Surveyor */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              {assignment ? 'Reassign Surveyor' : 'Assign Surveyor'}
            </h3>
            {assignment && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{assignment.profiles?.full_name?.[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignment.profiles?.full_name}</p>
                  <p className="text-xs text-blue-600 capitalize">{assignment.status}</p>
                </div>
              </div>
            )}
            <AssignSurveyorForm
              surveyId={id}
              currentSurveyorId={assignment?.surveyor_id}
              surveyors={surveyors || []}
            />
          </div>

          {/* Container Selection */}
          {totalVolume > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Container Selection</h3>
              <p className="text-sm text-gray-500 mb-4">Total volume: <strong className="text-blue-600">{formatVolume(totalVolume)}</strong></p>

              {/* Volume comparison */}
              <div className="space-y-2 mb-4">
                {[
                  { type: 'lcl' as const, label: 'LCL Groupage', capacity: totalVolume, desc: 'Pay per CBM' },
                  { type: '20ft' as const, label: "20ft Container", capacity: 33.2, desc: '33.2 m³' },
                  { type: '40ft' as const, label: "40ft Container", capacity: 67.7, desc: '67.7 m³' },
                ].map(opt => {
                  const fill = opt.type === 'lcl' ? 100 : Math.min((totalVolume / opt.capacity) * 100, 100)
                  const fits = opt.type === 'lcl' || totalVolume <= opt.capacity
                  return (
                    <div key={opt.type} className={`border rounded-xl p-3 text-sm ${fits ? 'border-gray-200' : 'border-red-200 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-gray-500 text-xs">{opt.desc}</span>
                      </div>
                      {opt.type !== 'lcl' && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${fill > 90 ? 'bg-red-400' : fill > 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                            style={{ width: `${fill}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <ContainerSelectForm surveyId={id} totalVolume={totalVolume} existingSurvey={finalSurvey} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <a
              href={`mailto:${survey.customer_email}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 py-2 hover:bg-blue-50 px-3 rounded-lg transition-colors"
            >
              📧 Email Customer
            </a>
            {survey.customer_whatsapp && (
              <a
                href={`https://wa.me/${survey.customer_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 py-2 hover:bg-green-50 px-3 rounded-lg transition-colors"
              >
                💬 WhatsApp Customer
              </a>
            )}
            <Link
              href={`/track?code=${survey.tracking_code}`}
              target="_blank"
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 py-2 hover:bg-blue-50 px-3 rounded-lg transition-colors"
            >
              🔗 View Tracking Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
