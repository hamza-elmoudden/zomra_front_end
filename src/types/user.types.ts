export type UserRole = 'user' | 'admin' | 'observer'
export type UserStatus = 'active' | 'blocked' | 'banned'

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
  status: UserStatus
  created_at: string
  role: UserRole
}

export interface StaffUser {
  id: string
  username: string
  email: string
  full_name: string
  role: 'admin' | 'observer'
  status: UserStatus
  created_at: string
}
