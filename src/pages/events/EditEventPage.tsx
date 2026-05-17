import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getEventById, updateEvent } from '@/api/events.api'
import EventForm from '@/components/events/EventForm'
import type { CreateEventDto } from '@/api/events.api'
import { Loader2 } from 'lucide-react'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (data: CreateEventDto) => updateEvent(id!, data),
    onSuccess: () => {
      navigate(`/events/${id}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Event not found.</p>
      </div>
    )
  }

  const formatStartsAt = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Event</h1>
        <EventForm
          defaultValues={{
            title: event.title,
            category: event.category,
            description: event.description || '',
            starts_at: formatStartsAt(event.starts_at),
            duration_minutes: event.duration_minutes,
            max_participants: event.max_participants,
            address: event.address || '',
            city: event.city || '',
            cover_image_url: event.cover_image_url || '',
          }}
          defaultLat={event.lat}
          defaultLng={event.lng}
          onSubmit={(data) => mutation.mutate(data)}
          isSubmitting={mutation.isPending}
          submitLabel="Save Changes"
          showStatus
          error={mutation.isError ? 'Failed to update event. Please try again.' : null}
        />
      </div>
    </div>
  )
}
