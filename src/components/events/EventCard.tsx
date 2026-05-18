import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Event } from '@/types/event.types'
import { formatDate, formatTime, statusColor } from '@/lib/utils'

interface EventCardProps {
  event: Event
  compact?: boolean
}

const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵', Sports: '🏃', Food: '🍕', Arts: '🎭',
  Tech: '💻', Books: '📚', Nature: '🌿', Wellness: '🧘',
  Games: '🎮', Travel: '✈️', Photo: '📸', Dance: '💃',
}

const CATEGORY_COLOR: Record<string, string> = {
  Music: 'rgba(108,92,231,0.15)',
  Sports: 'rgba(0,206,201,0.12)',
  Food: 'rgba(253,121,168,0.12)',
  Arts: 'rgba(255,107,107,0.12)',
  Tech: 'rgba(108,92,231,0.1)',
  Books: 'rgba(255,234,167,0.1)',
  Nature: 'rgba(0,206,201,0.1)',
  Wellness: 'rgba(0,206,201,0.1)',
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const navigate = useNavigate()
  const emoji = CATEGORY_EMOJI[event.category] ?? '✦'
  const bgColor = CATEGORY_COLOR[event.category] ?? 'rgba(108,92,231,0.1)'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/events/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/events/${event.id}`)
      }}
      className="z-card cursor-pointer overflow-hidden"
      style={{ borderRadius: 'var(--z-radius)' }}
    >
      {/* Cover / Emoji Placeholder */}
      <div
        className="relative overflow-hidden"
        style={{ height: compact ? 80 : 120, background: bgColor }}
      >
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ fontSize: compact ? 28 : 36 }}
          >
            {emoji}
          </div>
        )}
        <span
          className={`absolute right-2 top-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(event.status)}`}
          style={{ letterSpacing: '0.3px' }}
        >
          {event.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <div
          className="text-xs font-semibold mb-1"
          style={{ color: 'var(--z-accent2)', letterSpacing: '0.5px', textTransform: 'uppercase' }}
        >
          {event.category}
        </div>
        <h3
          className="font-display font-semibold line-clamp-1 mb-1.5"
          style={{ fontSize: 13, color: 'var(--z-text)', lineHeight: 1.3 }}
        >
          {event.title}
        </h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--z-muted)' }}>
            <Calendar size={12} />
            <span>{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</span>
          </div>
          {event.city && (
            <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--z-muted)' }}>
              <MapPin size={12} />
              <span>{event.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 pb-3 pt-1"
        style={{ borderTop: '1px solid var(--z-border)' }}
      >
        <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--z-muted)' }}>
          <Users size={12} />
          <span>{event.current_count}/{event.max_participants}</span>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="z-btn-outline"
          style={{ padding: '4px 12px', fontSize: 11 }}
          disabled={event.status === 'full' || event.status === 'completed' || event.status === 'cancelled'}
        >
          {event.status === 'full' ? 'Full' : 'Join'}
        </button>
      </div>
    </div>
  )
}
