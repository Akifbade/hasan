'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatVolume, CONTAINER_VOLUMES } from '@/lib/utils'

interface Props {
  surveyId: string
  totalVolume: number
  existingSurvey?: any
}

const CONTAINER_OPTIONS = [
  { type: 'lcl', label: 'LCL Groupage', capacity: null, desc: 'Pay per CBM - best for small moves' },
  { type: '20ft', label: "20ft Container", capacity: 33.2, desc: '33.2 m³ capacity' },
  { type: '40ft', label: "40ft Container", capacity: 67.7, desc: '67.7 m³ capacity' },
] as const

export default function ContainerSelectForm({ surveyId, totalVolume, existingSurvey }: Props) {
  const [container, setContainer] = useState(existingSurvey?.container_type || '')
  const [originPort, setOriginPort] = useState(existingSurvey?.origin_port || '')
  const [destPort, setDestPort] = useState(existingSurvey?.destination_port || '')
  const [price, setPrice] = useState(existingSurvey?.quoted_price?.toString() || '')
  const [currency, setCurrency] = useState(existingSurvey?.currency || 'USD')
  const [notes, setNotes] = useState(existingSurvey?.special_notes || '')
  const [depDate, setDepDate] = useState(existingSurvey?.estimated_departure || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!container) return
    setLoading(true)

    const supabase = createClient()
    const fillPercent = container === 'lcl' ? 100
      : Math.min((totalVolume / CONTAINER_VOLUMES[container as '20ft' | '40ft']!) * 100, 100)

    const payload = {
      survey_request_id: surveyId,
      total_volume_m3: totalVolume,
      container_type: container,
      fill_percentage: fillPercent,
      origin_port: originPort,
      destination_port: destPort,
      quoted_price: price ? parseFloat(price) : null,
      currency,
      special_notes: notes,
      estimated_departure: depDate || null,
    }

    if (existingSurvey) {
      await supabase.from('surveys').update(payload).eq('id', existingSurvey.id)
    } else {
      await supabase.from('surveys').insert(payload)
    }

    await supabase.from('survey_requests').update({ status: 'quoted' }).eq('id', surveyId)

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {CONTAINER_OPTIONS.map(opt => {
          const fits = !opt.capacity || totalVolume <= opt.capacity
          return (
            <button
              key={opt.type}
              onClick={() => fits && setContainer(opt.type)}
              disabled={!fits}
              className={`p-2 rounded-xl border-2 text-xs transition-colors text-left ${
                container === opt.type
                  ? 'border-blue-500 bg-blue-50'
                  : fits
                  ? 'border-gray-200 hover:border-blue-200'
                  : 'border-red-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className="text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Origin Port</label>
          <input
            value={originPort}
            onChange={e => setOriginPort(e.target.value)}
            placeholder="Jebel Ali"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Destination Port</label>
          <input
            value={destPort}
            onChange={e => setDestPort(e.target.value)}
            placeholder="Felixstowe"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quoted Price</label>
          <div className="flex gap-1">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none w-16"
            >
              <option>USD</option>
              <option>AED</option>
              <option>GBP</option>
              <option>EUR</option>
            </select>
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              type="number"
              placeholder="0.00"
              className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Est. Departure</label>
          <input
            type="date"
            value={depDate}
            onChange={e => setDepDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Special instructions..."
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!container || loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : existingSurvey ? 'Update Quote' : 'Save Quote'}
      </button>
    </div>
  )
}
