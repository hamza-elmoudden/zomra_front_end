import api from './axios'
import type { Event, EventParticipant } from '@/types/event.types'
import { getEventMedia } from './media.api'

export interface ListEventsParams {
  city?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}

// Backend DTO uses camelCase: startsAt, durationMinutes, maxParticipants
export interface CreateEventDto {
  title: string
  category: string
  description?: string
  startsAt: string          // backend field name
  durationMinutes?: number  // backend field name
  maxParticipants?: number  // backend field name
  address?: string
  city?: string
  lat?: number
  lng?: number
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: string
}

/**
 * If the backend doesn't populate cover_image_url, fetch the first media
 * item for each event and attach it. Fires requests in parallel.
 */
async function attachCoverImages(events: Event[]): Promise<Event[]> {
  const results = await Promise.allSettled(
    events.map(async (event) => {
      if (event.cover_image_url) return event
      const media = await getEventMedia(event.id)
      const first = media.find((m) => m.media_type === 'photo') ?? media[0]
      return first ? { ...event, cover_image_url: first.url } : event
    }),
  )
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : events[i]))
}

// Uses the dedicated GET /events/my endpoint (requires auth)
export function getMyEvents(): Promise<Event[]> {
  return api.get<Event[]>('/events/my').then((r) => attachCoverImages(r.data))
}

export function createEvent(data: CreateEventDto): Promise<Event> {
  return api.post<Event>('/events', data).then((r) => r.data)
}

export function listEvents(params?: ListEventsParams): Promise<Event[]> {
  return api.get<Event[]>('/events', { params }).then((r) => attachCoverImages(r.data))
}

export function getNearbyEvents(lat: number, lng: number, radiusKm: number): Promise<Event[]> {
  return api
    .get<Event[]>('/events/nearby', { params: { lat, lng, radiusKm } })
    .then((r) => attachCoverImages(r.data))
}

export function getEventById(id: string): Promise<Event> {
  return api.get<Event>(`/events/${id}`).then(async (r) => {
    const event = r.data
    if (event.cover_image_url) return event
    const media = await getEventMedia(event.id)
    const first = media.find((m) => m.media_type === 'photo') ?? media[0]
    return first ? { ...event, cover_image_url: first.url } : event
  })
}

export function updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
  return api.patch<Event>(`/events/${id}`, data).then((r) => r.data)
}

export function deleteEvent(id: string): Promise<void> {
  return api.delete(`/events/${id}`)
}

export function joinEvent(eventId: string): Promise<EventParticipant> {
  return api.post<EventParticipant>(`/events/${eventId}/join`).then((r) => r.data)
}

export function leaveEvent(eventId: string): Promise<void> {
  return api.post(`/events/${eventId}/leave`)
}

export function getParticipants(eventId: string): Promise<EventParticipant[]> {
  return api.get<EventParticipant[]>(`/events/${eventId}/participants`).then((r) => r.data)
}

export function manageParticipant(
  eventId: string,
  userId: string,
  action: 'accept' | 'reject',
): Promise<void> {
  return api.patch(`/events/${eventId}/participants/${userId}`, { action })
}