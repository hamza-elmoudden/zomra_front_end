import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const clearUser = useAuthStore((s) => s.clearUser)

  return { user, isAuthenticated, clearUser }
}
