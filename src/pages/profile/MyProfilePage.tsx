import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getMe } from '@/api/users.api'
import { getUserReviews } from '@/api/users.api'
import { getAllInterests } from '@/api/interests.api'
import { useAuth } from '@/hooks/useAuth'
import { Star, Edit3, LogOut, Shield, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function MyProfilePage() {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({ queryKey: ['me'], queryFn: getMe, initialData: user ?? undefined })
  const { data: reviews = [] } = useQuery({ queryKey: ['user', user?.id, 'reviews'], queryFn: () => getUserReviews(user!.id), enabled: !!user?.id })
  const { data: interests = [] } = useQuery({ queryKey: ['interests'], queryFn: getAllInterests })

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const initials = (profile?.full_name ?? profile?.username ?? 'ME').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    clearUser()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          {/* Avatar */}
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif', border: '3px solid rgba(162,155,254,0.35)', flexShrink: 0 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </div>

          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--z-text)', marginBottom: 3 }}>
              {profile?.full_name || profile?.username}
            </div>
            <div style={{ fontSize: 13, color: 'var(--z-muted)', marginBottom: 8 }}>
              @{profile?.username}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile?.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(0,206,201,0.12)', color: 'var(--z-mint)', border: '1px solid rgba(0,206,201,0.25)' }}>
                  <Shield size={11} /> Verified
                </span>
              )}
              {profile?.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, background: 'var(--z-surface2)', color: 'var(--z-muted)', border: '1px solid var(--z-border)' }}>
                  <MapPin size={11} /> {profile.city}
                </span>
              )}
            </div>
          </div>

          <button onClick={() => navigate('/profile/edit')} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Edit3 size={14} />
          </button>
        </div>

        {profile?.bio && (
          <p style={{ fontSize: 14, color: 'var(--z-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { val: profile?.reputation_score ?? 0, label: 'Score' },
            { val: avgRating ? `⭐ ${avgRating}` : '—', label: `${reviews.length} Reviews` },
            { val: formatDate(profile?.created_at ?? new Date().toISOString()).split(',')[0], label: 'Joined' },
          ].map(({ val, label }) => (
            <div key={label} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--z-text)', marginBottom: 3 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interests */}
      {interests.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <h2 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 12 }}>Interests</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {interests.slice(0, 8).map((i) => (
              <span key={i.id} style={{ padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)' }}>
                {i.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <h2 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 12 }}>
            Reviews ({reviews.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.slice(0, 3).map((r) => (
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

      {/* Joined date + logout */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: 'var(--z-muted)' }}>
          <Calendar size={14} />
          Member since {formatDate(profile?.created_at ?? new Date().toISOString())}
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--z-coral)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}
