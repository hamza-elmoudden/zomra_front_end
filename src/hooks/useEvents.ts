import { useQuery } from '@tanstack/react-query'
import {
  listEvents,
  getNearbyEvents,
  getEventById,
  getParticipants,
} from '@/api/events.api'
import type { ListEventsParams } from '@/api/events.api'

export function useEvents(params?: ListEventsParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => listEvents(params),
  })
}

export function useNearbyEvents(lat: number | null, lng: number | null, radiusKm = 25) {
  return useQuery({
    queryKey: ['events', 'nearby', lat, lng, radiusKm],
    queryFn: () => getNearbyEvents(lat!, lng!, radiusKm),
    enabled: lat !== null && lng !== null,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id),
    enabled: !!id,
  })
}

export function useParticipants(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId, 'participants'],
    queryFn: () => getParticipants(eventId),
    enabled: !!eventId,
  })
}
