import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChatInterface from '@/app/admin/surveys/[id]/chat/ChatInterface'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SurveyorChatPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) notFound()

  const admin = await createAdminClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', session.user.id).single()
  const { data: survey } = await admin
    .from('survey_requests')
    .select('id, customer_name, customer_email, status, tracking_code')
    .eq('id', id)
    .single()

  if (!survey) notFound()

  const { data: messages } = await admin
    .from('chat_messages')
    .select('*')
    .eq('survey_request_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/surveyor/survey/${id}`} className="text-gray-400">← Back</Link>
        <div>
          <h1 className="font-bold text-gray-900">{survey.customer_name}</h1>
          <p className="text-xs text-gray-500">Survey #{survey.tracking_code}</p>
        </div>
      </div>
      <ChatInterface
        surveyRequestId={id}
        initialMessages={messages || []}
        senderName={profile?.full_name || 'Surveyor'}
        senderRole="surveyor"
        senderId={session.user.id}
      />
    </div>
  )
}
