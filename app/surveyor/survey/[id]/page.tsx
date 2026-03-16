import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SurveyorSurveyClient from '@/components/surveyor/SurveyorSurveyClient'

export default async function SurveyorSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify assignment
  const { data: assignment } = await supabase
    .from('survey_assignments')
    .select('*')
    .eq('survey_request_id', id)
    .eq('surveyor_id', user!.id)
    .single()

  if (!assignment) notFound()

  const { data: survey } = await supabase
    .from('survey_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!survey) notFound()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, items(*)')
    .eq('survey_request_id', id)
    .order('order_index')

  const { data: categories } = await supabase
    .from('item_categories')
    .select('*, item_library(*)')
    .order('order_index')

  return (
    <SurveyorSurveyClient
      survey={survey}
      assignment={assignment}
      initialRooms={rooms || []}
      categories={categories || []}
      surveyorId={user!.id}
    />
  )
}
