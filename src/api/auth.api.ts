import api from './axios'
import type { User } from '@/types/user.types'
import type { AuthTokens } from '@/store/authStore'
import { useAuthStore } from '@/store/authStore'

export async function refreshToken(): Promise<AuthTokens> {
  const token = useAuthStore.getState().refreshToken
  const res = await api.post<AuthTokens>('/auth/refresh', { refreshToken: token })
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>('/auth/me')
  return res.data
}
