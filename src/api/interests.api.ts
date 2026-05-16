import api from './axios'
import type { Interest } from '@/types/interest.types'

export function getAllInterests(): Promise<Interest[]> {
  return api.get<Interest[]>('/interests/all').then((r) => r.data)
}

export function getInterestById(id: number): Promise<Interest> {
  return api.get<Interest>(`/interests/${id}`).then((r) => r.data)
}
