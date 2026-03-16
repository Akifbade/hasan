'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  surveyId: string
  currentSurveyorId?: string
  surveyors: { id: string; full_name: string; is_available: boolean }[]
}

export default function AssignSurveyorForm({ surveyId, currentSurveyorId, surveyors }: Props) {
  const [surveyorId, setSurveyorId] = useState(currentSurveyorId || '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAssign() {
    if (!surveyorId) return
    setLoading(true)

    const supabase = createClient()

    // Cancel existing assignments
    await supabase
      .from('survey_assignments')
      .update({ status: 'cancelled' })
      .eq('survey_request_id', surveyId)
      .neq('status', 'completed')

    // Create new assignment
    await supabase.from('survey_assignments').insert({
      survey_request_id: surveyId,
      surveyor_id: surveyorId,
      scheduled_date: scheduledDate || null,
      status: 'assigned',
    })

    // Update survey status
    await supabase
      .from('survey_requests')
      .update({ status: 'assigned' })
      .eq('id', surveyId)

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Select Surveyor</label>
        <select
          value={surveyorId}
          onChange={e => setSurveyorId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose surveyor...</option>
          {surveyors.map(s => (
            <option key={s.id} value={s.id}>
              {s.full_name} {s.is_available ? '✓' : '(Busy)'}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Schedule Date & Time</label>
        <input
          type="datetime-local"
          value={scheduledDate}
          onChange={e => setScheduledDate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={handleAssign}
        disabled={!surveyorId || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Assigning...' : currentSurveyorId ? 'Reassign' : 'Assign Surveyor'}
      </button>
    </div>
  )
}
