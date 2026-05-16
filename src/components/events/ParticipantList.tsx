import { useMutation, useQueryClient } from '@tanstack/react-query'
import { manageParticipant } from '@/api/events.api'
import { useAuthStore } from '@/store/authStore'
import { Check, X, User } from 'lucide-react'
import type { EventParticipant } from '@/types/event.types'

interface ParticipantListProps {
  eventId: string
  hostId: string
  participants: EventParticipant[]
}

export default function ParticipantList({
  eventId,
  hostId,
  participants,
}: ParticipantListProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const isHost = userId === hostId
  const queryClient = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: (participantUserId: string) =>
      manageParticipant(eventId, participantUserId, 'accept'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (participantUserId: string) =>
      manageParticipant(eventId, participantUserId, 'reject'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const accepted = participants.filter((p) => p.status === 'accepted')
  const pending = participants.filter((p) => p.status === 'pending')

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          Participants ({accepted.length})
        </h4>
        {accepted.length === 0 ? (
          <p className="text-sm text-gray-400">No participants yet.</p>
        ) : (
          <ul className="space-y-2">
            {accepted.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span>{p.user_id === userId ? 'You' : p.user_id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isHost && pending.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-amber-700">
            Pending Requests ({pending.length})
          </h4>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"
              >
                <span className="text-sm text-gray-600">{p.user_id}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptMutation.mutate(p.user_id)}
                    disabled={acceptMutation.isPending}
                    className="rounded-full bg-green-100 p-1 text-green-600 transition-colors hover:bg-green-200"
                    title="Accept"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectMutation.mutate(p.user_id)}
                    disabled={rejectMutation.isPending}
                    className="rounded-full bg-red-100 p-1 text-red-600 transition-colors hover:bg-red-200"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
