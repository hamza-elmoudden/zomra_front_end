import api from './axios'
import type { Interest } from '@/types/interest.types'

export function getMyInterests(): Promise<Interest[]> {
  return api.get<Interest[]>('/user-interests').then((r) => r.data)
}

export function getUserInterest(
  interestId: number,
): Promise<Interest> {
  return api
    .get<Interest>(`/user-interests/${interestId}`)
    .then((r) => r.data)
}

export function addInterest(interestId: number): Promise<Interest> {
  return api
    .post<Interest>('/user-interests', { interestId })
    .then((r) => r.data)
}

export function removeInterest(interestId: number): Promise<void> {
  return api.delete(`/user-interests/${interestId}`)
}
