import api from './axios'
import type { Review } from '@/types/review.types'

export interface CreateReviewDto {
  reviewedUserId: string
  eventId: string
  rating: number
  comment?: string
}

export function createReview(data: CreateReviewDto): Promise<Review> {
  return api.post<Review>('/reviews', data).then((r) => r.data)
}
