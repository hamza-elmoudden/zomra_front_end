import api from './axios'
import type { User } from '@/types/user.types'
import type { Review } from '@/types/review.types'

export function getMe(): Promise<User> {
  return api.get<User>('/users/me').then((r) => r.data)
}

export function getUserById(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`).then((r) => r.data)
}

export function getUserReviews(userId: string): Promise<Review[]> {
  return api.get<Review[]>(`/users/${userId}/reviews`).then((r) => r.data)
}
