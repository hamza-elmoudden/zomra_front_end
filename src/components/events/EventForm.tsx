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
  starts_at: z.string().min(1, 'Start date/time is required'),
  duration_minutes: z.coerce.number().min(15, 'Minimum 15 minutes'),
  max_participants: z.coerce.number().min(2, 'Minimum 2 participants'),
  address: z.string().optional(),
  city: z.string().optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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

export default function EventForm({
  defaultValues,
  defaultLat,
  defaultLng,
  onSubmit,
  isSubmitting,
  submitLabel,
  showStatus = false,
  error,
}: EventFormProps) {
  const [lat, setLat] = useState<number | null>(defaultLat ?? null)
  const [lng, setLng] = useState<number | null>(defaultLng ?? null)

  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: getAllInterests,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  })

  const handleFormSubmit = (formData: EventFormValues) => {
    const payload: CreateEventDto = {
      title: formData.title,
      category: formData.category,
      description: formData.description || undefined,
      starts_at: formData.starts_at,
      duration_minutes: formData.duration_minutes,
      max_participants: formData.max_participants,
      address: formData.address || undefined,
      city: formData.city || undefined,
      cover_image_url: formData.cover_image_url || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
        <input
          {...register('title')}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Event title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
        <select
          {...register('category')}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Select a category</option>
          {(interests ?? []).map((i) => (
            <option key={i.id} value={i.name}>
              {i.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Describe your event..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Starts At</label>
          <input
            type="datetime-local"
            {...register('starts_at')}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          {errors.starts_at && (
            <p className="mt-1 text-sm text-red-500">{errors.starts_at.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            {...register('duration_minutes')}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="60"
          />
          {errors.duration_minutes && (
            <p className="mt-1 text-sm text-red-500">{errors.duration_minutes.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Max Participants</label>
        <input
          type="number"
          {...register('max_participants')}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="20"
        />
        {errors.max_participants && (
          <p className="mt-1 text-sm text-red-500">{errors.max_participants.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
          <input
            {...register('address')}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="123 Main St"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
          <input
            {...register('city')}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="New York"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Cover Image URL</label>
        <input
          {...register('cover_image_url')}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="https://..."
        />
        {errors.cover_image_url && (
          <p className="mt-1 text-sm text-red-500">{errors.cover_image_url.message}</p>
        )}
      </div>

      {showStatus && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            {...register('status')}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Keep current</option>
            <option value="cancelled">Cancelled</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Location <span className="text-gray-400">(click map to set pin)</span>
        </label>
        <EventMap
          lat={lat}
          lng={lng}
          onPositionChange={(newLat, newLng) => {
            setLat(newLat)
            setLng(newLng)
          }}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
