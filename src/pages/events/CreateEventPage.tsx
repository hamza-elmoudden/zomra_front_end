import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '@/api/events.api'
import EventForm from '@/components/events/EventForm'
import type { CreateEventDto } from '@/api/events.api'

export default function CreateEventPage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: CreateEventDto) => createEvent(data),
    onSuccess: (event) => {
      navigate(`/events/${event.id}`)
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Event</h1>
        <EventForm
          onSubmit={(data) => mutation.mutate(data)}
          isSubmitting={mutation.isPending}
          submitLabel="Create Event"
          error={mutation.isError ? 'Failed to create event. Please try again.' : null}
        />
      </div>
    </div>
  )
}
