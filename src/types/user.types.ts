export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
  city?: string
  country?: string
  lat?: number
  lng?: number
  reputation_score: number
  total_reviews: number
  is_verified: boolean
  is_active: boolean
  created_at: string
  role: UserRole
}
