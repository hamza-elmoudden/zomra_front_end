import { useEffect, useReducer } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getMe } from '@/api/auth.api'
import { Loader2 } from 'lucide-react'

interface AuthState {
  status: 'loading' | 'error' | 'success'
  errorMessage: string | null
}

type AuthAction =
  | { type: 'error'; message: string }
  | { type: 'success' }

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'error':
      return { status: 'error', errorMessage: action.message }
    case 'success':
      return { status: 'success', errorMessage: null }
  }
}

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const [state, dispatch] = useReducer(authReducer, {
    status: 'loading',
    errorMessage: null,
  })

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      dispatch({ type: 'error', message: 'Missing authentication tokens. Please try logging in again.' })
      return
    }

    setTokens(accessToken, refreshToken)

    let cancelled = false
    getMe()
      .then((user) => {
        if (cancelled) return
        setUser(user)
        dispatch({ type: 'success' })
        navigate('/home', { replace: true })
      })
      .catch(() => {
        if (cancelled) return
        dispatch({ type: 'error', message: 'Failed to fetch user profile. Please try logging in again.' })
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, setTokens, setUser, navigate])

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm text-center">
          <p className="text-red-500">{state.errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 rounded-xl bg-primary px-6 py-2 text-white hover:bg-primary-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </div>
  )
}
