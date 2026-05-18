export type EventStatus = 'draft' | 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'

export interface Event {
  id: string
  host_id: string
  title: string
  category: string
  starts_at: string
  duration_minutes: number
  max_participants: number
  current_count: number
  status: EventStatus
  is_public: boolean
  description?: string
  address?: string
  city?: string
  cover_image_url?: string
  lat?: number
  lng?: number
  created_at?: string
  updated_at?: string
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'left'
  joined_at: string
}
