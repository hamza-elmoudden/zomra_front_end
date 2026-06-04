import api from './axios'
import type { StaffUser } from '@/types/user.types'

export interface AdminLoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    fullName: string
    role: 'admin' | 'observer'
  }
}

export interface CreateStaffDto {
  username: string
  email: string
  password: string
  fullName: string
  role: 'admin' | 'observer'
}

export interface Report {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  details?: string
  status: string
  created_at: string
}

export function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return api.post<AdminLoginResponse>('/admin/auth/login', { email, password }).then((r) => r.data)
}

export function listStaffUsers(): Promise<StaffUser[]> {
  return api.get<StaffUser[]>('/admin/users').then((r) => r.data)
}

export function createStaffUser(data: CreateStaffDto): Promise<StaffUser> {
  return api.post<StaffUser>('/admin/users', data).then((r) => r.data)
}

export function suspendUser(userId: string, suspend: boolean): Promise<void> {
  return api.patch(`/admin/users/${userId}/suspend`, { suspend })
}

export function suspendEvent(eventId: string, status: string): Promise<void> {
  return api.patch(`/admin/events/${eventId}/suspend`, { status })
}

export function addInterestAdmin(name: string, icon?: string, colorHex?: string): Promise<void> {
  return api.post('/admin/interests', { name, icon, colorHex })
}

export function deleteReview(reviewId: string): Promise<void> {
  return api.delete(`/admin/reviews/${reviewId}`)
}

export function getReports(): Promise<Report[]> {
  return api.get<Report[]>('/reports').then((r) => r.data)
}

export function resolveReport(id: string, status: 'resolved' | 'dismissed'): Promise<void> {
  return api.patch(`/reports/${id}`, { status })
}
