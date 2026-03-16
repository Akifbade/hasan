'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  surveyRequestId: string
  initialMessages: ChatMessage[]
  senderName: string
  senderRole: 'admin' | 'surveyor' | 'customer'
  senderId?: string
  senderEmail?: string
}

export default function ChatInterface({
  surveyRequestId,
  initialMessages,
  senderName,
  senderRole,
  senderId,
  senderEmail,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${surveyRequestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `survey_request_id=eq.${surveyRequestId}`,
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates
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

    const newMsg = {
      survey_request_id: surveyRequestId,
      sender_id: senderId || null,
      sender_email: senderEmail || null,
      sender_name: senderName,
      sender_role: senderRole,
      message: text.trim(),
    }

    const { data, error } = await supabase.from('chat_messages').insert(newMsg).select().single()
    if (!error && data) {
      // Optimistically add (realtime might also add it, dedup handles it)
      setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    }
    setText('')
    setSending(false)
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-blue-600',
    surveyor: 'bg-purple-600',
    customer: 'bg-green-600',
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === senderId || msg.sender_email === senderEmail
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${roleColors[msg.sender_role] || 'bg-gray-400'}`}>
                {msg.sender_name.charAt(0)}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">{msg.sender_name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColors[msg.sender_role]} text-white`}>
                    {msg.sender_role}
                  </span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
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

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-100 p-4 flex gap-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
