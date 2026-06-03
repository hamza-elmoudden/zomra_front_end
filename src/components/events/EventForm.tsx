import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { getAllInterests } from '@/api/interests.api'
import EventMap from '@/components/events/EventMap'
import type { CreateEventDto } from '@/api/events.api'

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  startsAt: z.string().min(1, 'Start date/time is required'),
  durationMinutes: z.coerce.number().min(15, 'Minimum 15 minutes'),
  maxParticipants: z.coerce.number().min(2, 'Minimum 2 participants'),
  address: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
})

export type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  defaultLat?: number | null
  defaultLng?: number | null
  onSubmit: (data: CreateEventDto) => void
  isSubmitting: boolean
  submitLabel: string
  showStatus?: boolean
  error?: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--z-text)',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.4px',
  textTransform: 'uppercase', color: 'var(--z-muted)', marginBottom: 6,
}
const errStyle: React.CSSProperties = { fontSize: 12, color: 'var(--z-coral)', marginTop: 4 }

export default function EventForm({ defaultValues, defaultLat, defaultLng, onSubmit, isSubmitting, submitLabel, showStatus = false, error }: EventFormProps) {
  const [lat, setLat] = useState<number | null>(defaultLat ?? null)
  const [lng, setLng] = useState<number | null>(defaultLng ?? null)
  const { data: interests } = useQuery({ queryKey: ['interests'], queryFn: getAllInterests })

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  })

  const handleFormSubmit = (formData: EventFormValues) => {
    onSubmit({
      title: formData.title,
      category: formData.category,
      description: formData.description || undefined,
      startsAt: formData.startsAt,             // camelCase → backend DTO
      durationMinutes: formData.durationMinutes,
      maxParticipants: formData.maxParticipants,
      address: formData.address || undefined,
      city: formData.city || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    })
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'rgba(162,155,254,0.5)'
    e.target.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.1)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--z-border)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Event Title</label>
        <input {...register('title')} style={inputStyle} placeholder="What's happening?" onFocus={onFocus} onBlur={onBlur} />
        {errors.title && <p style={errStyle}>{errors.title.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <select {...register('category')} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
          <option value="">Select a category</option>
          {(interests ?? []).map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
        </select>
        {errors.category && <p style={errStyle}>{errors.category.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea {...register('description')} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 } as React.CSSProperties} placeholder="Describe your event…" onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Starts At</label>
          <input type="datetime-local" {...register('startsAt')} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          {errors.startsAt && <p style={errStyle}>{errors.startsAt.message}</p>}
        </div>
        <div>
          <label style={labelStyle}>Duration (min)</label>
          <input type="number" {...register('durationMinutes')} style={inputStyle} placeholder="60" onFocus={onFocus} onBlur={onBlur} />
          {errors.durationMinutes && <p style={errStyle}>{errors.durationMinutes.message}</p>}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Max Participants</label>
        <input type="number" {...register('maxParticipants')} style={inputStyle} placeholder="20" onFocus={onFocus} onBlur={onBlur} />
        {errors.maxParticipants && <p style={errStyle}>{errors.maxParticipants.message}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Address</label>
          <input {...register('address')} style={inputStyle} placeholder="123 Main St" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input {...register('city')} style={inputStyle} placeholder="Casablanca" onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>

      {showStatus && (
        <div>
          <label style={labelStyle}>Status</label>
          <select {...register('status')} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
            <option value="">Keep current</option>
            <option value="open">Open</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>
          Location <span style={{ color: 'var(--z-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(click map to pin)</span>
        </label>
        <EventMap lat={lat} lng={lng} onPositionChange={(nlat, nlng) => { setLat(nlat); setLng(nlng) }} />
        {lat && lng && <p style={{ fontSize: 11, color: 'var(--z-mint)', marginTop: 6 }}>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</p>}
      </div>

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--z-coral)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, background: isSubmitting ? 'rgba(108,92,231,0.5)' : 'var(--z-accent)', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: '"Sora",sans-serif', transition: 'background 0.15s' }}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
