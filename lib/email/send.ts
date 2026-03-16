// Uses Supabase Edge Functions for email and WhatsApp

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[EMAIL ERROR]', err)
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err)
  }
}

export async function sendWhatsApp(phone: string, message: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ phone, message }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[WHATSAPP ERROR]', err)
    }
  } catch (err) {
    console.error('[WHATSAPP ERROR]', err)
  }
}
