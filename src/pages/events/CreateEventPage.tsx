import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '@/api/events.api'
import EventForm from '@/components/events/EventForm'
import type { CreateEventDto } from '@/api/events.api'
import { ArrowLeft } from 'lucide-react'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: (data: CreateEventDto) => createEvent(data),
    onSuccess: (event) => navigate(`/events/${event.id}`),
  })

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      <div style={{ padding: '20px 20px 32px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--z-text)', letterSpacing: '-0.3px' }}>Create Event</h1>
        </div>
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
