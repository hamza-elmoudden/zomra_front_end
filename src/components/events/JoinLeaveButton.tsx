import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent, leaveEvent } from '@/api/events.api'
import type { EventParticipant } from '@/types/event.types'
import { useAuthStore } from '@/store/authStore'
import { UserPlus, LogOut, Clock } from 'lucide-react'

interface JoinLeaveButtonProps {
  eventId: string
  hostId: string
  currentCount: number
  maxParticipants: number
  participants: EventParticipant[]
}

export default function JoinLeaveButton({ eventId, hostId, currentCount, maxParticipants, participants }: JoinLeaveButtonProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    setError(null)
  }

  const joinMutation = useMutation({ mutationFn: () => joinEvent(eventId), onSuccess: invalidate, onError: () => setError('Failed to join event') })
  const leaveMutation = useMutation({ mutationFn: () => leaveEvent(eventId), onSuccess: invalidate, onError: () => setError('Failed to leave event') })

  if (!userId || userId === hostId) return null

  const myParticipation = participants.find((p) => p.user_id === userId)
  const isFull = currentCount >= maxParticipants
  const isPending = myParticipation?.status === 'pending'
  const isAccepted = myParticipation?.status === 'accepted'

  if (isPending) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,234,167,0.1)', border: '1px solid rgba(255,234,167,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ffeaa7' }}>
      <Clock size={16} style={{ animation: 'spin 2s linear infinite' }} />
      Pending approval…
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (isAccepted) return (
    <div>
      <button
        type="button"
        onClick={() => leaveMutation.mutate()}
        disabled={leaveMutation.isPending}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--z-coral)', fontSize: 15, fontWeight: 600, cursor: leaveMutation.isPending ? 'not-allowed' : 'pointer', opacity: leaveMutation.isPending ? 0.5 : 1, fontFamily: '"Sora",sans-serif', transition: 'all 0.15s' }}
      >
        <LogOut size={16} />
        {leaveMutation.isPending ? 'Leaving…' : 'Leave Event'}
      </button>
      {error && <p style={{ color: 'var(--z-coral)', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )

  return (
    <div>
      <button
        type="button"
        onClick={() => joinMutation.mutate()}
        disabled={isFull || joinMutation.isPending}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 14, background: isFull ? 'var(--z-surface2)' : 'var(--z-accent)', border: `1px solid ${isFull ? 'var(--z-border)' : 'transparent'}`, color: isFull ? 'var(--z-muted)' : 'white', fontSize: 15, fontWeight: 600, cursor: isFull || joinMutation.isPending ? 'not-allowed' : 'pointer', opacity: joinMutation.isPending ? 0.7 : 1, fontFamily: '"Sora",sans-serif', transition: 'all 0.15s' }}
      >
        <UserPlus size={16} />
        {isFull ? 'Event Full' : joinMutation.isPending ? 'Joining…' : 'Join Event'}
      </button>
      {error && <p style={{ color: 'var(--z-coral)', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
