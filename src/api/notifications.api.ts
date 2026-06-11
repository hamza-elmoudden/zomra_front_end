import api from './axios'

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// GET /notifications
export function getNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>('/notifications').then((r) => r.data)
}

// PATCH /notifications/:id/read
export function markNotificationRead(id: string): Promise<void> {
  return api.patch(`/notifications/${id}/read`)
}
