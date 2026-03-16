'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SurveyRequest } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS, formatDate } from '@/lib/utils'

const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'completed']

function TrackingContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('code') || searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [survey, setSurvey] = useState<SurveyRequest | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery)
  }, []) // eslint-disable-line

  async function handleSearch(q?: string) {
    const searchQuery = q || query
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    setSurvey(null)

    const supabase = createClient()
    const trimmed = searchQuery.trim()

    // Try tracking code (8 chars alphanumeric)
    let result = null
    if (trimmed.length === 8 && /^[A-Za-z0-9]+$/.test(trimmed)) {
      const { data } = await supabase
        .from('survey_requests')
        .select('*, survey_assignments(*, profiles(full_name, phone))')
        .eq('tracking_code', trimmed.toUpperCase())
        .single()
      result = data
    }

    // Try email
    if (!result && trimmed.includes('@')) {
      const { data } = await supabase
        .from('survey_requests')
        .select('*, survey_assignments(*, profiles(full_name, phone))')
        .eq('customer_email', trimmed.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      result = data
    }

    // Try phone
    if (!result) {
      const { data } = await supabase
        .from('survey_requests')
        .select('*, survey_assignments(*, profiles(full_name, phone))')
        .eq('customer_phone', trimmed)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      result = data
    }

    if (result) {
      setSurvey(result)
    } else {
      setError('No survey found. Please check your tracking code or email.')
    }
    setLoading(false)
  }

  const currentStepIndex = survey ? STATUS_STEPS.indexOf(survey.status) : -1
  const assignment = survey?.survey_assignments?.[0] as any

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">QGO Relocation</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Survey</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your tracking code, email, or phone number</p>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Tracking code, email, or phone"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? '...' : 'Track'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {survey && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Survey Request</p>
                  <p className="text-xl font-bold text-gray-900">{survey.tracking_code}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[survey.status]}`}>
                  {STATUS_LABELS[survey.status]}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-1 mb-6">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-full h-1.5 rounded-full ${i <= currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    {i === STATUS_STEPS.length - 1 && (
                      <div className={`w-3 h-3 rounded-full ml-1 ${currentStepIndex >= i ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Requested</span>
                <span>Assigned</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-semibold text-gray-900">Survey Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{survey.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Requested On</p>
                  <p className="font-medium">{formatDate(survey.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">{survey.pickup_city || ''} {survey.pickup_country}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{survey.destination_city || ''} {survey.destination_country || '-'}</p>
                </div>
                {survey.preferred_date && (
                  <div>
                    <p className="text-gray-500">Preferred Date</p>
                    <p className="font-medium">{formatDate(survey.preferred_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Surveyor Info */}
            {assignment && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Assigned Surveyor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {assignment.profiles?.full_name?.[0] || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{assignment.profiles?.full_name}</p>
                    {assignment.scheduled_date && (
                      <p className="text-sm text-gray-500">
                        Scheduled: {formatDate(assignment.scheduled_date)}
                      </p>
                    )}
                  </div>
                </div>
                {survey.status === 'in_progress' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Surveyor is currently at your location
                  </div>
                )}
              </div>
            )}

            {/* Chat link */}
            <Link
              href={`/chat/${survey.tracking_token}`}
              className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Chat with us</p>
                    <p className="text-xs text-gray-500">Send a message about your survey</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}

        {!survey && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500">Enter your tracking details above to see your survey status</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>}>
      <TrackingContent />
    </Suspense>
  )
}
