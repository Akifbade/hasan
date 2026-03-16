import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, sendWhatsApp } from '@/lib/email/send'
import {
  surveyRequestConfirmationEmail,
  surveyorAssignedEmail,
  surveyCompletedEmail,
} from '@/lib/email/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Send notifications when survey status changes
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, surveyRequestId } = body

  const { data: survey } = await supabase
    .from('survey_requests')
    .select('*')
    .eq('id', surveyRequestId)
    .single()

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qgorelocation.com'

  if (action === 'request_confirmation') {
    const emailData = surveyRequestConfirmationEmail({
      customerName: survey.customer_name,
      trackingCode: survey.tracking_code,
      appUrl,
      pickupAddress: survey.pickup_address,
      destinationCountry: survey.destination_country || '',
      preferredDate: survey.preferred_date,
    })

    await sendEmail(survey.customer_email, emailData.subject, emailData.html)

    if (survey.customer_whatsapp) {
      await sendWhatsApp(
        survey.customer_whatsapp,
        `Hi ${survey.customer_name}! 👋 Your QGO Relocation survey request has been received.\n\nTracking Code: *${survey.tracking_code}*\nTrack your survey: ${appUrl}/track?code=${survey.tracking_code}`
      )
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      survey_request_id: surveyRequestId,
      type: 'email',
      recipient: survey.customer_email,
      subject: emailData.subject,
      status: 'sent',
    })
  }

  if (action === 'surveyor_assigned') {
    const { data: assignment } = await supabase
      .from('survey_assignments')
      .select('*, profiles(full_name)')
      .eq('survey_request_id', surveyRequestId)
      .eq('status', 'assigned')
      .single()

    if (assignment) {
      const emailData = surveyorAssignedEmail({
        customerName: survey.customer_name,
        surveyorName: (assignment as any).profiles?.full_name || 'Our Surveyor',
        scheduledDate: assignment.scheduled_date,
        trackingCode: survey.tracking_code,
        appUrl,
      })

      await sendEmail(survey.customer_email, emailData.subject, emailData.html)

      if (survey.customer_whatsapp) {
        await sendWhatsApp(
          survey.customer_whatsapp,
          `Hi ${survey.customer_name}! A surveyor has been assigned to your request.\n\n👷 ${(assignment as any).profiles?.full_name}\n${assignment.scheduled_date ? `📅 ${assignment.scheduled_date}\n` : ''}\nTrack live: ${appUrl}/track?code=${survey.tracking_code}`
        )
      }
    }
  }

  if (action === 'survey_completed') {
    const { data: finalSurvey } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_request_id', surveyRequestId)
      .single()

    const emailData = surveyCompletedEmail({
      customerName: survey.customer_name,
      trackingCode: survey.tracking_code,
      totalVolume: finalSurvey?.total_volume_m3 || 0,
      containerType: finalSurvey?.container_type,
      quotedPrice: finalSurvey?.quoted_price,
      currency: finalSurvey?.currency,
      pdfUrl: finalSurvey?.pdf_url,
      appUrl,
    })

    await sendEmail(survey.customer_email, emailData.subject, emailData.html)

    if (survey.customer_whatsapp) {
      await sendWhatsApp(
        survey.customer_whatsapp,
        `🎉 Survey complete, ${survey.customer_name}!\n\nYour relocation quote is ready.\nTotal Volume: ${finalSurvey?.total_volume_m3?.toFixed(2)} m³\n\nView your report: ${appUrl}/track?code=${survey.tracking_code}`
      )
    }
  }

  return NextResponse.json({ success: true })
}
