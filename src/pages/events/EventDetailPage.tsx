import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventById, deleteEvent, getParticipants } from '@/api/events.api'
import { getUserById, getUserReviews } from '@/api/users.api'
import { useAuthStore } from '@/store/authStore'
import EventMap from '@/components/events/EventMap'
import JoinLeaveButton from '@/components/events/JoinLeaveButton'
import ParticipantList from '@/components/events/ParticipantList'
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Edit3,
  Trash2,
  Loader2,
  User,
  ArrowLeft,
} from 'lucide-react'
import { formatDate, formatTime, statusColor } from '@/lib/utils'

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500">Event not found or failed to load.</p>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="mt-4 rounded-xl bg-primary px-6 py-2 text-sm text-white"
        >
          Back to Events
        </button>
      </div>
    )
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="relative mb-6 h-56 overflow-hidden rounded-xl bg-gray-100">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Calendar className="h-16 w-16" />
            </div>
          )}
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-sm font-medium ${statusColor(event.status)}`}
          >
            {event.status}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <span className="mt-1 inline-block rounded-full bg-primary-50 px-3 py-0.5 text-sm font-medium text-primary">
                {event.category}
              </span>
            </div>
            {isHost && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  className="flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this event?')) deleteMutation.mutate()
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1 rounded-xl border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? '...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(event.starts_at)} &middot; {event.duration_minutes} min
            </span>
          </div>
          {event.address && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{event.address}</span>
            </div>
          )}
          {event.city && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{event.city}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">About</h3>
            <p className="text-sm leading-relaxed text-gray-600">{event.description}</p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {host?.full_name || host?.username || 'Host'}
              </p>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>
                    {avgRating} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          <JoinLeaveButton
            eventId={event.id}
            hostId={event.host_id}
            currentCount={event.current_count}
            maxParticipants={event.max_participants}
            participants={participants}
          />
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <ParticipantList
            eventId={event.id}
            hostId={event.host_id}
            participants={participants}
          />
        </div>

        {(event.lat || event.lng) && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Location</h3>
            <EventMap lat={event.lat} lng={event.lng} readOnly />
          </div>
        )}

        {reviews.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Reviews ({reviews.length})
            </h3>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
