import { useEffect, useReducer } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getMe } from '@/api/auth.api'

interface AuthState { status: 'loading' | 'error' | 'success'; errorMessage: string | null }
type AuthAction = { type: 'error'; message: string } | { type: 'success' }

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  if (action.type === 'error') return { status: 'error', errorMessage: action.message }
  return { status: 'success', errorMessage: null }
}

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const [state, dispatch] = useReducer(authReducer, { status: 'loading', errorMessage: null })

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    if (!accessToken || !refreshToken) {
      dispatch({ type: 'error', message: 'Missing authentication tokens. Please try logging in again.' })
      return
    }
    setTokens(accessToken, refreshToken)
    let cancelled = false
    getMe().then((user) => {
      if (cancelled) return
      setUser(user)
      dispatch({ type: 'success' })
      navigate('/home', { replace: true })
    }).catch(() => {
      if (cancelled) return
      dispatch({ type: 'error', message: 'Failed to fetch user profile.' })
    })
    return () => { cancelled = true }
  }, [searchParams, setTokens, setUser, navigate])

  if (state.status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: 'var(--z-coral)', marginBottom: 16, fontSize: 15 }}>{state.errorMessage}</p>
          <button onClick={() => navigate('/login')} style={{ background: 'var(--z-accent)', border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--z-accent2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--z-muted)', fontSize: 15 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
