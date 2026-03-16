'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GpsLocation } from '@/lib/types'

interface Props {
  surveyorId: string
  surveyRequestId: string
}

export default function SurveyLiveMap({ surveyorId, surveyRequestId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [location, setLocation] = useState<GpsLocation | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)

  useEffect(() => {
    async function initMap() {
      if (!mapRef.current || typeof window === 'undefined') return

      const L = (await import('leaflet')).default
      // Load leaflet CSS via link tag
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix leaflet marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([25.2048, 55.2708], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      setMapInstance(map)

      // Load last known location
      const supabase = createClient()
      const { data } = await supabase
        .from('gps_locations')
        .select('*')
        .eq('surveyor_id', surveyorId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setLocation(data)
        const m = L.marker([data.lat, data.lng]).addTo(map)
        m.bindPopup('Surveyor Location').openPopup()
        map.setView([data.lat, data.lng], 15)
        setMarker(m)
      }
    }

    initMap()
  }, [surveyorId])

  // Subscribe to realtime GPS updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`gps-${surveyorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_locations',
          filter: `surveyor_id=eq.${surveyorId}`,
        },
        (payload) => {
          const newLoc = payload.new as GpsLocation
          setLocation(newLoc)

          if (mapInstance && marker) {
            marker.setLatLng([newLoc.lat, newLoc.lng])
            mapInstance.setView([newLoc.lat, newLoc.lng])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [surveyorId, mapInstance, marker])

  return (
    <div>
      <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden" />
      {location && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Last updated: {new Date(location.recorded_at).toLocaleTimeString()}
          {location.accuracy && ` · Accuracy: ±${Math.round(location.accuracy)}m`}
        </div>
      )}
    </div>
  )
}
