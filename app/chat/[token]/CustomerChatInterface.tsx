'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  surveyRequestId: string
  initialMessages: ChatMessage[]
  customerName: string
  customerEmail: string
}

export default function CustomerChatInterface({ surveyRequestId, initialMessages, customerName, customerEmail }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:customer:${surveyRequestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `survey_request_id=eq.${surveyRequestId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new as ChatMessage]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [surveyRequestId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)

    const { data, error } = await supabase.from('chat_messages').insert({
      survey_request_id: surveyRequestId,
      sender_email: customerEmail,
      sender_name: customerName,
      sender_role: 'customer',
      message: text.trim(),
    }).select().single()

    if (!error && data) {
      setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    }
    setText('')
    setSending(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-sm">Hi {customerName}! How can we help you?</p>
          </div>
        )}
        {messages.map(msg => {
          const isCustomer = msg.sender_role === 'customer'
          return (
            <div key={msg.id} className={`flex gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
                ${isCustomer ? 'bg-blue-500' : msg.sender_role === 'admin' ? 'bg-purple-600' : 'bg-green-600'}`}>
                {msg.sender_name.charAt(0)}
              </div>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isCustomer ? 'items-end' : 'items-start'}`}>
                {!isCustomer && (
                  <span className="text-xs text-gray-500">{msg.sender_name} ({msg.sender_role})</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isCustomer ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                }`}>
                  {msg.message}
                </div>
                <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-100 p-4 flex gap-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
