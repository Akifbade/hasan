'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Office', 'Studio', 'Other']
const COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'United Kingdom', 'Germany', 'France', 'Netherlands', 'USA', 'Canada',
  'Australia', 'India', 'Pakistan', 'Philippines', 'Other'
]

export default function RequestSurveyPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [agentCode, setAgentCode] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_whatsapp: '',
    pickup_address: '',
    pickup_city: '',
    pickup_country: 'UAE',
    destination_country: '',
    destination_city: '',
    preferred_date: '',
    property_type: '',
    notes: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Check agent referral
      let agentId = null
      if (agentCode) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('referral_code', agentCode.toUpperCase())
          .single()
        agentId = agent?.id || null
      }

      const { data, error } = await supabase
        .from('survey_requests')
        .insert({
          ...form,
          preferred_date: form.preferred_date || null,
          agent_id: agentId,
        })
        .select('tracking_code')
        .single()

      if (error) throw error

      setTrackingCode(data.tracking_code)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Requested!</h1>
          <p className="text-gray-500 mb-6">
            Thank you, <strong>{form.customer_name}</strong>! We&apos;ve received your survey request.
            Our team will contact you within 24 hours.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-600 font-medium mb-1">Your Tracking Code</p>
            <p className="text-3xl font-bold text-blue-700 tracking-widest">{trackingCode}</p>
            <p className="text-xs text-blue-500 mt-2">Use this code to track your survey status</p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/track?code=${trackingCode}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Track My Survey
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            A confirmation email has been sent to {form.customer_email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Request a Survey</h1>
            <p className="text-xs text-gray-500">Step {step} of 3</p>
          </div>
          <div className="ml-auto flex gap-1">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-500 text-sm mt-1">Tell us about yourself</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => update('customer_name', e.target.value)}
                  placeholder="John Smith"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => update('customer_email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.customer_phone}
                    onChange={e => update('customer_phone', e.target.value)}
                    placeholder="+971 50 XXX XXXX"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.customer_whatsapp}
                    onChange={e => update('customer_whatsapp', e.target.value)}
                    placeholder="+971 50 XXX XXXX"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Referral Code (optional)</label>
                <input
                  type="text"
                  value={agentCode}
                  onChange={e => setAgentCode(e.target.value)}
                  placeholder="e.g. AGT001"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.customer_name || !form.customer_email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Move Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Move Details</h2>
              <p className="text-gray-500 text-sm mt-1">Tell us about your move</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => update('property_type', type.toLowerCase())}
                      className={`py-2 px-3 rounded-xl text-sm border-2 transition-colors ${
                        form.property_type === type.toLowerCase()
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address *</label>
                <textarea
                  value={form.pickup_address}
                  onChange={e => update('pickup_address', e.target.value)}
                  placeholder="Building, Street, Area"
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From City</label>
                  <input
                    type="text"
                    value={form.pickup_city}
                    onChange={e => update('pickup_city', e.target.value)}
                    placeholder="Dubai"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Country</label>
                  <select
                    value={form.pickup_country}
                    onChange={e => update('pickup_country', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country *</label>
                  <select
                    value={form.destination_country}
                    onChange={e => update('destination_country', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    value={form.destination_city}
                    onChange={e => update('destination_city', e.target.value)}
                    placeholder="London"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Survey Date</label>
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={e => update('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.pickup_address || !form.destination_country}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
              <p className="text-gray-500 text-sm mt-1">Confirm your details and add any notes</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{form.customer_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{form.customer_email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">From</span>
                <span className="font-medium">{form.pickup_city}, {form.pickup_country}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">To</span>
                <span className="font-medium">{form.destination_city ? `${form.destination_city}, ` : ''}{form.destination_country}</span>
              </div>
              {form.preferred_date && (
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">Preferred Date</span>
                  <span className="font-medium">{form.preferred_date}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Any special requirements, fragile items, access issues..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <strong>What happens next?</strong> We&apos;ll contact you within 24 hours to confirm the survey date.
              You&apos;ll receive a tracking code via email to monitor your survey status.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Request ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
