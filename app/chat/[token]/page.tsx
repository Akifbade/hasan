import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CustomerChatInterface from './CustomerChatInterface'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CustomerChatPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: survey } = await supabase
    .from('survey_requests')
    .select('id, customer_name, customer_email, tracking_code, tracking_token, status')
    .eq('tracking_token', token)
    .single()

  if (!survey) notFound()

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('survey_request_id', survey.id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/track?code=${survey.tracking_code}`} className="text-gray-400">
            ←
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm">
              💬
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">QGO Relocation Support</p>
              <p className="text-xs text-gray-500">Survey #{survey.tracking_code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 flex flex-col" style={{ height: 'calc(100vh - 72px)' }}>
        <CustomerChatInterface
          surveyRequestId={survey.id}
          initialMessages={messages || []}
          customerName={survey.customer_name}
          customerEmail={survey.customer_email}
        />
      </div>
    </div>
  )
}
