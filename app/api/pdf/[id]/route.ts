import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import SurveyReport from '@/components/pdf/SurveyReport'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: surveyRequest } = await supabase
    .from('survey_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!surveyRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, items(*)')
    .eq('survey_request_id', id)
    .order('order_index')

  const { data: finalSurvey } = await supabase
    .from('surveys')
    .select('*')
    .eq('survey_request_id', id)
    .single()

  const element = createElement(SurveyReport as any, {
    survey: finalSurvey,
    surveyRequest,
    rooms: rooms || [],
    finalSurvey,
    signatureUrl: finalSurvey?.signature_url,
  }) as any

  const pdfBuffer = await renderToBuffer(element)

  // Save to Supabase Storage
  const fileName = `surveys/${id}/report-${Date.now()}.pdf`
  await supabase.storage
    .from('survey-pdfs')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  const { data: { publicUrl } } = supabase.storage.from('survey-pdfs').getPublicUrl(fileName)

  // Update pdf_url in surveys table
  if (finalSurvey) {
    await supabase.from('surveys').update({ pdf_url: publicUrl }).eq('id', finalSurvey.id)
  }

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="QGO-Survey-${surveyRequest.tracking_code}.pdf"`,
    },
  })
}
