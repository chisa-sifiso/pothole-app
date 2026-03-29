import { useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { SEVERITY_COLORS } from '../../utils/formatters'

const JOBURG_CENTER = { lat: -26.2041, lng: 28.0473 }

function FallbackMap({ potholes = [], onMarkerClick }) {
  return (
    <div className="w-full h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-center">
        <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-slate-600 font-medium">Map unavailable</p>
        <p className="text-slate-400 text-sm mt-1">Google Maps billing not enabled for this API key.</p>
        <a
          href="https://console.cloud.google.com/billing"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-500 text-xs underline"
        >
          Enable billing at console.cloud.google.com
        </a>
      </div>
      {potholes.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-slate-600 mb-2">{potholes.length} report(s) listed below:</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {potholes.map(p => (
              <button
                key={p.id}
                onClick={() => onMarkerClick?.(p)}
                className="w-full text-left px-3 py-2 bg-white rounded border border-slate-200 hover:bg-slate-50 text-sm"
              >
                <span className="font-medium">{p.severity || 'UNKNOWN'}</span>
                <span className="text-slate-500 ml-2">{p.address || `${p.latitude}, ${p.longitude}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapView({ potholes = [], onMarkerClick, center, zoom = 12 }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
  const [mapError, setMapError] = useState(!apiKey || window.__gmapsAuthFailed === true)

  useEffect(() => {
    // Also catch future auth failures (e.g. key revoked mid-session)
    const prev = window.gm_authFailure
    window.gm_authFailure = () => {
      window.__gmapsAuthFailed = true
      setMapError(true)
      if (typeof prev === 'function') prev()
    }
    // Check if it already failed before this component mounted
    if (window.__gmapsAuthFailed) setMapError(true)
    return () => { window.gm_authFailure = prev }
  }, [])

  if (mapError) {
    return <FallbackMap potholes={potholes} onMarkerClick={onMarkerClick} />
  }

  return (
    <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
      <Map
        defaultCenter={center || JOBURG_CENTER}
        defaultZoom={zoom}
        mapId="pothole-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
      >
        {potholes.map((pothole) => {
          const color = SEVERITY_COLORS[pothole.severity] || '#94a3b8'
          return (
            <AdvancedMarker
              key={pothole.id}
              position={{ lat: Number(pothole.latitude), lng: Number(pothole.longitude) }}
              onClick={() => onMarkerClick?.(pothole)}
              title={`${pothole.severity || 'Unknown'} severity — ${pothole.address || 'No address'}`}
            >
              <Pin background={color} borderColor={color} glyphColor="#ffffff" />
            </AdvancedMarker>
          )
        })}
      </Map>
    </APIProvider>
  )
}
