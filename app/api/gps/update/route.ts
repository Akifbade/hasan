import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// OwnTracks format: POST with JSON body
// GPSLogger format: GET with query params
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // OwnTracks payload
    // { "_type": "location", "lat": 25.2048, "lon": 55.2708, "acc": 10, "tid": "surveyor_uuid", "batt": 80 }
    if (body._type === 'location') {
      const surveyorId = body.tid || req.headers.get('x-surveyor-id')
      if (!surveyorId) return NextResponse.json({ error: 'Missing surveyor ID' }, { status: 400 })

      // Find active assignment for this surveyor
      const { data: assignment } = await supabase
        .from('survey_assignments')
        .select('survey_request_id')
        .eq('surveyor_id', surveyorId)
        .eq('status', 'in_progress')
        .single()

      await supabase.from('gps_locations').insert({
        surveyor_id: surveyorId,
        survey_request_id: assignment?.survey_request_id || null,
        lat: body.lat,
        lng: body.lon,
        accuracy: body.acc,
        speed: body.vel,
        battery: body.batt,
        recorded_at: body.tst ? new Date(body.tst * 1000).toISOString() : new Date().toISOString(),
      })

      return NextResponse.json({ result: [] }) // OwnTracks expects this response
    }

    return NextResponse.json({ error: 'Unknown payload type' }, { status: 400 })
  } catch (err) {
    console.error('GPS update error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GPSLogger sends GET request
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon') || searchParams.get('lng')
    const surveyorId = searchParams.get('id')
    const accuracy = searchParams.get('acc')
    const speed = searchParams.get('speed')
    const battery = searchParams.get('battery') || searchParams.get('batt')

    if (!lat || !lon || !surveyorId) {
      return NextResponse.json({ error: 'Missing required params: lat, lon, id' }, { status: 400 })
    }

    const { data: assignment } = await supabase
      .from('survey_assignments')
      .select('survey_request_id')
      .eq('surveyor_id', surveyorId)
      .eq('status', 'in_progress')
      .single()

    await supabase.from('gps_locations').insert({
      surveyor_id: surveyorId,
      survey_request_id: assignment?.survey_request_id || null,
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      battery: battery ? parseFloat(battery) : null,
    })

    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('GPS GET error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}
