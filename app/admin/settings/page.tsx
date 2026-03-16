'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PricingRoute {
  id: string
  origin_country: string
  destination_country: string
  lcl_rate_per_m3: number | null
  container_20ft_price: number | null
  container_40ft_price: number | null
  currency: string
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'pricing' | 'notifications' | 'items'>('pricing')
  const [routes, setRoutes] = useState<PricingRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/pricing-routes').then(r => r.json()).then(data => {
      setRoutes(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  async function saveRoute(route: Partial<PricingRoute> & { id?: string }) {
    setSaving(true)
    setMsg('')
    const method = route.id ? 'PUT' : 'POST'
    await fetch('/api/admin/pricing-routes', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(route),
    })
    const data = await fetch('/api/admin/pricing-routes').then(r => r.json())
    setRoutes(Array.isArray(data) ? data : [])
    setSaving(false)
    setMsg('Saved!')
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteRoute(id: string) {
    await fetch('/api/admin/pricing-routes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setRoutes(routes.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your QGO Relocation system</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'pricing', label: 'Pricing Routes' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'items', label: 'Items Library' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pricing' && (
        <PricingTab routes={routes} loading={loading} saving={saving} msg={msg} onSave={saveRoute} onDelete={deleteRoute} />
      )}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'items' && <ItemsLibraryTab />}
    </div>
  )
}

function PricingTab({ routes, loading, saving, msg, onSave, onDelete }: {
  routes: PricingRoute[]
  loading: boolean
  saving: boolean
  msg: string
  onSave: (r: any) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    origin_country: '',
    destination_country: '',
    lcl_rate_per_m3: 50,
    container_20ft_price: 2000,
    container_40ft_price: 3500,
    currency: 'USD',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
    setShowForm(false)
    setForm({ origin_country: '', destination_country: '', lcl_rate_per_m3: 50, container_20ft_price: 2000, container_40ft_price: 3500, currency: 'USD' })
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Define shipping rates for different routes.</p>
        <div className="flex items-center gap-3">
          {msg && <span className="text-green-600 text-sm font-medium">{msg}</span>}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Route
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">New Pricing Route</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origin Country</label>
              <input
                required
                value={form.origin_country}
                onChange={e => setForm({ ...form, origin_country: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="UAE"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination Country</label>
              <input
                required
                value={form.destination_country}
                onChange={e => setForm({ ...form, destination_country: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="UK"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">LCL Rate per m³</label>
              <input
                type="number"
                required
                min={1}
                value={form.lcl_rate_per_m3}
                onChange={e => setForm({ ...form, lcl_rate_per_m3: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">20ft Container Price</label>
              <input
                type="number"
                min={0}
                value={form.container_20ft_price}
                onChange={e => setForm({ ...form, container_20ft_price: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">40ft Container Price</label>
              <input
                type="number"
                min={0}
                value={form.container_40ft_price}
                onChange={e => setForm({ ...form, container_40ft_price: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>USD</option>
                <option>AED</option>
                <option>GBP</option>
                <option>EUR</option>
                <option>SAR</option>
                <option>KWD</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-sm py-2 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Route'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
              <th className="px-6 py-3">Route</th>
              <th className="px-6 py-3">LCL / m³</th>
              <th className="px-6 py-3">20ft</th>
              <th className="px-6 py-3">40ft</th>
              <th className="px-6 py-3">Currency</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {routes.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {r.origin_country} → {r.destination_country}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.lcl_rate_per_m3 ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.container_20ft_price ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.container_40ft_price ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.currency}</td>
                <td className="px-6 py-4">
                  <button onClick={() => onDelete(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No pricing routes configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Email Notifications (Resend)</h3>
        <p className="text-sm text-gray-500 mb-4">Configure your RESEND_API_KEY in Supabase Edge Function secrets to enable email notifications.</p>
        <div className="space-y-3">
          {[
            { label: 'Survey request received', desc: 'Sent to customer after they submit a request' },
            { label: 'Surveyor assigned', desc: 'Sent to customer when admin assigns a surveyor' },
            { label: 'Survey completed', desc: 'Sent to customer with PDF report attached' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-900">{n.label}</div>
                <div className="text-xs text-gray-500">{n.desc}</div>
              </div>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Enabled</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">WhatsApp Notifications (Twilio)</h3>
        <p className="text-sm text-gray-500 mb-4">Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in Supabase Edge Function secrets.</p>
        <div className="space-y-3">
          {[
            { label: 'Surveyor assigned via WhatsApp', desc: 'Sent to customer WhatsApp number' },
            { label: 'Surveyor en route', desc: 'When GPS tracking starts moving' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-900">{n.label}</div>
                <div className="text-xs text-gray-500">{n.desc}</div>
              </div>
              <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">Needs Config</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemsLibraryTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('item_categories').select('*').order('order_index').then(({ data }) => {
      setCategories(data || [])
      if (data?.[0]) {
        setSelectedCat(data[0].id)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedCat) return
    supabase.from('item_library').select('*').eq('category_id', selectedCat).order('name').then(({ data }) => {
      setItems(data || [])
    })
  }, [selectedCat])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="flex gap-4 h-[500px]">
      {/* Categories */}
      <div className="w-48 bg-white rounded-2xl shadow-sm overflow-y-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-50 transition-colors
              ${selectedCat === cat.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="mr-2">{cat.icon}</span>{cat.name}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900 text-sm">
            {categories.find(c => c.id === selectedCat)?.name} Items
          </h3>
          <span className="text-xs text-gray-400">{items.length} items</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase text-left">
              <th className="px-5 py-2">Item</th>
              <th className="px-5 py-2">L × W × H (cm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50 text-sm">
                <td className="px-5 py-2.5 font-medium text-gray-900">
                  {item.icon && <span className="mr-2">{item.icon}</span>}{item.name}
                </td>
                <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">
                  {item.default_length_cm} × {item.default_width_cm} × {item.default_height_cm}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
