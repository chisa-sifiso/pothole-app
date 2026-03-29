import { useState, useEffect } from 'react'

export function useGeolocation() {
  const [coords, setCoords]   = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
        // Default to Johannesburg if permission denied
        setCoords({ lat: -26.2041, lng: 28.0473 })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return { coords, error, loading }
}
