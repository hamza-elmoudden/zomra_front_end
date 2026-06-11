import api from './axios'
import type { User } from '@/types/user.types'
import type { Review } from '@/types/review.types'

export interface UpdateUserProfileDto {
  phone?: string
  full_name?: string
  bio?: string
  avatar_url?: string
  lat?: number
  lng?: number
  country?: string
  city?: string
}

export function getMe(): Promise<User> {
  return api.get<User>('/users/me').then((r) => r.data)
}

export function updateProfile(data: UpdateUserProfileDto): Promise<boolean> {
  return api.patch<boolean>('/users/me', data).then((r) => r.data)
}

export function getUserById(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`).then((r) => r.data)
}

export function getUserByEmail(email: string): Promise<User> {
  return api.get<User>(`/users/email/${email}`).then((r) => r.data)
}

export function updateUserStatus(id: string, status: string): Promise<User> {
  return api.patch<User>(`/users/${id}/status`, { status }).then((r) => r.data)
}

export function getUserReviews(userId: string): Promise<Review[]> {
  return api.get<Review[]>(`/users/${userId}/reviews`).then((r) => r.data)
}
