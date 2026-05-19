import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌌</div>
      <h1 className="font-display gradient-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 16, color: 'var(--z-text)', marginBottom: 6 }}>Page not found</p>
      <p style={{ fontSize: 14, color: 'var(--z-muted)', marginBottom: 28 }}>This page seems to have wandered off.</p>
      <button onClick={() => navigate('/home')} style={{ background: 'var(--z-accent)', border: 'none', borderRadius: 12, padding: '12px 24px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: '"Sora",sans-serif' }}>
        Back to Home
      </button>
    </div>
  )
}
