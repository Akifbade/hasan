'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatVolume, cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  survey: any
  assignment: any
  initialRooms: any[]
  categories: any[]
  surveyorId: string
}

const ROOM_PRESETS = ['Living Room', 'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Kitchen', 'Dining Room', 'Bathroom', 'Study/Office', 'Storage', 'Balcony', 'Garage']
const CONDITIONS = [
  { value: 'good', label: 'Good', color: 'text-green-600' },
  { value: 'fragile', label: 'Fragile', color: 'text-yellow-600' },
  { value: 'damaged', label: 'Damaged', color: 'text-red-600' },
]

export default function SurveyorSurveyClient({ survey, assignment, initialRooms, categories, surveyorId }: Props) {
  const [rooms, setRooms] = useState<any[]>(initialRooms)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id || null)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showItemLib, setShowItemLib] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', length_cm: '', width_cm: '', height_cm: '', quantity: '1', condition: 'good', notes: '' })
  const [saving, setSaving] = useState(false)
  const [started, setStarted] = useState(assignment.status === 'in_progress')
  const router = useRouter()

  const activeRoom = rooms.find(r => r.id === activeRoomId)
  const totalVolume = rooms.reduce((total, room) => {
    return total + (room.items || []).reduce((t: number, item: any) => {
      return t + (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
    }, 0)
  }, 0)

  async function startSurvey() {
    const supabase = createClient()
    await supabase.from('survey_assignments').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', assignment.id)
    await supabase.from('survey_requests').update({ status: 'in_progress' }).eq('id', survey.id)
    setStarted(true)
  }

  async function addRoom(name: string) {
    const supabase = createClient()
    const { data } = await supabase.from('rooms').insert({
      survey_request_id: survey.id,
      name,
      order_index: rooms.length,
    }).select().single()
    if (data) {
      setRooms([...rooms, { ...data, items: [] }])
      setActiveRoomId(data.id)
    }
    setShowAddRoom(false)
    setNewRoomName('')
  }

  async function addItem(fromLibrary?: any) {
    if (!activeRoomId) return
    setSaving(true)
    const supabase = createClient()

    const itemData = fromLibrary ? {
      room_id: activeRoomId,
      library_item_id: fromLibrary.id,
      name: fromLibrary.name,
      length_cm: fromLibrary.default_length_cm,
      width_cm: fromLibrary.default_width_cm,
      height_cm: fromLibrary.default_height_cm,
      quantity: 1,
      condition: 'good',
      is_manual: false,
    } : {
      room_id: activeRoomId,
      name: newItem.name,
      length_cm: parseFloat(newItem.length_cm) || 0,
      width_cm: parseFloat(newItem.width_cm) || 0,
      height_cm: parseFloat(newItem.height_cm) || 0,
      quantity: parseInt(newItem.quantity) || 1,
      condition: newItem.condition,
      notes: newItem.notes,
      is_manual: true,
    }

    const { data } = await supabase.from('items').insert(itemData).select().single()
    if (data) {
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, items: [...(r.items || []), data] } : r))
      setNewItem({ name: '', length_cm: '', width_cm: '', height_cm: '', quantity: '1', condition: 'good', notes: '' })
      setShowAddItem(false)
      setShowItemLib(false)
    }
    setSaving(false)
  }

  async function deleteItem(roomId: string, itemId: string) {
    const supabase = createClient()
    await supabase.from('items').delete().eq('id', itemId)
    setRooms(rooms.map(r => r.id === roomId ? { ...r, items: r.items.filter((i: any) => i.id !== itemId) } : r))
  }

  async function completeSurvey() {
    if (!confirm('Mark this survey as complete?')) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('survey_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignment.id)
    await supabase.from('survey_requests').update({ status: 'completed' }).eq('id', survey.id)
    router.push('/surveyor')
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-gray-900">{survey.customer_name}</h1>
            <p className="text-sm text-gray-500">{survey.pickup_address}</p>
            <p className="text-xs text-blue-600 font-mono mt-1">#{survey.tracking_code}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{formatVolume(totalVolume)}</div>
            <div className="text-xs text-gray-400">Total Volume</div>
          </div>
        </div>

        {!started && (
          <button
            onClick={startSurvey}
            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Start Survey
          </button>
        )}
      </div>

      {/* Rooms Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => setActiveRoomId(room.id)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
              activeRoomId === room.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            )}
          >
            {room.name}
            {room.items?.length > 0 && (
              <span className={cn('ml-1 text-xs', activeRoomId === room.id ? 'text-blue-200' : 'text-gray-400')}>
                ({room.items.length})
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowAddRoom(true)}
          className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap bg-white text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50 transition-colors"
        >
          + Room
        </button>
      </div>

      {/* Active Room Items */}
      {activeRoom && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">{activeRoom.name}</span>
              <span className="text-xs text-gray-400 ml-2">
                {formatVolume((activeRoom.items || []).reduce((t: number, i: any) =>
                  t + (i.length_cm * i.width_cm * i.height_cm * i.quantity) / 1000000, 0))}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowItemLib(true)}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100"
              >
                + From List
              </button>
              <button
                onClick={() => setShowAddItem(true)}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200"
              >
                + Manual
              </button>
            </div>
          </div>

          {activeRoom.items && activeRoom.items.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {activeRoom.items.map((item: any) => {
                const vol = (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
                return (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.length_cm}×{item.width_cm}×{item.height_cm} cm · qty {item.quantity} ·
                        <span className={cn('ml-1', item.condition === 'good' ? 'text-green-600' : item.condition === 'fragile' ? 'text-yellow-600' : 'text-red-600')}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-semibold text-blue-600">{formatVolume(vol)}</div>
                      <button
                        onClick={() => deleteItem(activeRoom.id, item.id)}
                        className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              No items yet. Add items using the buttons above.
            </div>
          )}
        </div>
      )}

      {/* Complete button */}
      {started && totalVolume > 0 && (
        <button
          onClick={completeSurvey}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-60 text-lg"
        >
          Complete Survey ✓
        </button>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Add Room</h3>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => addRoom(preset)}
                  className="py-2 px-2 border border-gray-200 rounded-xl text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="Custom room name"
                onKeyDown={e => e.key === 'Enter' && newRoomName && addRoom(newRoomName)}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => newRoomName && addRoom(newRoomName)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Add
              </button>
            </div>
            <button onClick={() => setShowAddRoom(false)} className="w-full text-sm text-gray-500 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Item Library Modal */}
      {showItemLib && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Select Item</h3>
              <p className="text-xs text-gray-500 mt-0.5">Adding to: {activeRoom?.name}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {categories.map((cat: any) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.item_library?.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="text-left border border-gray-200 rounded-xl p-2.5 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.default_length_cm}×{item.default_width_cm}×{item.default_height_cm}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowItemLib(false)} className="w-full text-sm text-gray-500 py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Add Item Manually</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Item Name *</label>
              <input
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Sofa, Wardrobe..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['length_cm', 'width_cm', 'height_cm'].map(field => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {field === 'length_cm' ? 'Length' : field === 'width_cm' ? 'Width' : 'Height'} (cm)
                  </label>
                  <input
                    type="number"
                    value={newItem[field as keyof typeof newItem]}
                    onChange={e => setNewItem({ ...newItem, [field]: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                  min="1"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Condition</label>
                <select
                  value={newItem.condition}
                  onChange={e => setNewItem({ ...newItem, condition: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            {newItem.length_cm && newItem.width_cm && newItem.height_cm && (
              <div className="bg-blue-50 rounded-xl px-3 py-2 text-sm text-blue-700 font-medium">
                Volume: {formatVolume((parseFloat(newItem.length_cm) * parseFloat(newItem.width_cm) * parseFloat(newItem.height_cm) * parseInt(newItem.quantity)) / 1000000)}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowAddItem(false)} className="flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button
                onClick={() => addItem()}
                disabled={!newItem.name || saving}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
