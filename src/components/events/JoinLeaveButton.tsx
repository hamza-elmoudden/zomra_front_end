import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent, leaveEvent } from '@/api/events.api'
import type { EventParticipant } from '@/types/event.types'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

interface JoinLeaveButtonProps {
  eventId: string
  hostId: string
  currentCount: number
  maxParticipants: number
  participants: EventParticipant[]
}

export default function JoinLeaveButton({
  eventId,
  hostId,
  currentCount,
  maxParticipants,
  participants,
}: JoinLeaveButtonProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const joinMutation = useMutation({
    mutationFn: () => joinEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      setError(null)
    },
    onError: () => setError('Failed to join event'),
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      setError(null)
    },
    onError: () => setError('Failed to leave event'),
  })

  if (!userId) return null
  if (userId === hostId) return null

  const myParticipation = participants.find((p) => p.user_id === userId)
  const isFull = currentCount >= maxParticipants
  const isPending = myParticipation?.status === 'pending'
  const isAccepted = myParticipation?.status === 'accepted'

  if (isPending) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        Pending approval...
      </div>
    )
  }

  if (isAccepted) {
    return (
      <button
        type="button"
        onClick={() => leaveMutation.mutate()}
        disabled={leaveMutation.isPending}
        className="rounded-xl border border-red-300 px-6 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {leaveMutation.isPending ? 'Leaving...' : 'Leave'}
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => joinMutation.mutate()}
        disabled={isFull || joinMutation.isPending}
        className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isFull ? 'Event Full' : joinMutation.isPending ? 'Joining...' : 'Join'}
      </button>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
