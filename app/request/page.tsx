'use client'

import { useState } from 'react'
import Link from 'next/link'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Office', 'Studio', 'Other']
const COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'United Kingdom', 'Germany', 'France', 'Netherlands', 'USA', 'Canada',
  'Australia', 'India', 'Pakistan', 'Philippines', 'Other'
]

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props
  return (
    <select
      {...rest}
      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
    >
      {children}
    </select>
  )
}

export default function RequestSurveyPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [error, setError] = useState('')
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
    setError('')
    try {
      const res = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agent_code: agentCode }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setTrackingCode(data.tracking_code)
      setSubmitted(true)

      // Trigger notification (non-blocking)
      fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'request_confirmation', email: form.customer_email, name: form.customer_name, trackingCode: data.tracking_code }),
      }).catch(() => {})

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Survey Requested</h1>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Thank you, <strong className="text-slate-700">{form.customer_name}</strong>. We&apos;ve received your request
            and our team will contact you within 24 hours.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Tracking Code</p>
            <p className="text-3xl font-bold text-blue-700 tracking-[0.3em]">{trackingCode}</p>
            <p className="text-xs text-blue-500 mt-2">Use this code to track your survey status</p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/track?code=${trackingCode}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Track My Survey
            </Link>
            <Link
              href="/"
              className="block w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Back to Home
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">Confirmation email sent to {form.customer_email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900 text-sm">Request a Survey</h1>
            <p className="text-xs text-slate-400">Step {step} of 3</p>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s < step ? 'w-6 bg-blue-600' :
                  s === step ? 'w-8 bg-blue-600' :
                  'w-6 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
              <p className="text-slate-500 text-sm mt-1">Tell us who you are</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div>
                <Label required>Full Name</Label>
                <Input
                  type="text"
                  value={form.customer_name}
                  onChange={e => update('customer_name', e.target.value)}
                  placeholder="John Smith"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  value={form.customer_email}
                  onChange={e => update('customer_email', e.target.value)}
                  placeholder="john@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={form.customer_phone}
                    onChange={e => update('customer_phone', e.target.value)}
                    placeholder="+971 50 000 0000"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    type="tel"
                    value={form.customer_whatsapp}
                    onChange={e => update('customer_whatsapp', e.target.value)}
                    placeholder="+971 50 000 0000"
                  />
                </div>
              </div>
              <div>
                <Label>Agent Referral Code <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  type="text"
                  value={agentCode}
                  onChange={e => setAgentCode(e.target.value.toUpperCase())}
                  placeholder="AGT001"
                  className="uppercase"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.customer_name.trim() || !form.customer_email.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Move Details</h2>
              <p className="text-slate-500 text-sm mt-1">Tell us about your move</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div>
                <Label required>Property Type</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update('property_type', type.toLowerCase())}
                      className={`py-2.5 px-3 rounded-lg text-sm border-2 font-medium transition-all ${
                        form.property_type === type.toLowerCase()
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label required>Pickup Address</Label>
                <textarea
                  value={form.pickup_address}
                  onChange={e => update('pickup_address', e.target.value)}
                  placeholder="Building name, street, area"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From City</Label>
                  <Input
                    type="text"
                    value={form.pickup_city}
                    onChange={e => update('pickup_city', e.target.value)}
                    placeholder="Dubai"
                  />
                </div>
                <div>
                  <Label>From Country</Label>
                  <Select value={form.pickup_country} onChange={e => update('pickup_country', e.target.value)}>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Destination Country</Label>
                  <Select value={form.destination_country} onChange={e => update('destination_country', e.target.value)}>
                    <option value="">Select country...</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Destination City</Label>
                  <Input
                    type="text"
                    value={form.destination_city}
                    onChange={e => update('destination_city', e.target.value)}
                    placeholder="London"
                  />
                </div>
              </div>

              <div>
                <Label>Preferred Survey Date</Label>
                <Input
                  type="date"
                  value={form.preferred_date}
                  onChange={e => update('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3.5 rounded-xl transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.pickup_address.trim() || !form.destination_country}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Review & Submit</h2>
              <p className="text-slate-500 text-sm mt-1">Confirm your details before submitting</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Your Information</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Name', value: form.customer_name },
                  { label: 'Email', value: form.customer_email },
                  { label: 'Phone', value: form.customer_phone || '—' },
                  { label: 'Property', value: form.property_type ? form.property_type.charAt(0).toUpperCase() + form.property_type.slice(1) : '—' },
                  { label: 'From', value: [form.pickup_city, form.pickup_country].filter(Boolean).join(', ') },
                  { label: 'To', value: [form.destination_city, form.destination_country].filter(Boolean).join(', ') },
                  ...(form.preferred_date ? [{ label: 'Preferred Date', value: new Date(form.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-6 py-3">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className="text-sm font-medium text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <Label>Additional Notes</Label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Any special requirements, fragile items, access issues..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700 leading-relaxed">
                <strong>What happens next?</strong> We&apos;ll contact you within 24 hours to confirm your survey date.
                You&apos;ll receive a tracking code to monitor your survey in real time.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3.5 rounded-xl transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
