import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChatInterface from './ChatInterface'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SurveyChatPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: survey } = await supabase
    .from('survey_requests')
    .select('id, customer_name, customer_email, status, tracking_code')
    .eq('id', id)
    .single()

  if (!survey) notFound()

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('survey_request_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-6 h-full flex flex-col max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href={`/admin/surveys/${id}`} className="text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chat — {survey.customer_name}</h1>
          <p className="text-sm text-gray-500">Survey #{survey.tracking_code} · {survey.customer_email}</p>
        </div>
      </div>
      <ChatInterface
        surveyRequestId={id}
        initialMessages={messages || []}
        senderName={profile?.full_name || 'Admin'}
        senderRole="admin"
        senderId={user.id}
      />
    </div>
  )
}
