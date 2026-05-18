export interface Review {
  id: string
  reviewer_id: string
  reviewed_user_id: string
  event_id: string
  rating: number
  comment?: string
  created_at: string
}
