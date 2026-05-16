import { useEffect, useReducer } from 'react'

interface LocationState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
}

type LocationAction =
  | { type: 'success'; lat: number; lng: number }
  | { type: 'error'; message: string }
  | { type: 'unsupported' }

function locationReducer(_state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'success':
      return { lat: action.lat, lng: action.lng, error: null, loading: false }
    case 'error':
      return { lat: null, lng: null, error: action.message, loading: false }
    case 'unsupported':
      return { lat: null, lng: null, error: 'Geolocation not supported', loading: false }
  }
}

export function useLocation() {
  const [state, dispatch] = useReducer(locationReducer, {
    lat: null,
    lng: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: 'success',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Could not get location'
        dispatch({ type: 'error', message })
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  return state
}
