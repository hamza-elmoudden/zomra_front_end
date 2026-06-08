import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMe, getUserReviews } from '@/api/users.api'
import { getMyEvents, deleteEvent } from '@/api/events.api'
import { getAllInterests } from '@/api/interests.api'
import { useAuth } from '@/hooks/useAuth'
import {
  Star, Edit3, LogOut, Shield, MapPin, Calendar,
  Plus, Trash2, ImagePlus, ChevronRight, Clock,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  open:      { background: 'rgba(0,206,201,0.12)',   color: '#00cec9', border: '1px solid rgba(0,206,201,0.25)' },
  full:      { background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)' },
  ongoing:   { background: 'rgba(108,92,231,0.15)',  color: '#a29bfe', border: '1px solid rgba(108,92,231,0.3)' },
  draft:     { background: 'rgba(136,144,164,0.12)', color: '#8890a4', border: '1px solid rgba(136,144,164,0.2)' },
  completed: { background: 'rgba(136,144,164,0.08)', color: '#6b7280', border: '1px solid rgba(136,144,164,0.15)' },
  cancelled: { background: 'rgba(255,107,107,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.15)' },
}

export default function MyProfilePage() {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    initialData: user ?? undefined,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['user', user?.id, 'reviews'],
    queryFn: () => getUserReviews(user!.id),
    enabled: !!user?.id,
  })

  const { data: myEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'my'],
    queryFn: getMyEvents,
    enabled: !!user?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'my'] }),
  })

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const initials = (profile?.full_name ?? profile?.username ?? 'ME')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    clearUser()
    qc.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', paddingBottom: 40 }}>

      {/* ── Profile header ─────────────────────────────── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif',
            border: '3px solid rgba(162,155,254,0.35)', flexShrink: 0, overflow: 'hidden',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>

          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>
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

          <button
            onClick={() => navigate('/profile/edit')}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Edit profile"
          >
            <Edit3 size={14} />
          </button>
        </div>

        {profile?.bio && (
          <p style={{ fontSize: 14, color: 'var(--z-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { val: profile?.reputation_score ?? 0, label: 'Score' },
            { val: avgRating ? `⭐ ${avgRating}` : '—', label: `${reviews.length} Reviews` },
            { val: myEvents.length, label: 'Events Hosted' },
          ].map(({ val, label }) => (
            <div key={label} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── My Events ──────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>My Events</h2>
          <button
            onClick={() => navigate('/events/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
              color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> New Event
          </button>
        </div>

        {eventsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
            ))}
          </div>
        ) : myEvents.length === 0 ? (
          <div
            onClick={() => navigate('/events/new')}
            style={{
              background: 'var(--z-surface)', border: '2px dashed var(--z-border)',
              borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(162,155,254,0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--z-border)')}
          >
            <Plus size={28} color="var(--z-muted)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No events yet</div>
            <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>Tap to create your first event</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myEvents.map((event) => (
              <div
                key={event.id}
                className="z-card"
                style={{ padding: '14px 16px' }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Cover thumbnail */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                    background: 'var(--z-surface2)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {event.cover_image_url
                      ? <img src={event.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '✦'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 500,
                          ...(STATUS_STYLE[event.status] ?? STATUS_STYLE.draft),
                        }}
                      >
                        {event.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--z-muted)' }}>{event.category}</span>
                    </div>

                    <div
                      className="font-display"
                      style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {event.title}
                    </div>

                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--z-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={11} /> {formatDate(event.starts_at)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} /> {formatTime(event.starts_at)}
                      </span>
                      <span>👥 {event.current_count}/{event.max_participants}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--z-border)' }}>
                  <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '8px', borderRadius: 9, border: '1px solid var(--z-border)',
                      background: 'transparent', color: 'var(--z-muted)', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <ChevronRight size={13} /> View
                  </button>
                  <button
                    onClick={() => navigate(`/events/${event.id}/media`)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '8px', borderRadius: 9, border: '1px solid var(--z-border)',
                      background: 'transparent', color: 'var(--z-muted)', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <ImagePlus size={13} /> Photos
                  </button>
                  <button
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '8px', borderRadius: 9, border: '1px solid rgba(162,155,254,0.3)',
                      background: 'rgba(108,92,231,0.08)', color: 'var(--z-accent2)', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${event.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(event.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    style={{
                      width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 9, border: '1px solid rgba(255,107,107,0.25)',
                      background: 'rgba(255,107,107,0.08)', color: 'var(--z-coral)', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                    }}
                    title="Delete event"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reviews ────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
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

      {/* ── Footer ─────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--z-muted)' }}>
          <Calendar size={14} />
          Member since {formatDate(profile?.created_at ?? new Date().toISOString())}
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--z-coral)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )
}
