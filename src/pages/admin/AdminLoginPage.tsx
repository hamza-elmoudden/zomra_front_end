import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '@/api/admin.api'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/user.types'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(email, password)
      setTokens(res.accessToken, res.refreshToken)
      setUser({
        id: res.user.id,
        email: res.user.email,
        username: res.user.email.split('@')[0],
        full_name: res.user.fullName,
        role: res.user.role,
        reputation_score: 0,
        total_reviews: 0,
        is_verified: true,
        is_active: true,
        created_at: new Date().toISOString(),
      } as User)
      navigate('/admin/dashboard')
    } catch {
      setError('Invalid credentials or insufficient permissions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--z-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24,
            boxShadow: '0 0 30px rgba(108,92,231,0.4)',
          }}>🛡️</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Admin Panel
          </h1>
          <p style={{ color: 'var(--z-muted)', fontSize: 14 }}>Staff access only</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--z-muted)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zomra.com" required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                background: 'var(--z-surface)', border: '1px solid var(--z-border)',
                color: 'var(--z-text)', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--z-muted)', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                background: 'var(--z-surface)', border: '1px solid var(--z-border)',
                color: 'var(--z-text)', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--z-coral)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              border: 'none', borderRadius: 10, color: 'white',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--z-muted)' }}>
          <a href="/login" style={{ color: 'var(--z-accent2)', textDecoration: 'none' }}>← Back to app login</a>
        </p>
      </div>
    </div>
  )
}
