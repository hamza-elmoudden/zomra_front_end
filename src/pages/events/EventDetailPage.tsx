import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventById, deleteEvent, getParticipants } from '@/api/events.api'
import { getUserById, getUserReviews } from '@/api/users.api'
import { useAuthStore } from '@/store/authStore'
import EventMap from '@/components/events/EventMap'
import JoinLeaveButton from '@/components/events/JoinLeaveButton'
import ParticipantList from '@/components/events/ParticipantList'
import {
  Calendar, Clock, MapPin, Star, Edit3, Trash2, ArrowLeft, Users,
} from 'lucide-react'
import { formatDate, formatTime, statusColor } from '@/lib/utils'

const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵', Sports: '🏃', Food: '🍕', Arts: '🎭',
  Tech: '💻', Books: '📚', Nature: '🌿', Wellness: '🧘',
}
const CATEGORY_COLOR: Record<string, string> = {
  Music: 'rgba(108,92,231,0.2)', Sports: 'rgba(0,206,201,0.15)',
  Food: 'rgba(253,121,168,0.15)', Arts: 'rgba(255,107,107,0.15)',
  Tech: 'rgba(108,92,231,0.15)', Books: 'rgba(255,234,167,0.12)',
  Nature: 'rgba(0,206,201,0.12)', Wellness: 'rgba(0,206,201,0.12)',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  })

  const { data: participants = [] } = useQuery({
    queryKey: ['event', id, 'participants'],
    queryFn: () => getParticipants(id!),
    enabled: !!id,
  })

  const { data: host } = useQuery({
    queryKey: ['user', event?.host_id],
    queryFn: () => getUserById(event!.host_id),
    enabled: !!event?.host_id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['user', event?.host_id, 'reviews'],
    queryFn: () => getUserReviews(event!.host_id),
    enabled: !!event?.host_id,
  })

  const isHost = userId === event?.host_id

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/events', { replace: true })
    },
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--z-accent2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <p style={{ color: 'var(--z-coral)', marginBottom: 16, fontSize: 15 }}>Event not found or failed to load.</p>
        <button onClick={() => navigate('/events')} style={{ background: 'var(--z-accent)', border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
          Back to Events
        </button>
      </div>
    )
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const emoji = CATEGORY_EMOJI[event.category] ?? '✦'
  const heroBg = CATEGORY_COLOR[event.category] ?? 'rgba(108,92,231,0.15)'

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      {/* Hero */}
      <div style={{ height: 200, background: heroBg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 64 }}>{emoji}</span>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--z-bg) 100%)' }} />

        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={16} />
        </button>

        {isHost && (
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/events/${id}/edit`)}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate() }}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,107,107,0.4)', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--z-accent2)' }}>{event.category}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(event.status)}`}>{event.status}</span>
        </div>

        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', lineHeight: 1.2, marginBottom: 18, letterSpacing: '-0.3px' }}>
          {event.title}
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { val: `${event.current_count}/${event.max_participants}`, label: 'Going' },
            { val: `${event.duration_minutes}m`, label: 'Duration' },
            { val: avgRating ? `⭐ ${avgRating}` : '—', label: 'Host rating' },
          ].map(({ val, label }) => (
            <div key={label} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--z-text)' }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--z-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
            <Calendar size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
            {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
            <Clock size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
            {event.duration_minutes} minutes
          </div>
          {(event.address || event.city) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
              <MapPin size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
              {[event.address, event.city].filter(Boolean).join(', ')}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
            <Users size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
            {event.current_count} of {event.max_participants} spots filled
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ marginBottom: 20 }}>
            <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 8 }}>About</h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--z-muted)' }}>{event.description}</p>
          </div>
        )}

        {/* Host card */}
        <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', fontFamily: '"Sora", sans-serif', flexShrink: 0 }}>
            {(host?.full_name ?? host?.username ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--z-text)' }}>{host?.full_name || host?.username || 'Host'}</div>
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--z-muted)', marginTop: 2 }}>
                <Star size={12} style={{ fill: '#ffeaa7', color: '#ffeaa7' }} />
                {avgRating} · {reviews.length} reviews
              </div>
            )}
          </div>
          <span
            onClick={() => navigate(`/users/${event.host_id}`)}
            style={{ fontSize: 12, color: 'var(--z-accent2)', fontWeight: 500, cursor: 'pointer' }}
          >
            View →
          </span>
        </div>

        {/* Join/Leave */}
        <div style={{ marginBottom: 20 }}>
          <JoinLeaveButton
            eventId={event.id}
            hostId={event.host_id}
            currentCount={event.current_count}
            maxParticipants={event.max_participants}
            participants={participants}
          />
        </div>

        {/* Participants */}
        <div style={{ marginBottom: 20 }}>
          <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 12 }}>
            Participants
          </h3>
          <ParticipantList eventId={event.id} hostId={event.host_id} participants={participants} />
        </div>

        {/* Map */}
        {(event.lat || event.lng) && (
          <div style={{ marginBottom: 20 }}>
            <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 10 }}>Location</h3>
            <EventMap lat={event.lat} lng={event.lng} readOnly />
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 14, padding: '16px' }}>
            <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 14 }}>
              Reviews ({reviews.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((review) => (
                <div key={review.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--z-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} style={{ fill: i < review.rating ? '#ffeaa7' : 'transparent', color: i < review.rating ? '#ffeaa7' : 'rgba(255,255,255,0.15)' }} />
                    ))}
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--z-muted)' }}>{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && <p style={{ fontSize: 13, color: 'var(--z-muted)', lineHeight: 1.5 }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
