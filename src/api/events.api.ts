import api from './axios'
import type { Event, EventParticipant } from '@/types/event.types'

export interface ListEventsParams {
  city?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}

export interface CreateEventDto {
  title: string
  category: string
  description?: string
  starts_at: string
  duration_minutes: number
  max_participants: number
  address?: string
  city?: string
  cover_image_url?: string
  lat?: number
  lng?: number
  is_public?: boolean
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: string
}

export function createEvent(data: CreateEventDto): Promise<Event> {
  return api.post<Event>('/events', data).then((r) => r.data)
}

export function listEvents(params?: ListEventsParams): Promise<Event[]> {
  return api.get<Event[]>('/events', { params }).then((r) => r.data)
}

export function getNearbyEvents(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Event[]> {
  return api
    .get<Event[]>('/events/nearby', { params: { lat, lng, radiusKm } })
    .then((r) => r.data)
}

export function getEventById(id: string): Promise<Event> {
  return api.get<Event>(`/events/${id}`).then((r) => r.data)
}

export function updateEvent(
  id: string,
  data: UpdateEventDto,
): Promise<Event> {
  return api.patch<Event>(`/events/${id}`, data).then((r) => r.data)
}

export function deleteEvent(id: string): Promise<void> {
  return api.delete(`/events/${id}`)
}

export function joinEvent(eventId: string): Promise<EventParticipant> {
  return api
    .post<EventParticipant>(`/events/${eventId}/join`)
    .then((r) => r.data)
}

export function leaveEvent(eventId: string): Promise<void> {
  return api.post(`/events/${eventId}/leave`)
}

export function getParticipants(
  eventId: string,
): Promise<EventParticipant[]> {
  return api
    .get<EventParticipant[]>(`/events/${eventId}/participants`)
    .then((r) => r.data)
}

export function manageParticipant(
  eventId: string,
  userId: string,
  action: 'accept' | 'reject',
): Promise<void> {
  return api.patch(`/events/${eventId}/participants/${userId}`, { action })
}


