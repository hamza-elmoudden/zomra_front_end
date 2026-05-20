import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUserById, getUserReviews } from '@/api/users.api'
import { ArrowLeft, Star, Shield, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => getUserById(id!), enabled: !!id })
  const { data: reviews = [] } = useQuery({ queryKey: ['user', id, 'reviews'], queryFn: () => getUserReviews(id!), enabled: !!id })

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  const initials = (user?.full_name ?? user?.username ?? '??').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--z-accent2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--z-muted)' }}>User not found.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', paddingBottom: 24 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <ArrowLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #00cec9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif', border: '3px solid rgba(162,155,254,0.25)', flexShrink: 0 }}>
            {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--z-text)', marginBottom: 3 }}>{user.full_name || user.username}</div>
            <div style={{ fontSize: 13, color: 'var(--z-muted)', marginBottom: 8 }}>@{user.username}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(0,206,201,0.12)', color: 'var(--z-mint)', border: '1px solid rgba(0,206,201,0.25)' }}>
                  <Shield size={11} /> Verified
                </span>
              )}
              {user.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, background: 'var(--z-surface2)', color: 'var(--z-muted)', border: '1px solid var(--z-border)' }}>
                  <MapPin size={11} /> {user.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {user.bio && <p style={{ fontSize: 14, color: 'var(--z-muted)', lineHeight: 1.6, marginBottom: 20 }}>{user.bio}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--z-text)' }}>{user.reputation_score}</div>
            <div style={{ fontSize: 11, color: 'var(--z-muted)', marginTop: 2 }}>Reputation</div>
          </div>
          <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--z-text)' }}>{avgRating ? `⭐ ${avgRating}` : '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--z-muted)', marginTop: 2 }}>{reviews.length} reviews</div>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 600, color: 'var(--z-text)', marginBottom: 12 }}>Reviews</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: r.comment ? 6 : 0 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} style={{ fill: i < r.rating ? '#ffeaa7' : 'transparent', color: i < r.rating ? '#ffeaa7' : 'rgba(255,255,255,0.15)' }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--z-muted)', marginLeft: 6 }}>{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p style={{ fontSize: 13, color: 'var(--z-muted)', lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
