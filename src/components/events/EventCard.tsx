import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Event } from '@/types/event.types'
import { formatDate, formatTime, statusColor } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/events/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/events/${event.id}`)
      }}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden rounded-t-xl bg-gray-100">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Calendar className="h-10 w-10" />
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}
        >
          {event.status}
        </span>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
          <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
            {event.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(event.starts_at)} at {formatTime(event.starts_at)}
          </span>
        </div>

        {event.city && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{event.city}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              {event.current_count}/{event.max_participants}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
