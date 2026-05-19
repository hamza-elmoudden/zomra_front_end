import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getEventById, updateEvent } from '@/api/events.api'
import EventForm from '@/components/events/EventForm'
import type { CreateEventDto } from '@/api/events.api'
import { ArrowLeft } from 'lucide-react'

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
    onSuccess: () => navigate(`/events/${id}`),
  })

  const formatStartsAt = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--z-accent2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--z-muted)' }}>Event not found.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      <div style={{ padding: '20px 20px 32px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--z-text)', letterSpacing: '-0.3px' }}>Edit Event</h1>
        </div>
        <EventForm
          defaultValues={{
            title: event.title, category: event.category,
            description: event.description || '',
            starts_at: formatStartsAt(event.starts_at),
            duration_minutes: event.duration_minutes,
            max_participants: event.max_participants,
            address: event.address || '', city: event.city || '',
            cover_image_url: event.cover_image_url || '',
          }}
          defaultLat={event.lat}
          defaultLng={event.lng}
          onSubmit={(data) => mutation.mutate(data)}
          isSubmitting={mutation.isPending}
          submitLabel="Save Changes"
          showStatus
          error={mutation.isError ? 'Failed to update event.' : null}
        />
      </div>
    </div>
  )
}
