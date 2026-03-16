import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'QGO Relocation <noreply@qgorelocation.com>'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.log('[EMAIL SKIPPED - no API key]', { to, subject })
    return
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[EMAIL ERROR]', err)
  }
}

export async function sendWhatsApp(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || accountSid === 'your_twilio_account_sid_here') {
    console.log('[WHATSAPP SKIPPED - no credentials]', { phone, message })
    return
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const body = new URLSearchParams({
      From: from!,
      To: `whatsapp:${phone}`,
      Body: message,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      console.error('[WHATSAPP ERROR]', await response.text())
    }
  } catch (err) {
    console.error('[WHATSAPP ERROR]', err)
  }
}
