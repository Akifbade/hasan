import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customer_name, customer_email, customer_phone, customer_whatsapp,
      pickup_address, pickup_city, pickup_country,
      destination_country, destination_city,
      preferred_date, property_type, notes,
      agent_code,
    } = body

    if (!customer_name || !customer_email || !pickup_address || !pickup_country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Check agent
    let agentId = null
    if (agent_code?.trim()) {
      const { data: agent } = await admin
        .from('agents')
        .select('id')
        .eq('referral_code', agent_code.toUpperCase().trim())
        .single()
      agentId = agent?.id || null
    }

    const { data, error } = await admin
      .from('survey_requests')
      .insert({
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        customer_whatsapp: customer_whatsapp || null,
        pickup_address,
        pickup_city: pickup_city || null,
        pickup_country,
        destination_country: destination_country || null,
        destination_city: destination_city || null,
        preferred_date: preferred_date || null,
        property_type: property_type || null,
        notes: notes || null,
        agent_id: agentId,
      })
      .select('tracking_code, id')
      .single()

    if (error) throw error

    return NextResponse.json({ tracking_code: data.tracking_code, id: data.id })
  } catch (err: any) {
    console.error('Survey submit error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit' }, { status: 500 })
  }
}
