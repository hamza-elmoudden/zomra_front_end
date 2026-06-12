import api from './axios'
import type { StaffUser } from '@/types/user.types'
import type { Report } from '@/types/report.types'

export type { Report }

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

export interface CreateReportDto {
  targetType: 'user' | 'event' | 'review'
  targetId: string
  reason: string
  details?: string
}

// POST /admin/auth/login
export function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return api.post<AdminLoginResponse>('/admin/auth/login', { email, password }).then((r) => r.data)
}

// GET /admin/users
export function listStaffUsers(): Promise<StaffUser[]> {
  return api.get<StaffUser[]>('/admin/users').then((r) => r.data)
}

// POST /admin/users
export function createStaffUser(data: CreateStaffDto): Promise<StaffUser> {
  return api.post<StaffUser>('/admin/users', data).then((r) => r.data)
}

// PATCH /admin/users/:userId/suspend
export function suspendUser(userId: string, suspend: boolean): Promise<void> {
  return api.patch(`/admin/users/${userId}/suspend`, { suspend })
}

// PATCH /admin/events/:eventId/suspend
export function suspendEvent(eventId: string, status: string): Promise<void> {
  return api.patch(`/admin/events/${eventId}/suspend`, { status })
}

// POST /admin/interests
export function addInterestAdmin(name: string, icon?: string, colorHex?: string): Promise<void> {
  return api.post('/admin/interests', { name, icon, colorHex })
}

// DELETE /admin/reviews/:reviewId
export function deleteReview(reviewId: string): Promise<void> {
  return api.delete(`/admin/reviews/${reviewId}`)
}

// POST /reports
export function createReport(data: CreateReportDto): Promise<Report> {
  return api.post<Report>('/reports', data).then((r) => r.data)
}

// GET /reports  (admin/observer only)
export function getReports(): Promise<Report[]> {
  return api.get<Report[]>('/reports').then((r) => r.data)
}

// PATCH /reports/:id  (admin/observer only)
export function resolveReport(
  id: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
): Promise<void> {
  return api.patch(`/reports/${id}`, { status })
}
